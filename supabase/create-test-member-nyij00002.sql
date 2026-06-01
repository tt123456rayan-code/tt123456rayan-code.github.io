-- Optional temporary test member for login verification.
-- Run manually in Supabase SQL Editor only if NYIJ00002 does not already exist.
-- Replace PUT_TEMP_PASSWORD_HERE manually before running.
-- Do not share temporary passwords publicly.
-- Change or delete this temporary test account after testing.
-- This file never selects or prints password_hash values.

create extension if not exists pgcrypto;

insert into public.members (
    membership_number,
    membership_id,
    full_name,
    name,
    committee,
    role,
    is_active,
    password_hash,
    can_create_meetings,
    can_manage_announcements,
    can_manage_committees,
    can_manage_structure,
    can_manage_members
)
select
    'NYIJ00002',
    'NYIJ00002',
    'Test Member',
    'Test Member',
    'Test Committee',
    'Test Role',
    true,
    crypt('PUT_TEMP_PASSWORD_HERE', gen_salt('bf')),
    false,
    false,
    false,
    false,
    false
where not exists (
    select 1
    from public.members
    where membership_number = 'NYIJ00002'
       or membership_id = 'NYIJ00002'
);
