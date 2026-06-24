create extension if not exists pgcrypto;

create table if not exists public.attendance_events (
    id uuid primary key default gen_random_uuid(),
    meeting_id uuid not null references public.meetings(id) on delete cascade,
    token_hash text not null unique,
    opens_at timestamptz not null,
    late_after timestamptz not null,
    closes_at timestamptz not null,
    is_active boolean not null default true,
    created_by uuid not null references public.members(id) on delete restrict,
    created_at timestamptz not null default now(),
    check (opens_at <= late_after and late_after <= closes_at)
);

create table if not exists public.attendance_records (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.attendance_events(id) on delete cascade,
    member_id uuid not null references public.members(id) on delete cascade,
    attendance_status text not null check (attendance_status in ('present', 'late')),
    checked_in_at timestamptz not null default now(),
    unique (event_id, member_id)
);

create index if not exists attendance_events_meeting_idx
on public.attendance_events (meeting_id, created_at desc);

create index if not exists attendance_records_event_idx
on public.attendance_records (event_id, checked_in_at);

alter table public.attendance_events enable row level security;
alter table public.attendance_records enable row level security;

revoke all on table public.attendance_events from anon, authenticated;
revoke all on table public.attendance_records from anon, authenticated;

create or replace function public.attendance_get_event(input_token text)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $fn$
    select coalesce((
        select jsonb_build_object(
            'success', true,
            'event_id', ae.id,
            'title', mt.title,
            'meeting_date', mt.meeting_date,
            'meeting_time', mt.meeting_time,
            'meeting_type', mt.meeting_type,
            'location_or_link', mt.location_or_link,
            'opens_at', ae.opens_at,
            'closes_at', ae.closes_at,
            'is_open', ae.is_active and now() between ae.opens_at and ae.closes_at
        )
        from public.attendance_events ae
        join public.meetings mt on mt.id = ae.meeting_id
        where ae.token_hash = encode(digest(btrim(coalesce(input_token, '')), 'sha256'), 'hex')
        limit 1
    ), jsonb_build_object('success', false, 'message', 'invalid_token'))
$fn$;

create or replace function public.attendance_check_in(
    input_token text,
    input_membership_id text,
    input_password text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $fn$
declare
    current_event record;
    current_member record;
    saved_status text;
    inserted_count integer;
begin
    select ae.id, ae.opens_at, ae.late_after, ae.closes_at, ae.is_active
    into current_event
    from public.attendance_events ae
    where ae.token_hash = encode(digest(btrim(coalesce(input_token, '')), 'sha256'), 'hex')
    limit 1;

    if current_event.id is null then
        return jsonb_build_object('success', false, 'message', 'invalid_token');
    end if;

    if current_event.is_active is not true or now() < current_event.opens_at or now() > current_event.closes_at then
        return jsonb_build_object('success', false, 'message', 'event_closed');
    end if;

    select m.id, coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as member_name
    into current_member
    from public.members m
    where m.is_active is true
      and m.password_hash is not null
      and (
          m.membership_number = btrim(coalesce(input_membership_id, ''))
          or m.membership_id = btrim(coalesce(input_membership_id, ''))
      )
      and m.password_hash = crypt(input_password, m.password_hash)
    limit 1;

    if current_member.id is null then
        return jsonb_build_object('success', false, 'message', 'invalid_login');
    end if;

    saved_status := case when now() > current_event.late_after then 'late' else 'present' end;

    insert into public.attendance_records (event_id, member_id, attendance_status)
    values (current_event.id, current_member.id, saved_status)
    on conflict (event_id, member_id) do nothing;

    get diagnostics inserted_count = row_count;

    if inserted_count = 0 then
        return jsonb_build_object(
            'success', true,
            'already_registered', true,
            'member_name', current_member.member_name
        );
    end if;

    return jsonb_build_object(
        'success', true,
        'already_registered', false,
        'member_name', current_member.member_name,
        'attendance_status', saved_status
    );
end;
$fn$;

create or replace function public.attendance_admin_portal(
    input_membership_id text,
    input_password text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $fn$
declare
    admin_member record;
begin
    select
        m.id,
        coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as member_name
    into admin_member
    from public.members m
    where m.is_active is true
      and m.can_create_meetings is true
      and m.password_hash is not null
      and (
          m.membership_number = btrim(coalesce(input_membership_id, ''))
          or m.membership_id = btrim(coalesce(input_membership_id, ''))
      )
      and m.password_hash = crypt(input_password, m.password_hash)
    limit 1;

    if admin_member.id is null then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    return jsonb_build_object(
        'success', true,
        'admin_name', admin_member.member_name,
        'meetings', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', mt.id,
                'title', mt.title,
                'meeting_date', mt.meeting_date,
                'meeting_time', mt.meeting_time
            ) order by mt.meeting_date desc, mt.meeting_time desc)
            from public.meetings mt
        ), '[]'::jsonb),
        'events', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', ae.id,
                'meeting_id', ae.meeting_id,
                'title', mt.title,
                'opens_at', ae.opens_at,
                'late_after', ae.late_after,
                'closes_at', ae.closes_at,
                'is_active', ae.is_active,
                'attendance_count', (
                    select count(*) from public.attendance_records ar where ar.event_id = ae.id
                ),
                'attendees', coalesce((
                    select jsonb_agg(jsonb_build_object(
                        'name', coalesce(nullif(m.full_name, ''), nullif(m.name, '')),
                        'membership_id', coalesce(nullif(m.membership_number, ''), nullif(m.membership_id, '')),
                        'status', ar.attendance_status,
                        'checked_in_at', ar.checked_in_at
                    ) order by ar.checked_in_at)
                    from public.attendance_records ar
                    join public.members m on m.id = ar.member_id
                    where ar.event_id = ae.id
                ), '[]'::jsonb)
            ) order by ae.created_at desc)
            from public.attendance_events ae
            join public.meetings mt on mt.id = ae.meeting_id
        ), '[]'::jsonb)
    );
