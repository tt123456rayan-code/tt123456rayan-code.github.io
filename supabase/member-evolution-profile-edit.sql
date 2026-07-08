-- Adds Rayan-only member profile editing for the evaluation portal.
-- Run manually in Supabase SQL Editor.

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
                        'committee', coalesce(m.committee, ''),
                        'role', coalesce(m.role, ''),
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
                left join public.members m
                  on m.membership_number = u.membership_number
                  or m.membership_id = u.membership_number
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

create or replace function public.member_evolution_update_member_profile(
    admin_membership_number text,
    admin_password text,
    target_member_id uuid,
    new_full_name text,
    new_committee text,
    new_role text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
    admin_member record;
    target_member record;
    final_name text;
    final_committee text;
    final_role text;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if admin_member.member_uuid is null
       or admin_member.full_name not ilike '%ريان%عبد%القادر%' then
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

    final_name := nullif(btrim(coalesce(new_full_name, '')), '');
    final_committee := nullif(btrim(coalesce(new_committee, '')), '');
    final_role := nullif(btrim(coalesce(new_role, '')), '');

    if final_name is null or char_length(final_name) < 2 then
        return jsonb_build_object('success', false, 'message', 'invalid_name');
    end if;

    if final_committee is null then
        return jsonb_build_object('success', false, 'message', 'invalid_committee');
    end if;

    if final_role not in ('رئيس', 'نائب', 'أمين سر') then
        return jsonb_build_object('success', false, 'message', 'invalid_role');
    end if;

    update public.member_evolution_users
    set full_name = final_name,
        updated_at = now()
    where id = target_member_id;

    update public.member_evolution_admins
    set display_name = final_name
    where membership_number = target_member.membership_number;

    update public.members
    set full_name = final_name,
        name = final_name,
        committee = final_committee,
        role = final_role,
        is_active = true
    where membership_number = target_member.membership_number
       or membership_id = target_member.membership_number;

    begin
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
            final_name,
            final_name,
            final_committee,
            final_role,
            true,
            u.password_hash,
            false,
            false,
            false,
            false,
            false
        from public.member_evolution_users u
        where u.id = target_member_id
          and not exists (
              select 1
              from public.members m
              where m.membership_number = target_member.membership_number
                 or m.membership_id = target_member.membership_number
          );
    exception
        when others then
            null;
    end;

    return jsonb_build_object(
        'success', true,
        'member', jsonb_build_object(
            'id', target_member_id,
            'membership_number', target_member.membership_number,
            'full_name', final_name,
            'committee', final_committee,
            'role', final_role
        )
    );
end;
$$;

revoke all on function public.member_evolution_update_member_profile(text, text, uuid, text, text, text) from public;
grant execute on function public.member_evolution_get_portal(text, text) to anon;
grant execute on function public.member_evolution_update_member_profile(text, text, uuid, text, text, text) to anon;
