create schema if not exists private;

create table if not exists public.member_certificates (
    id uuid primary key default extensions.gen_random_uuid(),
    certificate_code text not null unique default ('HIMMA-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 12))),
    membership_number text not null,
    member_name text not null,
    title text not null check (char_length(title) between 3 and 180),
    activity_name text,
    description text,
    volunteer_hours numeric(8,2) check (volunteer_hours is null or volunteer_hours >= 0),
    issued_on date not null default current_date,
    issued_by_membership text not null,
    issued_by_name text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.committee_tasks (
    id uuid primary key default extensions.gen_random_uuid(),
    committee text not null check (char_length(committee) between 2 and 180),
    title text not null check (char_length(title) between 3 and 180),
    description text not null check (char_length(description) between 1 and 3000),
    assigned_membership_number text,
    assigned_member_name text,
    due_date date not null,
    status text not null default 'new' check (status in ('new', 'in_progress', 'completed')),
    created_by_membership text not null,
    created_by_name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.member_requests (
    id uuid primary key default extensions.gen_random_uuid(),
    membership_number text not null,
    member_name text not null,
    request_type text not null check (request_type in ('committee_transfer', 'data_update', 'leave', 'activity_proposal', 'complaint', 'other')),
    subject text not null check (char_length(subject) between 3 and 180),
    details text not null check (char_length(details) between 5 and 3000),
    status text not null default 'pending' check (status in ('pending', 'in_review', 'approved', 'rejected', 'completed')),
    admin_response text,
    handled_by_membership text,
    handled_by_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists member_certificates_membership_idx
    on public.member_certificates (membership_number, issued_on desc);
create index if not exists member_certificates_code_active_idx
    on public.member_certificates (certificate_code, is_active);
create index if not exists committee_tasks_committee_status_idx
    on public.committee_tasks (committee, status, due_date);
create index if not exists committee_tasks_assigned_idx
    on public.committee_tasks (assigned_membership_number, due_date);
create index if not exists member_requests_member_created_idx
    on public.member_requests (membership_number, created_at desc);
create index if not exists member_requests_status_created_idx
    on public.member_requests (status, created_at desc);

alter table public.member_certificates enable row level security;
alter table public.committee_tasks enable row level security;
alter table public.member_requests enable row level security;

revoke all on table public.member_certificates from public, anon, authenticated;
revoke all on table public.committee_tasks from public, anon, authenticated;
revoke all on table public.member_requests from public, anon, authenticated;

create or replace function private.himma_member_auth(
    input_membership_id text,
    input_password text
)
returns table (
    member_id uuid,
    membership_number text,
    full_name text,
    committee text,
    member_role text,
    can_manage_members boolean,
    can_manage_committees boolean,
    can_manage_structure boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
    return query
    select
        m.id,
        coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')),
        coalesce(nullif(m.full_name, ''), nullif(m.name, '')),
        coalesce(m.committee, ''),
        coalesce(m.role, ''),
        coalesce(m.can_manage_members, false),
        coalesce(m.can_manage_committees, false),
        coalesce(m.can_manage_structure, false)
    from public.members m
    where input_membership_id is not null
      and input_password is not null
      and btrim(input_membership_id) <> ''
      and m.is_active is true
      and m.password_hash is not null
      and (m.membership_number = btrim(input_membership_id) or m.membership_id = btrim(input_membership_id))
      and m.password_hash = extensions.crypt(input_password, m.password_hash)
    limit 1;

    if found then
        return;
    end if;

    return query
    select
        u.id,
        u.membership_number,
        u.full_name,
        ''::text,
        'عضو'::text,
        coalesce(a.role in ('super_admin', 'discipline_admin'), false),
        false,
        false
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
      and u.password_hash = extensions.crypt(input_password, u.password_hash)
    limit 1;
end;
$fn$;

revoke all on function private.himma_member_auth(text, text) from public, anon, authenticated;

create or replace function public.member_services_portal(
    input_membership_id text,
    input_password text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
    current_member record;
    can_create_tasks boolean;
    can_manage_requests boolean;
begin
    select * into current_member
    from private.himma_member_auth(input_membership_id, input_password);

    if current_member.membership_number is null then
        return jsonb_build_object('success', false, 'message', 'invalid_login');
    end if;

    can_create_tasks := current_member.can_manage_committees
        or (current_member.member_role ilike '%رئيس%' and current_member.member_role ilike '%لجنة%');
    can_manage_requests := current_member.can_manage_members or current_member.can_manage_structure;

    return jsonb_build_object(
        'success', true,
        'member', jsonb_build_object(
            'membership_number', current_member.membership_number,
            'full_name', current_member.full_name,
            'committee', current_member.committee,
            'role', current_member.member_role
        ),
        'permissions', jsonb_build_object(
            'can_issue_certificates', current_member.can_manage_members,
            'can_create_tasks', can_create_tasks,
            'can_manage_tasks', current_member.can_manage_committees,
            'can_manage_requests', can_manage_requests
        ),
        'certificates', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', c.id,
                'certificate_code', c.certificate_code,
                'title', c.title,
                'activity_name', c.activity_name,
                'description', c.description,
                'volunteer_hours', c.volunteer_hours,
                'issued_on', c.issued_on,
                'issued_by_name', c.issued_by_name
            ) order by c.issued_on desc, c.created_at desc)
            from public.member_certificates c
            where c.membership_number = current_member.membership_number
              and c.is_active is true
        ), '[]'::jsonb),
        'issued_certificates', case when current_member.can_manage_members then coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', c.id,
                'certificate_code', c.certificate_code,
                'membership_number', c.membership_number,
                'member_name', c.member_name,
                'title', c.title,
                'issued_on', c.issued_on,
                'is_active', c.is_active
            ) order by c.created_at desc)
            from (select * from public.member_certificates order by created_at desc limit 100) c
        ), '[]'::jsonb) else '[]'::jsonb end,
        'tasks', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', t.id,
                'committee', t.committee,
                'title', t.title,
                'description', t.description,
                'assigned_membership_number', t.assigned_membership_number,
                'assigned_member_name', t.assigned_member_name,
                'due_date', t.due_date,
                'status', t.status,
                'created_by_membership', t.created_by_membership,
                'created_by_name', t.created_by_name,
                'created_at', t.created_at,
                'updated_at', t.updated_at
            ) order by case t.status when 'new' then 1 when 'in_progress' then 2 else 3 end, t.due_date, t.created_at desc)
            from public.committee_tasks t
            where current_member.can_manage_committees
               or t.committee = current_member.committee
               or t.assigned_membership_number = current_member.membership_number
        ), '[]'::jsonb),
        'task_members', case when can_create_tasks then coalesce((
            select jsonb_agg(jsonb_build_object(
                'membership_number', x.membership_number,
                'full_name', x.full_name,
                'committee', x.committee
            ) order by x.full_name)
            from (
                select distinct on (coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')))
                    coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')) as membership_number,
                    coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as full_name,
                    coalesce(m.committee, '') as committee
                from public.members m
                where m.is_active is true
                  and coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')) is not null
                  and (current_member.can_manage_committees or m.committee = current_member.committee)
                order by coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')), m.updated_at desc nulls last
            ) x
        ), '[]'::jsonb) else '[]'::jsonb end,
        'committees', case when can_create_tasks then coalesce((
            select jsonb_agg(jsonb_build_object('value', x.value, 'label', x.label) order by x.label)
            from (
                select distinct
                    coalesce(nullif(c.name_ar, ''), nullif(c.name, ''), c.slug) as value,
                    coalesce(nullif(c.name_ar, ''), nullif(c.name, ''), c.slug) as label
                from public.committees c
                where coalesce(c.is_active, true) is true
                  and (current_member.can_manage_committees
                       or coalesce(nullif(c.name_ar, ''), nullif(c.name, ''), c.slug) = current_member.committee)
            ) x
        ), '[]'::jsonb) else '[]'::jsonb end,
        'requests', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', r.id,
                'membership_number', r.membership_number,
                'member_name', r.member_name,
                'request_type', r.request_type,
                'subject', r.subject,
                'details', r.details,
                'status', r.status,
                'admin_response', r.admin_response,
                'handled_by_name', r.handled_by_name,
                'created_at', r.created_at,
                'updated_at', r.updated_at
            ) order by r.created_at desc)
            from (select * from public.member_requests
                  where can_manage_requests or membership_number = current_member.membership_number
                  order by created_at desc limit 150) r
        ), '[]'::jsonb)
    );
