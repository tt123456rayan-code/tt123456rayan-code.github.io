create extension if not exists pgcrypto;

alter table public.members
add column if not exists can_manage_announcements boolean not null default false;

update public.members
set can_manage_announcements = membership_id in ('NYIJO0001', 'NYIJO0002', 'NYIJO0003');

grant select, insert, delete on public.meetings to authenticated;
grant update (title, meeting_date, meeting_time, location_or_link, meeting_type, details) on public.meetings to authenticated;
alter table public.meetings replica identity full;

drop policy if exists meetings_update_authorized on public.meetings;
create policy meetings_update_authorized
on public.meetings
for update
to authenticated
using (public.current_member_can_create_meetings())
with check (public.current_member_can_create_meetings());

drop policy if exists meetings_delete_authorized on public.meetings;
create policy meetings_delete_authorized
on public.meetings
for delete
to authenticated
using (public.current_member_can_create_meetings());

create table if not exists public.announcements (
    id uuid primary key default gen_random_uuid(),
    title text not null check (char_length(title) between 3 and 160),
    body text not null check (char_length(body) between 1 and 3000),
    created_by uuid not null references public.members(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select, insert, delete on public.announcements to authenticated;
grant update (title, body) on public.announcements to authenticated;
alter table public.announcements replica identity full;

create or replace function public.current_member_can_manage_announcements()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((
        select m.can_manage_announcements
        from public.members m
        where m.auth_user_id = auth.uid()
        limit 1
    ), false)
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at();

drop function if exists public.get_my_profile();
create or replace function public.get_my_profile()
returns table (
    id uuid,
    membership_id text,
    name text,
    committee text,
    role text,
    avatar_url text,
    can_create_meetings boolean,
    can_manage_announcements boolean
)
language sql
stable
security definer
set search_path = public
as $$
    select
        m.id,
        m.membership_id,
        m.name,
        m.committee,
        m.role,
        m.avatar_url,
        m.can_create_meetings,
        m.can_manage_announcements
    from public.members m
    where m.auth_user_id = auth.uid()
    limit 1
$$;

create or replace function public.get_announcements()
returns table (
    id uuid,
    title text,
    body text,
    creator_name text,
    created_at timestamptz,
    updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
    select
        an.id,
        an.title,
        an.body,
        creator.name as creator_name,
        an.created_at,
        an.updated_at
    from public.announcements an
    join public.members creator on creator.id = an.created_by
    where public.current_member_id() is not null
    order by an.created_at desc
$$;

grant execute on function public.current_member_can_manage_announcements() to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_announcements() to authenticated;

drop policy if exists announcements_select_authenticated on public.announcements;
create policy announcements_select_authenticated
on public.announcements
for select
to authenticated
using (public.current_member_id() is not null);

drop policy if exists announcements_insert_authorized on public.announcements;
create policy announcements_insert_authorized
on public.announcements
for insert
to authenticated
with check (
    created_by = public.current_member_id()
    and public.current_member_can_manage_announcements()
);

drop policy if exists announcements_update_authorized on public.announcements;
create policy announcements_update_authorized
on public.announcements
for update
to authenticated
using (public.current_member_can_manage_announcements())
with check (public.current_member_can_manage_announcements());

drop policy if exists announcements_delete_authorized on public.announcements;
create policy announcements_delete_authorized
on public.announcements
for delete
to authenticated
using (public.current_member_can_manage_announcements());

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
           select 1
           from pg_publication_rel pr
           join pg_publication p on p.oid = pr.prpubid
           where p.pubname = 'supabase_realtime'
             and pr.prrelid = 'public.meetings'::regclass
       ) then
        alter publication supabase_realtime add table public.meetings;
    end if;

    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
           select 1
           from pg_publication_rel pr
           join pg_publication p on p.oid = pr.prpubid
           where p.pubname = 'supabase_realtime'
             and pr.prrelid = 'public.announcements'::regclass
       ) then
        alter publication supabase_realtime add table public.announcements;
    end if;
end $$;
