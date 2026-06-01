-- Safe member login audit.
-- Run manually in Supabase SQL Editor.
-- This file never selects or prints password_hash values.

select count(*) as total_members
from public.members;

select count(*) as active_members
from public.members
where is_active is true;

select count(*) as inactive_members
from public.members
where is_active is not true;

select
    id,
    membership_number,
    membership_id,
    full_name,
    name,
    committee,
    role,
    is_active,
    password_hash is not null as has_password_hash
from public.members
where nullif(btrim(coalesce(membership_number, '')), '') is null
  and nullif(btrim(coalesce(membership_id, '')), '') is null
order by created_at desc nulls last, id;

select
    id,
    membership_number,
    membership_id,
    full_name,
    name,
    committee,
    role,
    is_active,
    password_hash is not null as has_password_hash
from public.members
where password_hash is null
order by created_at desc nulls last, id;

select
    membership_number,
    count(*) as duplicate_count
from public.members
where nullif(btrim(coalesce(membership_number, '')), '') is not null
group by membership_number
having count(*) > 1
order by duplicate_count desc, membership_number;

select
    membership_id,
    count(*) as duplicate_count
from public.members
where nullif(btrim(coalesce(membership_id, '')), '') is not null
group by membership_id
having count(*) > 1
order by duplicate_count desc, membership_id;

select
    id,
    membership_number,
    membership_id,
    full_name,
    name,
    committee,
    role,
    is_active,
    password_hash is not null as has_password_hash,
    can_create_meetings,
    can_manage_announcements,
    can_manage_committees,
    can_manage_structure,
    can_manage_members,
    created_at,
    updated_at
from public.members
order by created_at desc nulls last, membership_number nulls last, membership_id nulls last, id;
