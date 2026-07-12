-- Keeps evaluation accounts and the main member portal synchronized.

-- The site uses its protected membership RPC for these accounts. Keep any
-- existing Supabase Auth link, but do not require a fake auth.users record.
alter table public.members
alter column auth_user_id drop not null;

alter table public.members
drop constraint if exists members_membership_id_check;

alter table public.members
add constraint members_membership_id_check
check (membership_id ~ '^NYIJO[0-9]{4,6}$');

create or replace function private.sync_member_evolution_to_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
    if tg_op = 'UPDATE' and old.membership_number is distinct from new.membership_number then
        update public.members
        set membership_number = new.membership_number,
            membership_id = new.membership_number
        where membership_number = old.membership_number
           or membership_id = old.membership_number;
    end if;

    update public.members
    set membership_number = new.membership_number,
        membership_id = new.membership_number,
        full_name = new.full_name,
        name = new.full_name,
        password_hash = new.password_hash,
        is_active = new.is_active,
        updated_at = now()
    where membership_number = new.membership_number
       or membership_id = new.membership_number;

    if not found then
        insert into public.members (
            membership_number, membership_id, full_name, name,
            committee, role, password_hash, is_active,
            can_create_meetings, can_manage_announcements,
            can_manage_committees, can_manage_structure, can_manage_members
        ) values (
            new.membership_number, new.membership_number, new.full_name, new.full_name,
            'غير محدد', 'عضو', new.password_hash, new.is_active,
            false, false, false, false, false
        );
    end if;

    return new;
end;
$fn$;

revoke all on function private.sync_member_evolution_to_members() from public, anon, authenticated;

drop trigger if exists member_evolution_sync_main_member
on public.member_evolution_users;

create trigger member_evolution_sync_main_member
after insert or update of membership_number, full_name, password_hash, is_active
on public.member_evolution_users
for each row execute function private.sync_member_evolution_to_members();

-- Repair existing evaluation accounts that never reached the main members table.
insert into public.members (
    membership_number, membership_id, full_name, name,
    committee, role, password_hash, is_active,
    can_create_meetings, can_manage_announcements,
    can_manage_committees, can_manage_structure, can_manage_members
)
select
    u.membership_number, u.membership_number, u.full_name, u.full_name,
    'غير محدد', 'عضو', u.password_hash, u.is_active,
    false, false, false, false, false
from public.member_evolution_users u
where not exists (
    select 1
    from public.members m
    where m.membership_number = u.membership_number
       or m.membership_id = u.membership_number
);

-- Replace the obsolete five-argument RPC with the current form contract.
drop function if exists public.member_evolution_create_member(text, text, text, text, text);
drop function if exists public.member_evolution_create_member(text, text, text, text, text, text, text);

create function public.member_evolution_create_member(
    admin_membership_number text,
    admin_password text,
    new_full_name text,
    new_committee text default null,
    new_role text default null,
    requested_membership_number text default null,
    temporary_password text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
    admin_member record;
    final_membership_number text;
    final_password text;
    final_password_hash text;
    final_committee text;
    final_role text;
    new_member_id uuid;
begin
    select * into admin_member
    from public.member_evolution_auth(admin_membership_number, admin_password)
    limit 1;

    if coalesce(admin_member.admin_role, '') not in ('super_admin', 'discipline_admin') then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    if char_length(btrim(coalesce(new_full_name, ''))) < 2 then
        return jsonb_build_object('success', false, 'message', 'invalid_name');
    end if;

    final_committee := nullif(btrim(coalesce(new_committee, '')), '');
    final_role := nullif(btrim(coalesce(new_role, '')), '');
    if final_committee is null then
        return jsonb_build_object('success', false, 'message', 'invalid_committee');
    end if;
    if final_role not in ('رئيس', 'نائب', 'أمين سر', 'عضو') then
        return jsonb_build_object('success', false, 'message', 'invalid_role');
    end if;

    final_membership_number := upper(nullif(btrim(coalesce(requested_membership_number, '')), ''));
    if final_membership_number is null then
        final_membership_number := 'NYIJO' || lpad(nextval('public.member_evolution_membership_seq')::text, 5, '0');
    end if;
    if final_membership_number !~ '^NYIJO[0-9]{4,6}$' then
        return jsonb_build_object('success', false, 'message', 'invalid_membership');
    end if;

    final_password := nullif(btrim(coalesce(temporary_password, '')), '');
    if final_password is null then
        final_password := upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 10));
    end if;
    final_password_hash := extensions.crypt(final_password, extensions.gen_salt('bf'));

    insert into public.member_evolution_users (
        membership_number, full_name, password_hash
    ) values (
        final_membership_number, btrim(new_full_name), final_password_hash
    ) returning id into new_member_id;

    insert into public.member_evolution_records (member_id, updated_by)
    values (new_member_id, admin_member.full_name);

    update public.members
    set committee = final_committee,
        role = final_role,
        position_title = final_role,
        updated_at = now()
    where membership_number = final_membership_number
       or membership_id = final_membership_number;

    return jsonb_build_object(
        'success', true,
        'member', jsonb_build_object(
            'id', new_member_id,
            'membership_number', final_membership_number,
            'full_name', btrim(new_full_name),
            'committee', final_committee,
            'role', final_role,
            'temporary_password', final_password
        )
    );
exception
    when unique_violation then
        return jsonb_build_object('success', false, 'message', 'duplicate_membership');
end;
$fn$;

revoke all on function public.member_evolution_create_member(text, text, text, text, text, text, text)
from public, anon, authenticated;
grant execute on function public.member_evolution_create_member(text, text, text, text, text, text, text)
to anon;

notify pgrst, 'reload schema';
