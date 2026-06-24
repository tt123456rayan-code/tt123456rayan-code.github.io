create or replace function public.member_evolution_get_portal(
    input_membership_number text,
    input_password text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $fn$
declare
    current_member record;
begin
    select * into current_member
    from public.member_evolution_auth(input_membership_number, input_password)
    limit 1;

    if current_member.member_uuid is null then
        return jsonb_build_object('success', false, 'message', 'invalid_login');
    end if;

    if current_member.admin_role in ('super_admin', 'discipline_admin', 'evaluator') then
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
                        'admin_role', a.role,
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
                left join public.member_evolution_admins a
                  on a.membership_number = u.membership_number
                 and a.is_active is true
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

    return jsonb_build_object('success', true);
end;
$fn$;

create or replace function public.member_evolution_set_admin_role(
    admin_membership_number text,
    admin_password text,
    target_member_id uuid,
    new_admin_role text
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
    normalized_role text;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if coalesce(admin_member.admin_role, '') <> 'super_admin' then
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

    normalized_role := nullif(btrim(coalesce(new_admin_role, '')), '');

    if normalized_role is null or normalized_role = 'none' then
        update public.member_evolution_admins
        set is_active = false
        where membership_number = target_member.membership_number;

        return jsonb_build_object('success', true, 'role', 'none');
    end if;

    if normalized_role not in ('discipline_admin', 'evaluator') then
        return jsonb_build_object('success', false, 'message', 'invalid_role');
    end if;

    insert into public.member_evolution_admins (membership_number, role, display_name, is_active)
    values (target_member.membership_number, normalized_role, target_member.full_name, true)
    on conflict (membership_number) do update
    set role = excluded.role,
        display_name = excluded.display_name,
        is_active = true;

    return jsonb_build_object('success', true, 'role', normalized_role);
end;
$fn$;

revoke all on function public.member_evolution_get_portal(text, text) from public;
revoke all on function public.member_evolution_delete_member(text, text, uuid) from public;
revoke all on function public.member_evolution_set_admin_role(text, text, uuid, text) from public;

grant execute on function public.member_evolution_get_portal(text, text) to anon;
grant execute on function public.member_evolution_delete_member(text, text, uuid) to anon;
grant execute on function public.member_evolution_set_admin_role(text, text, uuid, text) to anon;
