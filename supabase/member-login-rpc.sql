create extension if not exists pgcrypto;

create or replace function public.member_login(
    input_membership_id text,
    input_password text
)
returns table (
    member_id uuid,
    membership_id text,
    membership_number text,
    full_name text,
    name text,
    committee text,
    role text,
    avatar_url text,
    image_url text,
    can_create_meetings boolean,
    can_manage_announcements boolean,
    can_manage_committees boolean,
    can_manage_structure boolean,
    can_manage_members boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
    select
        m.id as member_id,
        m.membership_id,
        m.membership_number,
        coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as full_name,
        coalesce(nullif(m.name, ''), nullif(m.full_name, '')) as name,
        m.committee,
        m.role,
        coalesce(nullif(m.avatar_url, ''), nullif(m.image_url, '')) as avatar_url,
        m.image_url,
        coalesce(m.can_create_meetings, false) as can_create_meetings,
        coalesce(m.can_manage_announcements, false) as can_manage_announcements,
        coalesce(m.can_manage_committees, false) as can_manage_committees,
        coalesce(m.can_manage_structure, false) as can_manage_structure,
        coalesce(m.can_manage_members, false) as can_manage_members
    from public.members m
    where input_membership_id is not null
      and input_password is not null
      and btrim(input_membership_id) <> ''
      and m.is_active is true
      and m.password_hash is not null
      and (
          m.membership_number = btrim(input_membership_id)
          or m.membership_id = btrim(input_membership_id)
      )
      and m.password_hash = crypt(input_password, m.password_hash)
    limit 1
$$;

revoke all on function public.member_login(text, text) from public;
grant execute on function public.member_login(text, text) to anon;
