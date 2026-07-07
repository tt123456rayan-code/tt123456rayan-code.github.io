-- Sync member evaluation management with the main member login dashboard.
-- Run this file manually in Supabase SQL Editor.
-- It does not expose password hashes and does not use service_role keys.

create extension if not exists pgcrypto;

drop function if exists public.member_login(text, text);

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
language plpgsql
stable
security definer
set search_path = public, extensions
as $fn$
begin
    return query
    select
        m.id as member_id,
        m.membership_id,
        m.membership_number,
        coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as full_name,
        coalesce(nullif(m.name, ''), nullif(m.full_name, '')) as name,
        coalesce(m.committee, '') as committee,
        coalesce(m.role, '') as role,
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
    limit 1;

    if found then
        return;
    end if;

    return query
    select
        u.id as member_id,
        u.membership_number as membership_id,
        u.membership_number as membership_number,
        u.full_name,
        u.full_name as name,
        ''::text as committee,
        'عضو'::text as role,
        null::text as avatar_url,
        null::text as image_url,
        false as can_create_meetings,
        false as can_manage_announcements,
        false as can_manage_committees,
        false as can_manage_structure,
        coalesce(a.role in ('super_admin', 'discipline_admin'), false) as can_manage_members
    from public.member_evolution_users u
    left join public.member_evolution_admins a
      on a.membership_number = u.membership_number
     and a.is_active is true
    where input_membership_id is not null
      and input_password is not null
      and btrim(input_membership_id) <> ''
      and u.is_active is true
      and u.password_hash is not null
      and u.membership_number = btrim(input_membership_id)
      and u.password_hash = crypt(input_password, u.password_hash)
    limit 1;
end;
$fn$;

revoke all on function public.member_login(text, text) from public;
grant execute on function public.member_login(text, text) to anon;

create or replace function public.member_evolution_create_member(
    admin_membership_number text,
    admin_password text,
    new_full_name text,
    requested_membership_number text default null,
    temporary_password text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $fn$
declare
    admin_member record;
    final_membership_number text;
    final_password text;
    new_member_id uuid;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if coalesce(admin_member.admin_role, '') not in ('super_admin', 'discipline_admin') then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    if new_full_name is null or char_length(btrim(new_full_name)) < 2 then
        return jsonb_build_object('success', false, 'message', 'invalid_name');
    end if;

    final_membership_number := nullif(btrim(coalesce(requested_membership_number, '')), '');
    if final_membership_number is null then
        final_membership_number := 'NYIJO' || lpad(nextval('public.member_evolution_membership_seq')::text, 5, '0');
    end if;

    final_password := nullif(btrim(coalesce(temporary_password, '')), '');
    if final_password is null then
        final_password := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    end if;

    insert into public.member_evolution_users (membership_number, full_name, password_hash)
    values (final_membership_number, btrim(new_full_name), crypt(final_password, gen_salt('bf')))
    returning id into new_member_id;

    insert into public.member_evolution_records (member_id, updated_by)
    values (new_member_id, admin_member.full_name);

    begin
        update public.members
        set full_name = btrim(new_full_name),
            name = btrim(new_full_name),
            password_hash = crypt(final_password, gen_salt('bf')),
            is_active = true
        where membership_number = final_membership_number
           or membership_id = final_membership_number;

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
            final_membership_number,
            final_membership_number,
            btrim(new_full_name),
            btrim(new_full_name),
            'غير محدد',
            'عضو',
            true,
            crypt(final_password, gen_salt('bf')),
            false,
            false,
            false,
            false,
            false
        where not exists (
            select 1
            from public.members
            where membership_number = final_membership_number
               or membership_id = final_membership_number
        );
    exception
        when others then
            -- The member_evolution table remains the source of truth for evaluation login.
            null;
    end;

    return jsonb_build_object(
        'success', true,
        'member', jsonb_build_object(
            'id', new_member_id,
            'membership_number', final_membership_number,
            'full_name', btrim(new_full_name),
            'temporary_password', final_password
        )
    );
exception
    when unique_violation then
        return jsonb_build_object('success', false, 'message', 'duplicate_membership');
end;
$fn$;

create or replace function public.member_evolution_delete_member(
    admin_membership_number text,
    admin_password text,
    target_member_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $fn$
declare
    admin_member record;
    target_member record;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if coalesce(admin_member.admin_role, '') not in ('super_admin', 'discipline_admin') then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    select id, membership_number, full_name into target_member
    from public.member_evolution_users
    where id = target_member_id;

    if target_member.id is null then
        return jsonb_build_object('success', false, 'message', 'not_found');
    end if;

    if target_member.full_name ilike '%ريان%عبد%القادر%' then
        return jsonb_build_object('success', false, 'message', 'protected_member');
    end if;

    delete from public.member_evolution_users
    where id = target_member_id;

    begin
        update public.members
        set is_active = false
        where membership_number = target_member.membership_number
           or membership_id = target_member.membership_number;
    exception
        when others then
            null;
    end;

    return jsonb_build_object('success', true);
end;
$fn$;

update public.members
set can_manage_members = true
where coalesce(full_name, name, '') ilike '%ريان%عبد%القادر%';

insert into public.member_evolution_admins (membership_number, role, display_name, is_active)
select u.membership_number,
       case
           when u.full_name ilike '%ريان%عبد%القادر%' then 'super_admin'
           when u.full_name ilike '%لارا%القصير%' then 'discipline_admin'
           else 'evaluator'
       end,
       u.full_name,
       true
from public.member_evolution_users u
where u.full_name ilike '%ريان%عبد%القادر%'
   or u.full_name ilike '%لارا%القصير%'
on conflict (membership_number) do update
set role = excluded.role,
    display_name = excluded.display_name,
    is_active = true;

update public.members m
set full_name = u.full_name,
    name = u.full_name,
    password_hash = u.password_hash,
    is_active = u.is_active,
    can_manage_members = coalesce(a.role in ('super_admin', 'discipline_admin'), false)
from public.member_evolution_users u
left join public.member_evolution_admins a
  on a.membership_number = u.membership_number
 and a.is_active is true
where m.membership_number = u.membership_number
   or m.membership_id = u.membership_number;

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
    u.membership_number,
    u.membership_number,
    u.full_name,
    u.full_name,
    'غير محدد',
    'عضو',
    u.is_active,
    u.password_hash,
    false,
    false,
    false,
    false,
    coalesce(a.role in ('super_admin', 'discipline_admin'), false)
from public.member_evolution_users u
left join public.member_evolution_admins a
  on a.membership_number = u.membership_number
 and a.is_active is true
where not exists (
    select 1
    from public.members m
    where m.membership_number = u.membership_number
       or m.membership_id = u.membership_number
);

revoke all on function public.member_evolution_create_member(text, text, text, text, text) from public;
revoke all on function public.member_evolution_delete_member(text, text, uuid) from public;
grant execute on function public.member_evolution_create_member(text, text, text, text, text) to anon;
grant execute on function public.member_evolution_delete_member(text, text, uuid) to anon;
