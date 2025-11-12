create table if not exists public.map_invite_links (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps(id) on delete cascade,
  token text not null unique,
  role text check (role in ('owner', 'editor', 'viewer')) default 'viewer' not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  uses integer default 0 not null,
  is_active boolean default true not null
);

create index if not exists map_invite_links_map_id_idx on public.map_invite_links (map_id);

alter table public.map_invite_links enable row level security;

create policy "Owners can manage map invite links"
  on public.map_invite_links
  using (public.is_map_owner(map_invite_links.map_id))
  with check (public.is_map_owner(map_invite_links.map_id));

create or replace function public.create_map_invite_link(
  target_map_id uuid,
  invite_role text default 'viewer',
  expires_in_minutes integer default 4320
)
returns public.map_invite_links
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
  new_record public.map_invite_links%rowtype;
  expires_at timestamp with time zone;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if invite_role not in ('owner', 'editor', 'viewer') then
    raise exception 'Invalid invite role';
  end if;

  if not public.is_map_owner(target_map_id) then
    raise exception 'Only map owners can create invite links';
  end if;

  select encode(gen_random_bytes(16), 'hex') into new_token;

  if expires_in_minutes is not null and expires_in_minutes > 0 then
    expires_at := timezone('utc'::text, now()) + (expires_in_minutes || ' minutes')::interval;
  else
    expires_at := null;
  end if;

  insert into public.map_invite_links (map_id, token, role, created_by, expires_at)
  values (target_map_id, new_token, invite_role, auth.uid(), expires_at)
  returning * into new_record;

  return new_record;
end;
$$;

create or replace function public.get_map_invite_details(invite_token text)
returns table (
  map_id uuid,
  role text,
  map_title text,
  expires_at timestamp with time zone,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select
    il.map_id,
    il.role,
    m.title as map_title,
    il.expires_at,
    il.is_active
  from public.map_invite_links il
  join public.maps m on m.id = il.map_id
  where il.token = invite_token
    and il.is_active = true
    and (il.expires_at is null or il.expires_at > timezone('utc'::text, now()));
$$;

create or replace function public.redeem_map_invite(invite_token text)
returns public.map_members
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.map_invite_links%rowtype;
  membership_record public.map_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into invite_record
  from public.map_invite_links
  where token = invite_token
    and is_active = true
    and (expires_at is null or expires_at > timezone('utc'::text, now()))
  for update;

  if not found then
    raise exception 'This invite is no longer active';
  end if;

  if exists(
    select 1 from public.map_members
    where map_id = invite_record.map_id
      and profile_id = auth.uid()
  ) then
    return null;
  end if;

  insert into public.map_members (map_id, profile_id, role, invited_at)
  values (invite_record.map_id, auth.uid(), invite_record.role, timezone('utc'::text, now()))
  on conflict do nothing
  returning * into membership_record;

  update public.map_invite_links
  set uses = uses + 1
  where id = invite_record.id;

  return membership_record;
end;
$$;

