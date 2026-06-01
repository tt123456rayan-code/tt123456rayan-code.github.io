grant usage on schema public to anon, authenticated;

do $$
begin
    if to_regclass('public.committees') is not null then
        execute 'alter table public.committees enable row level security';
        execute 'revoke all on table public.committees from anon';
        execute 'grant select on table public.committees to anon';
        execute 'drop policy if exists committees_public_select_active on public.committees';
        execute 'create policy committees_public_select_active on public.committees for select to anon using (is_active = true)';
    end if;

    if to_regclass('public.committee_members') is not null then
        execute 'alter table public.committee_members enable row level security';
        execute 'revoke all on table public.committee_members from anon';
        execute 'grant select on table public.committee_members to anon';
        execute 'drop policy if exists committee_members_public_select_active on public.committee_members';
        execute 'create policy committee_members_public_select_active on public.committee_members for select to anon using (is_active = true)';
    end if;

    if to_regclass('public.announcements') is not null then
        execute 'alter table public.announcements enable row level security';
        execute 'revoke all on table public.announcements from anon';
        execute 'grant select on table public.announcements to anon';
        execute 'drop policy if exists announcements_public_select on public.announcements';
        execute 'create policy announcements_public_select on public.announcements for select to anon using (true)';
    end if;

    if to_regclass('public.join_requests') is not null then
        execute 'alter table public.join_requests enable row level security';
        execute 'revoke all on table public.join_requests from anon';
        execute 'grant insert on table public.join_requests to anon';
        execute 'drop policy if exists join_requests_anon_insert_only on public.join_requests';
        execute 'drop policy if exists "Allow anonymous join request inserts" on public.join_requests';
        execute 'create policy join_requests_anon_insert_only on public.join_requests for insert to anon with check (true)';
    end if;

    if to_regclass('public.members') is not null then
        execute 'alter table public.members enable row level security';
        execute 'revoke all on table public.members from anon';
    end if;

    if to_regclass('public.meetings') is not null then
        execute 'alter table public.meetings enable row level security';
        execute 'revoke all on table public.meetings from anon';
    end if;
end $$;
