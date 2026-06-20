create extension if not exists pgcrypto;

create sequence if not exists public.member_evolution_membership_seq start 1001;

create table if not exists public.member_evolution_users (
    id uuid primary key default gen_random_uuid(),
    membership_number text not null unique check (char_length(membership_number) between 4 and 32),
    full_name text not null check (char_length(full_name) between 2 and 160),
    password_hash text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.member_evolution_admins (
    membership_number text primary key references public.member_evolution_users(membership_number) on update cascade on delete cascade,
    role text not null check (role in ('super_admin', 'evaluator')),
    display_name text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.member_evolution_records (
    member_id uuid primary key references public.member_evolution_users(id) on delete cascade,
    rating text not null default 'جيد' check (rating in ('ممتاز', 'جيد جدًا', 'جيد', 'يحتاج المتابعة', 'مقصر')),
    warning_level integer not null default 0 check (warning_level between 0 and 3),
    status text not null default 'مستقيم' check (status in ('مستقيم', 'تحت المتابعة', 'مطرود')),
    notes text not null default '',
    updated_by text,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.member_evolution_users enable row level security;
alter table public.member_evolution_admins enable row level security;
alter table public.member_evolution_records enable row level security;

revoke all on table public.member_evolution_users from anon, authenticated;
revoke all on table public.member_evolution_admins from anon, authenticated;
revoke all on table public.member_evolution_records from anon, authenticated;
grant usage on schema public to anon;

create or replace function public.member_evolution_auth(
    input_membership_number text,
    input_password text
)
returns table (
    member_uuid uuid,
    membership_number text,
    full_name text,
    admin_role text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
    select
        u.id as member_uuid,
        u.membership_number,
        u.full_name,
        a.role as admin_role
    from public.member_evolution_users u
    left join public.member_evolution_admins a
      on a.membership_number = u.membership_number
     and a.is_active is true
    where input_membership_number is not null
      and input_password is not null
      and btrim(input_membership_number) <> ''
      and u.is_active is true
      and u.password_hash = crypt(input_password, u.password_hash)
      and u.membership_number = btrim(input_membership_number)
    limit 1;
$$;

create or replace function public.member_evolution_get_portal(
    input_membership_number text,
    input_password text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    current_member record;
begin
    select * into current_member
    from public.member_evolution_auth(input_membership_number, input_password)
    limit 1;

    if current_member.member_uuid is null then
        return jsonb_build_object('success', false, 'message', 'invalid_login');
    end if;

    if current_member.admin_role in ('super_admin', 'evaluator') then
        return jsonb_build_object(
            'success', true,
            'viewer', jsonb_build_object(
                'membership_number', current_member.membership_number,
                'full_name', current_member.full_name,
                'admin_role', current_member.admin_role
            ),
            'members', coalesce((
                select jsonb_agg(
                    jsonb_build_object(
                        'id', u.id,
                        'membership_number', u.membership_number,
                        'full_name', u.full_name,
                        'is_active', u.is_active,
                        'rating', r.rating,
                        'warning_level', r.warning_level,
                        'status', r.status,
                        'notes', r.notes,
                        'updated_at', r.updated_at,
                        'updated_by', r.updated_by
                    )
                    order by u.created_at desc
                )
                from public.member_evolution_users u
                left join public.member_evolution_records r on r.member_id = u.id
            ), '[]'::jsonb)
        );
    end if;

    return jsonb_build_object(
        'success', true,
        'viewer', jsonb_build_object(
            'membership_number', current_member.membership_number,
            'full_name', current_member.full_name,
            'admin_role', null
        ),
        'evaluation', (
            select jsonb_build_object(
                'rating', r.rating,
                'warning_level', r.warning_level,
                'status', r.status,
                'notes', r.notes,
                'updated_at', r.updated_at
            )
            from public.member_evolution_records r
            where r.member_id = current_member.member_uuid
        )
    );
end;
$$;

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
as $$
declare
    admin_member record;
    final_membership_number text;
    final_password text;
    new_member_id uuid;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if admin_member.admin_role <> 'super_admin' then
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
$$;

create or replace function public.member_evolution_save_evaluation(
    admin_membership_number text,
    admin_password text,
    target_member_id uuid,
    new_rating text,
    new_warning_level integer,
    new_status text,
    new_notes text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
    admin_member record;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if admin_member.admin_role not in ('super_admin', 'evaluator') then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    insert into public.member_evolution_records (member_id, rating, warning_level, status, notes, updated_by, updated_at)
    values (
        target_member_id,
        coalesce(nullif(new_rating, ''), 'جيد'),
        greatest(0, least(3, coalesce(new_warning_level, 0))),
        coalesce(nullif(new_status, ''), case when coalesce(new_warning_level, 0) >= 3 then 'تحت المتابعة' else 'مستقيم' end),
        coalesce(new_notes, ''),
        admin_member.full_name,
        now()
    )
    on conflict (member_id) do update
    set rating = excluded.rating,
        warning_level = excluded.warning_level,
        status = excluded.status,
        notes = excluded.notes,
        updated_by = excluded.updated_by,
        updated_at = now();

    return jsonb_build_object('success', true);
end;
$$;

create or replace function public.member_evolution_deactivate_member(
    admin_membership_number text,
    admin_password text,
    target_member_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
    admin_member record;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if admin_member.admin_role <> 'super_admin' then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    update public.member_evolution_users
    set is_active = false,
        updated_at = now()
    where id = target_member_id;

    update public.member_evolution_records
    set status = 'مطرود',
        warning_level = 3,
        updated_by = admin_member.full_name,
        updated_at = now()
    where member_id = target_member_id;

    return jsonb_build_object('success', true);
end;
$$;

insert into public.member_evolution_users (membership_number, full_name, password_hash)
select
    coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')) as membership_number,
    coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as full_name,
    m.password_hash
from public.members m
where m.password_hash is not null
  and coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')) is not null
  and (
      coalesce(m.full_name, m.name, '') ilike '%ريان%عبد%القادر%'
      or coalesce(m.full_name, m.name, '') ilike '%عمر%دقروق%'
      or coalesce(m.full_name, m.name, '') ilike '%زيد%مناصير%'
      or coalesce(m.full_name, m.name, '') ilike '%زيد%المناصير%'
      or coalesce(m.full_name, m.name, '') ilike '%علاء%العبادي%'
      or coalesce(m.full_name, m.name, '') ilike '%علا%العبادي%'
  )
on conflict (membership_number) do update
set full_name = excluded.full_name,
    password_hash = excluded.password_hash,
    is_active = true,
    updated_at = now();

insert into public.member_evolution_admins (membership_number, role, display_name)
select u.membership_number,
       case when u.full_name ilike '%ريان%عبد%القادر%' then 'super_admin' else 'evaluator' end,
       u.full_name
from public.member_evolution_users u
where u.full_name ilike '%ريان%عبد%القادر%'
   or u.full_name ilike '%عمر%دقروق%'
   or u.full_name ilike '%زيد%مناصير%'
   or u.full_name ilike '%زيد%المناصير%'
   or u.full_name ilike '%علاء%العبادي%'
   or u.full_name ilike '%علا%العبادي%'
on conflict (membership_number) do update
set role = excluded.role,
    display_name = excluded.display_name,
    is_active = true;

insert into public.member_evolution_records (member_id, updated_by)
select u.id, 'system'
from public.member_evolution_users u
on conflict (member_id) do nothing;

revoke all on function public.member_evolution_auth(text, text) from public;
revoke all on function public.member_evolution_get_portal(text, text) from public;
revoke all on function public.member_evolution_create_member(text, text, text, text, text) from public;
revoke all on function public.member_evolution_save_evaluation(text, text, uuid, text, integer, text, text) from public;
revoke all on function public.member_evolution_deactivate_member(text, text, uuid) from public;

grant execute on function public.member_evolution_get_portal(text, text) to anon;
grant execute on function public.member_evolution_create_member(text, text, text, text, text) to anon;
grant execute on function public.member_evolution_save_evaluation(text, text, uuid, text, integer, text, text) to anon;
grant execute on function public.member_evolution_deactivate_member(text, text, uuid) to anon;
