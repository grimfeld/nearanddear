-- Create map_tags table to store unique tags per map
create table if not exists public.map_tags (
  id uuid primary key default gen_random_uuid(),
  map_id uuid references public.maps(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (map_id, name)
);

create index if not exists map_tags_map_id_idx on public.map_tags (map_id);
create index if not exists map_tags_name_idx on public.map_tags (name);

-- Create location_tags junction table
create table if not exists public.location_tags (
  location_id uuid references public.locations(id) on delete cascade not null,
  tag_id uuid references public.map_tags(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (location_id, tag_id)
);

create index if not exists location_tags_location_id_idx on public.location_tags (location_id);
create index if not exists location_tags_tag_id_idx on public.location_tags (tag_id);

-- Create view for map tags with usage counts (optimized for autocomplete suggestions)
create or replace view public.map_tags_with_usage as
select
  mt.id,
  mt.map_id,
  mt.name,
  mt.created_at,
  count(lt.location_id) as usage_count
from public.map_tags mt
left join public.location_tags lt on lt.tag_id = mt.id
group by mt.id, mt.map_id, mt.name, mt.created_at
order by usage_count desc, mt.name asc;

-- Enable RLS
alter table public.map_tags enable row level security;
alter table public.location_tags enable row level security;

-- RLS policies for map_tags
-- Users can view tags for maps they can access
create policy "Users can view tags for accessible maps" on public.map_tags
  for select using (
    exists (
      select 1 from public.maps m
      where m.id = map_tags.map_id
        and (
          m.is_public
          or m.owner_id = auth.uid()
          or exists (
            select 1 from public.map_members mm
            where mm.map_id = m.id
              and mm.profile_id = auth.uid()
          )
        )
    )
  );

-- Editors can create tags for maps they can edit
create policy "Editors can create tags" on public.map_tags
  for insert with check (
    exists (
      select 1 from public.maps m
      where m.id = map_tags.map_id
        and (
          m.owner_id = auth.uid()
          or exists (
            select 1 from public.map_members mm
            where mm.map_id = map_tags.map_id
              and mm.profile_id = auth.uid()
              and mm.role in ('owner', 'editor')
          )
        )
    )
  );

-- RLS policies for location_tags
-- Users can view location tags for locations they can access
create policy "Users can view location tags" on public.location_tags
  for select using (
    exists (
      select 1 from public.locations l
      join public.maps m on m.id = l.map_id
      where l.id = location_tags.location_id
        and (
          m.is_public
          or m.owner_id = auth.uid()
          or exists (
            select 1 from public.map_members mm
            where mm.map_id = l.map_id
              and mm.profile_id = auth.uid()
          )
        )
    )
  );

-- Editors can manage location tags
create policy "Editors can manage location tags" on public.location_tags
  for all using (
    exists (
      select 1 from public.locations l
      join public.maps m on m.id = l.map_id
      where l.id = location_tags.location_id
        and (
          m.owner_id = auth.uid()
          or exists (
            select 1 from public.map_members mm
            where mm.map_id = l.map_id
              and mm.profile_id = auth.uid()
              and mm.role in ('owner', 'editor')
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.locations l
      join public.maps m on m.id = l.map_id
      where l.id = location_tags.location_id
        and (
          m.owner_id = auth.uid()
          or exists (
            select 1 from public.map_members mm
            where mm.map_id = l.map_id
              and mm.profile_id = auth.uid()
              and mm.role in ('owner', 'editor')
          )
        )
    )
  );

-- Function to migrate existing tags from locations.tags array to new structure
create or replace function public.migrate_location_tags()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  location_record record;
  tag_name text;
  tag_id uuid;
  map_id_val uuid;
begin
  -- Loop through all locations that have tags
  for location_record in
    select id, map_id, tags
    from public.locations
    where tags is not null
      and array_length(tags, 1) > 0
  loop
    map_id_val := location_record.map_id;
    
    -- Loop through each tag in the array
    foreach tag_name in array location_record.tags
    loop
      -- Trim and normalize tag name
      tag_name := trim(lower(tag_name));
      
      if tag_name = '' then
        continue;
      end if;
      
      -- Find or create the tag in map_tags
      select id into tag_id
      from public.map_tags
      where map_id = map_id_val
        and name = tag_name;
      
      if tag_id is null then
        insert into public.map_tags (map_id, name)
        values (map_id_val, tag_name)
        returning id into tag_id;
      end if;
      
      -- Link location to tag (ignore if already exists)
      insert into public.location_tags (location_id, tag_id)
      values (location_record.id, tag_id)
      on conflict (location_id, tag_id) do nothing;
    end loop;
  end loop;
end;
$$;

-- Run the migration
select public.migrate_location_tags();

-- Drop the migration function after use
drop function if exists public.migrate_location_tags();

-- Note: We keep the tags column in locations table for backward compatibility
-- but new code should use the map_tags and location_tags tables
-- The tags column can be removed in a future migration after confirming
-- all applications have been updated

