create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Profiles table mirrors auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  favorite_tags text[],
  city text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.maps (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  is_public boolean default false,
  cover_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger maps_updated_at
before update on public.maps
for each row execute function public.set_updated_at();

create table if not exists public.map_members (
  id uuid primary key default uuid_generate_v4(),
  map_id uuid references public.maps(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'editor', 'viewer')) default 'viewer' not null,
  invited_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (map_id, profile_id)
);

create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  map_id uuid references public.maps(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  type text,
  tags text[],
  website text,
  phone text,
  opening_hours jsonb,
  google_place_id text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  rating smallint check (rating between 1 and 5) not null,
  comment text,
  visited_at date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create view public.location_rating_summary as
select
  location_id,
  avg(rating) as average_rating,
  count(*) as review_count
from public.reviews
group by location_id;

create or replace function public.get_locations_within_radius(
  map_id uuid,
  latitude double precision,
  longitude double precision,
  radius_km double precision
) returns table (
  id uuid,
  name text,
  distance_km double precision
) as $$
  select
    l.id,
    l.name,
    ( 6371 * acos(
        cos(radians(latitude)) * cos(radians(l.latitude)) *
        cos(radians(l.longitude) - radians(longitude)) +
        sin(radians(latitude)) * sin(radians(l.latitude))
      )
    ) as distance_km
  from public.locations l
  where l.map_id = get_locations_within_radius.map_id
  having ( 6371 * acos(
      cos(radians(latitude)) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(longitude)) +
      sin(radians(latitude)) * sin(radians(l.latitude))
    )
  ) <= radius_km
  order by distance_km;
$$ language sql stable;

alter table public.profiles enable row level security;
alter table public.maps enable row level security;
alter table public.map_members enable row level security;
alter table public.locations enable row level security;
alter table public.reviews enable row level security;

create policy "Profiles are readable by self" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles are updateable by self" on public.profiles
  for update using (auth.uid() = id);

create policy "Maps owned or shared are selectable" on public.maps
  for select using (
    is_public
    or owner_id = auth.uid()
    or exists(select 1 from public.map_members mm where mm.map_id = maps.id and mm.profile_id = auth.uid())
  );

create policy "Maps owned are updateable" on public.maps
  for update using ( owner_id = auth.uid() );

create policy "Owners can delete maps" on public.maps
  for delete using ( owner_id = auth.uid() );

create policy "Members can manage membership" on public.map_members
  for select using ( profile_id = auth.uid() or exists (select 1 from public.maps m where m.id = map_members.map_id and m.owner_id = auth.uid()) );

create policy "Owner can upsert members" on public.map_members
  for insert with check ( exists (select 1 from public.maps m where m.id = map_members.map_id and m.owner_id = auth.uid()) );

create policy "Owner can update members" on public.map_members
  for update using ( exists (select 1 from public.maps m where m.id = map_members.map_id and m.owner_id = auth.uid()) );

create policy "Owner can remove members" on public.map_members
  for delete using ( exists (select 1 from public.maps m where m.id = map_members.map_id and m.owner_id = auth.uid()) );

create policy "Members can view locations" on public.locations
  for select using (
    exists (select 1 from public.maps m where m.id = locations.map_id and (m.owner_id = auth.uid() or m.is_public))
    or exists (select 1 from public.map_members mm where mm.map_id = locations.map_id and mm.profile_id = auth.uid())
  );

create policy "Editors can insert locations" on public.locations
  for insert with check (
    exists (select 1 from public.maps m where m.id = locations.map_id and m.owner_id = auth.uid())
    or exists (
      select 1 from public.map_members mm
      where mm.map_id = locations.map_id and mm.profile_id = auth.uid() and mm.role in ('owner','editor')
    )
  );

create policy "Editors can update locations" on public.locations
  for update using (
    exists (select 1 from public.maps m where m.id = locations.map_id and m.owner_id = auth.uid())
    or exists (
      select 1 from public.map_members mm
      where mm.map_id = locations.map_id and mm.profile_id = auth.uid() and mm.role in ('owner','editor')
    )
  );

create policy "Editors can delete locations" on public.locations
  for delete using (
    exists (select 1 from public.maps m where m.id = locations.map_id and m.owner_id = auth.uid())
    or exists (
      select 1 from public.map_members mm
      where mm.map_id = locations.map_id and mm.profile_id = auth.uid() and mm.role in ('owner','editor')
    )
  );

create policy "Members can view reviews" on public.reviews
  for select using (
    exists (
      select 1 from public.locations l
      join public.maps m on m.id = l.map_id
      where l.id = reviews.location_id
        and (m.owner_id = auth.uid() or m.is_public)
    )
    or exists (
      select 1 from public.map_members mm
      join public.locations l on l.map_id = mm.map_id
      where l.id = reviews.location_id and mm.profile_id = auth.uid()
    )
  );

create policy "Members can insert reviews" on public.reviews
  for insert with check (
    exists (
      select 1 from public.locations l
      join public.maps m on m.id = l.map_id
      where l.id = reviews.location_id and (m.owner_id = auth.uid() or m.is_public)
    )
    or exists (
      select 1 from public.map_members mm
      join public.locations l on l.map_id = mm.map_id
      where l.id = reviews.location_id and mm.profile_id = auth.uid()
    )
  );

create policy "Authors can update their reviews" on public.reviews
  for update using (profile_id = auth.uid());

create policy "Authors can delete their reviews" on public.reviews
  for delete using (profile_id = auth.uid());