end;
$fn$;

create or replace function public.attendance_create_event(
    input_membership_id text,
    input_password text,
    input_meeting_id uuid,
    input_opens_at timestamptz,
    input_late_after timestamptz,
    input_closes_at timestamptz
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $fn$
declare
    admin_member record;
    raw_token text;
    new_event_id uuid;
begin
    select m.id
    into admin_member
    from public.members m
    where m.is_active is true
      and m.can_create_meetings is true
      and m.password_hash is not null
      and (
          m.membership_number = btrim(coalesce(input_membership_id, ''))
          or m.membership_id = btrim(coalesce(input_membership_id, ''))
      )
      and m.password_hash = crypt(input_password, m.password_hash)
    limit 1;

    if admin_member.id is null then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    if not exists (select 1 from public.meetings mt where mt.id = input_meeting_id) then
        return jsonb_build_object('success', false, 'message', 'meeting_not_found');
    end if;

    if input_opens_at is null
       or input_late_after is null
       or input_closes_at is null
       or input_opens_at > input_late_after
       or input_late_after > input_closes_at then
        return jsonb_build_object('success', false, 'message', 'invalid_window');
    end if;

    update public.attendance_events
    set is_active = false
    where meeting_id = input_meeting_id and is_active is true;

    raw_token := encode(gen_random_bytes(24), 'hex');

    insert into public.attendance_events (
        meeting_id,
        token_hash,
        opens_at,
        late_after,
        closes_at,
        created_by
    )
    values (
        input_meeting_id,
        encode(digest(raw_token, 'sha256'), 'hex'),
        input_opens_at,
        input_late_after,
        input_closes_at,
        admin_member.id
    )
    returning id into new_event_id;

    return jsonb_build_object(
        'success', true,
        'event_id', new_event_id,
        'token', raw_token
    );
end;
$fn$;

revoke all on function public.attendance_get_event(text) from public;
revoke all on function public.attendance_check_in(text, text, text) from public;
revoke all on function public.attendance_admin_portal(text, text) from public;
revoke all on function public.attendance_create_event(text, text, uuid, timestamptz, timestamptz, timestamptz) from public;

grant execute on function public.attendance_get_event(text) to anon;
grant execute on function public.attendance_check_in(text, text, text) to anon;
grant execute on function public.attendance_admin_portal(text, text) to anon;
grant execute on function public.attendance_create_event(text, text, uuid, timestamptz, timestamptz, timestamptz) to anon;
