create extension if not exists pgcrypto;

create or replace function public.member_login(
    input_membership_id text,
    input_password text
)
returns table (
    id uuid,
    membership_id text,
    name text,
    committee text,
    role text,
    avatar_url text,
    can_create_meetings boolean,
    can_manage_announcements boolean,
    can_manage_committees boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
    select
        m.id,
        m.membership_id,
        m.name,
        m.committee,
        m.role,
        m.avatar_url,
        m.can_create_meetings,
        m.can_manage_announcements,
        m.can_manage_committees
    from public.members m
    where m.membership_id = input_membership_id
      and m.password_hash is not null
      and m.password_hash = crypt(input_password, m.password_hash)
    limit 1
$$;

revoke all on function public.member_login(text, text) from public;
grant execute on function public.member_login(text, text) to anon;
