grant select, insert, delete on public.meetings to authenticated;
grant update (title, meeting_date, meeting_time, location_or_link, meeting_type, details) on public.meetings to authenticated;

alter table public.meetings replica identity full;

drop policy if exists meetings_update_authorized on public.meetings;
create policy meetings_update_authorized
on public.meetings
for update
to authenticated
using (public.current_member_can_create_meetings())
with check (public.current_member_can_create_meetings());

drop policy if exists meetings_delete_authorized on public.meetings;
create policy meetings_delete_authorized
on public.meetings
for delete
to authenticated
using (public.current_member_can_create_meetings());
