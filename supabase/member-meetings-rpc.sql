create extension if not exists pgcrypto;

create or replace function public.member_meetings_portal(
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
    current_member record;
begin
    select
        m.id,
        coalesce(nullif(m.full_name, ''), nullif(m.name, '')) as member_name,
        coalesce(m.can_create_meetings, false) as can_create_meetings
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

    return jsonb_build_object(
        'success', true,
        'can_create_meetings', current_member.can_create_meetings,
        'meetings', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', mt.id,
                'title', mt.title,
                'meeting_date', mt.meeting_date,
                'meeting_time', mt.meeting_time,
                'location_or_link', mt.location_or_link,
                'meeting_type', mt.meeting_type,
                'details', mt.details,
                'creator_name', coalesce(nullif(creator.full_name, ''), nullif(creator.name, '')),
                'created_at', mt.created_at
            ) order by mt.meeting_date desc, mt.meeting_time desc, mt.created_at desc)
            from public.meetings mt
            join public.members creator on creator.id = mt.created_by
        ), '[]'::jsonb)
    );
end;
$fn$;

create or replace function public.member_create_meeting(
    input_membership_id text,
    input_password text,
    input_title text,
    input_meeting_date date,
    input_meeting_time time,
    input_location_or_link text,
    input_meeting_type text,
    input_details text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $fn$
declare
    current_member record;
    new_meeting_id uuid;
begin
    select m.id
    into current_member
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

    if current_member.id is null then
        return jsonb_build_object('success', false, 'message', 'not_allowed');
    end if;

    if char_length(btrim(coalesce(input_title, ''))) < 3
       or input_meeting_date is null
       or input_meeting_time is null
       or char_length(btrim(coalesce(input_location_or_link, ''))) < 2
       or input_meeting_type not in ('in_person', 'online')
       or char_length(btrim(coalesce(input_details, ''))) < 1 then
        return jsonb_build_object('success', false, 'message', 'invalid_data');
    end if;

    insert into public.meetings (
        title,
        meeting_date,
        meeting_time,
        location_or_link,
        meeting_type,
        details,
        created_by
    )
    values (
        btrim(input_title),
        input_meeting_date,
        input_meeting_time,
        btrim(input_location_or_link),
        input_meeting_type,
        btrim(input_details),
        current_member.id
    )
    returning id into new_meeting_id;

    return jsonb_build_object('success', true, 'meeting_id', new_meeting_id);
end;
$fn$;

revoke all on function public.member_meetings_portal(text, text) from public;
revoke all on function public.member_create_meeting(text, text, text, date, time, text, text, text) from public;

grant execute on function public.member_meetings_portal(text, text) to anon;
grant execute on function public.member_create_meeting(text, text, text, date, time, text, text, text) to anon;
