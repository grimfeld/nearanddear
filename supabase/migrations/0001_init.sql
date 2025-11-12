create extension if not exists "pgcrypto";

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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  map_id uuid references public.maps(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'editor', 'viewer')) default 'viewer' not null,
  invited_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (map_id, profile_id)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
    and (
      6371 * acos(
        cos(radians(latitude)) * cos(radians(l.latitude)) *
        cos(radians(l.longitude) - radians(longitude)) +
        sin(radians(latitude)) * sin(radians(l.latitude))
      )
    ) <= radius_km
  order by distance_km;
$$ language sql stable;

create or replace function public.is_map_owner(map_id uuid)
returns boolean
security definer
set search_path = public
language sql
stable
as $$
  select exists (
    select 1
    from public.maps m
    where m.id = is_map_owner.map_id
      and m.owner_id = auth.uid()
  );
$$;

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
  for select using (
    profile_id = auth.uid()
    or public.is_map_owner(map_members.map_id)
  );

create policy "Owner can upsert members" on public.map_members
  for insert with check ( public.is_map_owner(map_members.map_id) );

create policy "Owner can update members" on public.map_members
  for update using ( public.is_map_owner(map_members.map_id) );

create policy "Owner can remove members" on public.map_members
  for delete using ( public.is_map_owner(map_members.map_id) );

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


drop policy if exists "Users can create maps" on public.maps;

create policy "Users can create maps" on public.maps
  for insert with check (
    auth.uid() = owner_id
  );

drop policy if exists "Profiles can create self" on public.profiles;

create policy "Profiles can create self" on public.profiles
  for insert with check (
    auth.uid() = id
  );

create or replace function public.ensure_profile_for_map_owner()
returns trigger
security definer
set search_path = public, auth
language plpgsql
as $$
begin
  if new.owner_id is null then
    raise exception 'owner_id must be provided when creating a map';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = new.owner_id
  ) then
    insert into public.profiles (id, email, display_name)
    select
      u.id,
      u.email,
      coalesce(
        nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
        nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
        u.email
      )
    from auth.users u
    where u.id = new.owner_id
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_profile_for_map_owner on public.maps;

create trigger ensure_profile_for_map_owner
before insert on public.maps
for each row
execute function public.ensure_profile_for_map_owner();

create table if not exists public.map_invites (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps(id) on delete cascade,
  email text not null,
  role text check (role in ('owner', 'editor', 'viewer')) default 'viewer' not null,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accepted_at timestamp with time zone,
  check (email = lower(email)),
  unique (map_id, email)
);

alter table public.map_invites enable row level security;

create policy "Members can view map invites"
  on public.map_invites for select
  using (
    public.is_map_owner(map_invites.map_id)
    or exists (
      select 1
      from public.map_members mm
      where mm.map_id = map_invites.map_id
        and mm.profile_id = auth.uid()
    )
    or (
      auth.uid() is not null
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.email is not null
          and lower(p.email) = map_invites.email
      )
    )
  );

create policy "Owners can manage map invites"
  on public.map_invites for insert
  with check (public.is_map_owner(map_invites.map_id));

create policy "Owners can update invites"
  on public.map_invites for update
  using (public.is_map_owner(map_invites.map_id))
  with check (public.is_map_owner(map_invites.map_id));

create policy "Owners can delete invites"
  on public.map_invites for delete
  using (public.is_map_owner(map_invites.map_id));

create or replace function public.accept_map_invites_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.map_members (map_id, profile_id, role, invited_at)
  select mi.map_id, new.id, mi.role, timezone('utc'::text, now())
  from public.map_invites mi
  where mi.email = lower(new.email)
    and mi.accepted_at is null
    and not exists (
      select 1 from public.map_members mm
      where mm.map_id = mi.map_id
        and mm.profile_id = new.id
    );

  update public.map_invites
  set accepted_at = timezone('utc'::text, now())
  where email = lower(new.email)
    and accepted_at is null;

  return new;
end;
$$;

drop trigger if exists accept_map_invites_on_profile on public.profiles;

create trigger accept_map_invites_on_profile
after insert on public.profiles
for each row
execute function public.accept_map_invites_for_profile();

create or replace function public.accept_map_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_email text;
begin
  select email into profile_email
  from public.profiles
  where id = auth.uid();

  if profile_email is null then
    return;
  end if;

  insert into public.map_members (map_id, profile_id, role, invited_at)
  select mi.map_id, auth.uid(), mi.role, timezone('utc'::text, now())
  from public.map_invites mi
  where mi.email = lower(profile_email)
    and mi.accepted_at is null
    and not exists (
      select 1
      from public.map_members mm
      where mm.map_id = mi.map_id
        and mm.profile_id = auth.uid()
    );

  update public.map_invites
  set accepted_at = timezone('utc'::text, now())
  where email = lower(profile_email)
    and accepted_at is null;
end;
$$;

create table if not exists public.map_favorites (
  id uuid primary key default gen_random_uuid(),
  map_id uuid references public.maps(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (map_id, profile_id)
);

create or replace function public.can_access_map(map_uuid uuid)
returns boolean
security definer
set search_path = public
language sql
stable
as $$
  select exists (
    select 1
    from public.maps m
    where m.id = map_uuid
      and (
        m.is_public
        or m.owner_id = auth.uid()
        or exists (
          select 1
          from public.map_members mm
          where mm.map_id = m.id
            and mm.profile_id = auth.uid()
        )
      )
  );
$$;

alter table public.map_favorites enable row level security;

create policy "Favorites are readable for accessible maps" on public.map_favorites
  for select using ( public.can_access_map(map_favorites.map_id) );

create policy "Users can favorite accessible maps" on public.map_favorites
  for insert
  with check (
    profile_id = auth.uid()
    and public.can_access_map(map_favorites.map_id)
  );

create policy "Users can remove their favorites" on public.map_favorites
  for delete using ( profile_id = auth.uid() );

