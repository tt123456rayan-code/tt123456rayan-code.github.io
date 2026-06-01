-- Safe one-member password reset template.
-- Run manually in Supabase SQL Editor only when you need to reset one member.
-- Replace PUT_TEMP_PASSWORD_HERE manually.
-- Replace PUT_MEMBERSHIP_NUMBER_HERE manually.
-- Do not share temporary passwords publicly.
-- Change temporary passwords after testing.
-- This template does not reveal existing passwords or password_hash values.

create extension if not exists pgcrypto;

update public.members
set password_hash = crypt('PUT_TEMP_PASSWORD_HERE', gen_salt('bf')),
    is_active = true
where membership_number = 'PUT_MEMBERSHIP_NUMBER_HERE'
   or membership_id = 'PUT_MEMBERSHIP_NUMBER_HERE';