end;
$fn$;

create or replace function public.member_issue_certificate(
    input_admin_membership_id text,
    input_admin_password text,
    input_target_membership_id text,
    input_title text,
    input_activity_name text default null,
    input_description text default null,
    input_volunteer_hours numeric default null,
    input_issued_on date default current_date
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
    admin_member record;
    target_member record;
    new_certificate record;
begin
    select * into admin_member
    from private.himma_member_auth(input_admin_membership_id, input_admin_password);

    if admin_member.membership_number is null or not admin_member.can_manage_members then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    select q.membership_number, q.full_name into target_member
    from (
        select 1 as priority,
               coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')) as membership_number,
               coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as full_name
        from public.members m
        where m.is_active is true
          and (m.membership_number = btrim(coalesce(input_target_membership_id, ''))
               or m.membership_id = btrim(coalesce(input_target_membership_id, '')))
        union all
        select 2, u.membership_number, u.full_name
        from public.member_evolution_users u
        where u.is_active is true
          and u.membership_number = btrim(coalesce(input_target_membership_id, ''))
    ) q
    where q.membership_number is not null and q.full_name is not null
    order by q.priority
    limit 1;

    if target_member.membership_number is null then
        return jsonb_build_object('success', false, 'message', 'member_not_found');
    end if;

    if char_length(btrim(coalesce(input_title, ''))) < 3
       or input_issued_on is null
       or (input_volunteer_hours is not null and input_volunteer_hours < 0) then
        return jsonb_build_object('success', false, 'message', 'invalid_data');
    end if;

    insert into public.member_certificates (
        membership_number, member_name, title, activity_name, description,
        volunteer_hours, issued_on, issued_by_membership, issued_by_name
    ) values (
        target_member.membership_number,
        target_member.full_name,
        btrim(input_title),
        nullif(btrim(coalesce(input_activity_name, '')), ''),
        nullif(btrim(coalesce(input_description, '')), ''),
        input_volunteer_hours,
        input_issued_on,
        admin_member.membership_number,
        admin_member.full_name
    ) returning * into new_certificate;

    return jsonb_build_object(
        'success', true,
        'certificate_code', new_certificate.certificate_code,
        'certificate_id', new_certificate.id
    );
end;
$fn$;

create or replace function public.member_revoke_certificate(
    input_admin_membership_id text,
    input_admin_password text,
    input_certificate_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
    admin_member record;
begin
    select * into admin_member
    from private.himma_member_auth(input_admin_membership_id, input_admin_password);

    if admin_member.membership_number is null or not admin_member.can_manage_members then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    update public.member_certificates
    set is_active = false, updated_at = now()
    where id = input_certificate_id and is_active is true;

    if not found then
        return jsonb_build_object('success', false, 'message', 'not_found');
    end if;
    return jsonb_build_object('success', true);
end;
$fn$;

create or replace function public.member_certificate_verify(input_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $fn$
    select coalesce((
        select jsonb_build_object(
            'success', true,
            'certificate_code', c.certificate_code,
            'membership_number', c.membership_number,
            'member_name', c.member_name,
            'title', c.title,
            'activity_name', c.activity_name,
            'description', c.description,
            'volunteer_hours', c.volunteer_hours,
            'issued_on', c.issued_on,
            'issued_by_name', c.issued_by_name
        )
        from public.member_certificates c
        where c.is_active is true
          and c.certificate_code = upper(btrim(coalesce(input_code, '')))
          and char_length(btrim(coalesce(input_code, ''))) between 8 and 40
        limit 1
    ), jsonb_build_object('success', false, 'message', 'not_found'));
$fn$;

create or replace function public.member_create_committee_task(
    input_membership_id text,
    input_password text,
    input_committee text,
    input_title text,
    input_description text,
    input_assigned_membership_number text,
    input_due_date date
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
    current_member record;
    assignee_membership text;
    assignee_name text;
    assignee_committee text;
    can_create boolean;
    new_task_id uuid;
begin
    select * into current_member
    from private.himma_member_auth(input_membership_id, input_password);
    can_create := coalesce(current_member.can_manage_committees, false)
        or (current_member.member_role ilike '%رئيس%' and current_member.member_role ilike '%لجنة%');

    if current_member.membership_number is null or not can_create then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;
    if not current_member.can_manage_committees and btrim(coalesce(input_committee, '')) <> current_member.committee then
        return jsonb_build_object('success', false, 'message', 'wrong_committee');
    end if;
    if char_length(btrim(coalesce(input_committee, ''))) < 2
       or char_length(btrim(coalesce(input_title, ''))) < 3
       or char_length(btrim(coalesce(input_description, ''))) < 1
       or input_due_date is null then
        return jsonb_build_object('success', false, 'message', 'invalid_data');
    end if;

    if nullif(btrim(coalesce(input_assigned_membership_number, '')), '') is not null then
        select
            coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')) as membership_number,
            coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as full_name,
            coalesce(m.committee, '') as committee
        into assignee_membership, assignee_name, assignee_committee
        from public.members m
        where m.is_active is true
          and (m.membership_number = btrim(input_assigned_membership_number)
               or m.membership_id = btrim(input_assigned_membership_number))
        limit 1;
        if assignee_membership is null or assignee_committee <> btrim(input_committee) then
            return jsonb_build_object('success', false, 'message', 'invalid_assignee');
        end if;
    end if;

    insert into public.committee_tasks (
        committee, title, description, assigned_membership_number,
        assigned_member_name, due_date, created_by_membership, created_by_name
    ) values (
        btrim(input_committee), btrim(input_title), btrim(input_description),
        assignee_membership, assignee_name, input_due_date,
        current_member.membership_number, current_member.full_name
    ) returning id into new_task_id;
    return jsonb_build_object('success', true, 'task_id', new_task_id);
end;
$fn$;

create or replace function public.member_update_committee_task_status(
    input_membership_id text,
    input_password text,
    input_task_id uuid,
    input_status text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
    current_member record;
    target_task record;
    is_chair boolean;
begin
    select * into current_member
    from private.himma_member_auth(input_membership_id, input_password);
    if current_member.membership_number is null then
        return jsonb_build_object('success', false, 'message', 'invalid_login');
    end if;
    if input_status not in ('new', 'in_progress', 'completed') then
        return jsonb_build_object('success', false, 'message', 'invalid_status');
    end if;

    select * into target_task from public.committee_tasks where id = input_task_id;
    if target_task.id is null then
        return jsonb_build_object('success', false, 'message', 'not_found');
    end if;
    is_chair := current_member.member_role ilike '%رئيس%'
        and current_member.member_role ilike '%لجنة%'
        and current_member.committee = target_task.committee;
    if not current_member.can_manage_committees
       and not is_chair
       and target_task.assigned_membership_number is distinct from current_member.membership_number
       and target_task.created_by_membership is distinct from current_member.membership_number then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    update public.committee_tasks set status = input_status, updated_at = now() where id = input_task_id;
    return jsonb_build_object('success', true);
end;
$fn$;

create or replace function public.member_submit_request(
    input_membership_id text,
    input_password text,
    input_request_type text,
    input_subject text,
    input_details text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
    current_member record;
    new_request_id uuid;
begin
    select * into current_member
    from private.himma_member_auth(input_membership_id, input_password);
    if current_member.membership_number is null then
        return jsonb_build_object('success', false, 'message', 'invalid_login');
    end if;
    if input_request_type not in ('committee_transfer', 'data_update', 'leave', 'activity_proposal', 'complaint', 'other')
       or char_length(btrim(coalesce(input_subject, ''))) < 3
       or char_length(btrim(coalesce(input_details, ''))) < 5 then
        return jsonb_build_object('success', false, 'message', 'invalid_data');
    end if;

    insert into public.member_requests (membership_number, member_name, request_type, subject, details)
    values (current_member.membership_number, current_member.full_name, input_request_type, btrim(input_subject), btrim(input_details))
    returning id into new_request_id;
    return jsonb_build_object('success', true, 'request_id', new_request_id);
end;
$fn$;

create or replace function public.member_respond_request(
    input_admin_membership_id text,
    input_admin_password text,
    input_request_id uuid,
    input_status text,
    input_admin_response text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
    admin_member record;
begin
    select * into admin_member
    from private.himma_member_auth(input_admin_membership_id, input_admin_password);
    if admin_member.membership_number is null
       or not (admin_member.can_manage_members or admin_member.can_manage_structure) then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;
    if input_status not in ('pending', 'in_review', 'approved', 'rejected', 'completed') then
        return jsonb_build_object('success', false, 'message', 'invalid_status');
    end if;

    update public.member_requests
    set status = input_status,
        admin_response = nullif(btrim(coalesce(input_admin_response, '')), ''),
        handled_by_membership = admin_member.membership_number,
        handled_by_name = admin_member.full_name,
        updated_at = now()
    where id = input_request_id;
    if not found then
        return jsonb_build_object('success', false, 'message', 'not_found');
    end if;
    return jsonb_build_object('success', true);
end;
$fn$;

revoke all on function public.member_services_portal(text, text) from public, anon, authenticated;
revoke all on function public.member_issue_certificate(text, text, text, text, text, text, numeric, date) from public, anon, authenticated;
revoke all on function public.member_revoke_certificate(text, text, uuid) from public, anon, authenticated;
revoke all on function public.member_certificate_verify(text) from public, anon, authenticated;
revoke all on function public.member_create_committee_task(text, text, text, text, text, text, date) from public, anon, authenticated;
revoke all on function public.member_update_committee_task_status(text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.member_submit_request(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.member_respond_request(text, text, uuid, text, text) from public, anon, authenticated;

grant execute on function public.member_services_portal(text, text) to anon;
grant execute on function public.member_issue_certificate(text, text, text, text, text, text, numeric, date) to anon;
grant execute on function public.member_revoke_certificate(text, text, uuid) to anon;
grant execute on function public.member_certificate_verify(text) to anon;
grant execute on function public.member_create_committee_task(text, text, text, text, text, text, date) to anon;
grant execute on function public.member_update_committee_task_status(text, text, uuid, text) to anon;
grant execute on function public.member_submit_request(text, text, text, text, text) to anon;
grant execute on function public.member_respond_request(text, text, uuid, text, text) to anon;

notify pgrst, 'reload schema';
