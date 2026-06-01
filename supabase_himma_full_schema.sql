create extension if not exists pgcrypto;

create table if not exists public.committees (
    id uuid default gen_random_uuid(),
    slug text unique,
    name text,
    name_ar text,
    name_en text,
    description text,
    article_ar text default '',
    article_en text default '',
    vision_ar text default '',
    vision_en text default '',
    icon text,
    color text,
    is_active boolean default true,
    sort_order integer default 0,
    updated_by uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.committees add column if not exists id uuid default gen_random_uuid();
alter table public.committees add column if not exists slug text;
alter table public.committees add column if not exists name text;
alter table public.committees add column if not exists name_ar text;
alter table public.committees add column if not exists name_en text;
alter table public.committees add column if not exists description text;
alter table public.committees add column if not exists article_ar text default '';
alter table public.committees add column if not exists article_en text default '';
alter table public.committees add column if not exists vision_ar text default '';
alter table public.committees add column if not exists vision_en text default '';
alter table public.committees add column if not exists icon text;
alter table public.committees add column if not exists color text;
alter table public.committees add column if not exists is_active boolean default true;
alter table public.committees add column if not exists sort_order integer default 0;
alter table public.committees add column if not exists updated_by uuid;
alter table public.committees add column if not exists created_at timestamptz default now();
alter table public.committees add column if not exists updated_at timestamptz default now();

update public.committees
set
    name = coalesce(name, name_ar, name_en),
    name_ar = coalesce(name_ar, name),
    name_en = coalesce(name_en, name),
    description = coalesce(description, article_ar, article_en, '')
where name is null or name_ar is null or name_en is null or description is null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'committees_slug_unique'
          and conrelid = 'public.committees'::regclass
    ) then
        alter table public.committees add constraint committees_slug_unique unique (slug);
    end if;
end $$;

create table if not exists public.administrative_structure (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    title_en text,
    description text,
    level integer default 0,
    sort_order integer default 0,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.members (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid unique references auth.users(id) on delete cascade,
    membership_id text unique,
    name text,
    committee text,
    role text,
    avatar_url text,
    password_hash text,
    can_create_meetings boolean default false,
    can_manage_announcements boolean default false,
    can_manage_committees boolean default false,
    can_manage_structure boolean default false,
    can_manage_members boolean default false,
    created_at timestamptz default now()
);

alter table public.members add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;
alter table public.members add column if not exists membership_id text unique;
alter table public.members add column if not exists name text;
alter table public.members add column if not exists committee text;
alter table public.members add column if not exists role text;
alter table public.members add column if not exists avatar_url text;
alter table public.members add column if not exists password_hash text;
alter table public.members add column if not exists can_create_meetings boolean default false;
alter table public.members add column if not exists can_manage_announcements boolean default false;
alter table public.members add column if not exists can_manage_committees boolean default false;
alter table public.members add column if not exists can_manage_structure boolean default false;
alter table public.members add column if not exists can_manage_members boolean default false;
alter table public.members add column if not exists full_name text;
alter table public.members add column if not exists committee_id uuid;
alter table public.members add column if not exists administrative_position_id uuid references public.administrative_structure(id) on delete set null;
alter table public.members add column if not exists position_title text;
alter table public.members add column if not exists membership_number text unique;
alter table public.members add column if not exists image_url text;
alter table public.members add column if not exists bio text;
alter table public.members add column if not exists phone text;
alter table public.members add column if not exists email text;
alter table public.members add column if not exists is_active boolean default true;
alter table public.members add column if not exists sort_order integer default 100;
alter table public.members add column if not exists updated_at timestamptz default now();

update public.members
set
    full_name = coalesce(full_name, name),
    membership_number = coalesce(membership_number, membership_id),
    position_title = coalesce(position_title, role),
    image_url = coalesce(image_url, avatar_url),
    is_active = coalesce(is_active, true)
where full_name is null
   or membership_number is null
   or position_title is null
   or image_url is null
   or is_active is null;

create table if not exists public.committee_members (
    id uuid primary key default gen_random_uuid(),
    committee_slug text references public.committees(slug) on update cascade on delete set null,
    committee_id uuid,
    administrative_position_id uuid references public.administrative_structure(id) on delete set null,
    member_name text not null,
    membership_number text,
    role_ar text,
    role_en text default '',
    position_title text,
    bio_ar text default '',
    bio_en text default '',
    avatar_url text,
    image_url text,
    sort_order integer default 100,
    is_chair boolean default false,
    is_active boolean default true,
    updated_by uuid references public.members(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.committee_members add column if not exists committee_slug text references public.committees(slug) on update cascade on delete set null;
alter table public.committee_members add column if not exists committee_id uuid;
alter table public.committee_members add column if not exists administrative_position_id uuid references public.administrative_structure(id) on delete set null;
alter table public.committee_members add column if not exists member_name text;
alter table public.committee_members add column if not exists membership_number text;
alter table public.committee_members add column if not exists role_ar text;
alter table public.committee_members add column if not exists role_en text default '';
alter table public.committee_members add column if not exists position_title text;
alter table public.committee_members add column if not exists bio_ar text default '';
alter table public.committee_members add column if not exists bio_en text default '';
alter table public.committee_members add column if not exists avatar_url text;
alter table public.committee_members add column if not exists image_url text;
alter table public.committee_members add column if not exists sort_order integer default 100;
alter table public.committee_members add column if not exists is_chair boolean default false;
alter table public.committee_members add column if not exists is_active boolean default true;
alter table public.committee_members add column if not exists updated_by uuid references public.members(id) on delete set null;
alter table public.committee_members add column if not exists created_at timestamptz default now();
alter table public.committee_members add column if not exists updated_at timestamptz default now();

update public.committee_members
set
    position_title = coalesce(position_title, role_ar, role_en),
    image_url = coalesce(image_url, avatar_url)
where position_title is null or image_url is null;

create table if not exists public.ai_knowledge_sources (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    source_type text,
    source_path text,
    content text,
    is_public boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.ai_usage_limits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    visitor_id text,
    usage_date date default current_date,
    message_count integer default 0,
    plan text default 'guest',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint ai_usage_limits_identity_check check (user_id is not null or visitor_id is not null)
);

create unique index if not exists ai_usage_limits_user_day_idx
on public.ai_usage_limits (user_id, usage_date)
where user_id is not null;

create unique index if not exists ai_usage_limits_visitor_day_idx
on public.ai_usage_limits (visitor_id, usage_date)
where visitor_id is not null;

create table if not exists public.ai_chat_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    visitor_id text,
    question text,
    answer text,
    created_at timestamptz default now()
);

create index if not exists committees_active_sort_idx on public.committees (is_active, sort_order, slug);
create index if not exists committee_members_committee_sort_idx on public.committee_members (committee_slug, is_active, sort_order);
create index if not exists members_committee_position_idx on public.members (committee_id, administrative_position_id, is_active);
create index if not exists administrative_structure_active_sort_idx on public.administrative_structure (is_active, level, sort_order);
create index if not exists ai_knowledge_sources_public_idx on public.ai_knowledge_sources (is_public, source_type);

create unique index if not exists committee_members_slug_name_idx
on public.committee_members (committee_slug, member_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists committees_set_updated_at on public.committees;
create trigger committees_set_updated_at
before update on public.committees
for each row execute function public.set_updated_at();

drop trigger if exists administrative_structure_set_updated_at on public.administrative_structure;
create trigger administrative_structure_set_updated_at
before update on public.administrative_structure
for each row execute function public.set_updated_at();

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists committee_members_set_updated_at on public.committee_members;
create trigger committee_members_set_updated_at
before update on public.committee_members
for each row execute function public.set_updated_at();

drop trigger if exists ai_knowledge_sources_set_updated_at on public.ai_knowledge_sources;
create trigger ai_knowledge_sources_set_updated_at
before update on public.ai_knowledge_sources
for each row execute function public.set_updated_at();

drop trigger if exists ai_usage_limits_set_updated_at on public.ai_usage_limits;
create trigger ai_usage_limits_set_updated_at
before update on public.ai_usage_limits
for each row execute function public.set_updated_at();

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select m.id
    from public.members m
    where m.auth_user_id = auth.uid()
    limit 1
$$;

create or replace function public.current_member_can_create_meetings()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((
        select m.can_create_meetings
        from public.members m
        where m.auth_user_id = auth.uid()
        limit 1
    ), false)
$$;

create or replace function public.current_member_can_manage_announcements()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((
        select m.can_manage_announcements
        from public.members m
        where m.auth_user_id = auth.uid()
        limit 1
    ), false)
$$;

create or replace function public.current_member_can_manage_committees()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((
        select m.can_manage_committees or m.can_manage_structure or m.can_manage_members
        from public.members m
        where m.auth_user_id = auth.uid()
        limit 1
    ), false)
$$;

grant execute on function public.current_member_id() to authenticated;
grant execute on function public.current_member_can_create_meetings() to authenticated;
grant execute on function public.current_member_can_manage_announcements() to authenticated;
grant execute on function public.current_member_can_manage_committees() to authenticated;

update public.members
set
    can_create_meetings = membership_id in ('NYIJO0001', 'NYIJO0002'),
    can_manage_announcements = membership_id in ('NYIJO0001', 'NYIJO0002', 'NYIJO0003'),
    can_manage_committees = membership_id in ('NYIJO0002'),
    can_manage_structure = membership_id in ('NYIJO0002'),
    can_manage_members = membership_id in ('NYIJO0002');

drop function if exists public.get_my_profile();
create or replace function public.get_my_profile()
returns table (
    id uuid,
    membership_id text,
    name text,
    committee text,
    role text,
    avatar_url text,
    can_create_meetings boolean,
    can_manage_announcements boolean,
    can_manage_committees boolean,
    can_manage_structure boolean,
    can_manage_members boolean
)
language sql
stable
security definer
set search_path = public
as $$
    select
        m.id,
        coalesce(m.membership_id, m.membership_number) as membership_id,
        coalesce(m.name, m.full_name) as name,
        coalesce(c.name_ar, c.name, m.committee) as committee,
        coalesce(m.role, m.position_title) as role,
        coalesce(m.avatar_url, m.image_url) as avatar_url,
        coalesce(m.can_create_meetings, false),
        coalesce(m.can_manage_announcements, false),
        coalesce(m.can_manage_committees, false),
        coalesce(m.can_manage_structure, false),
        coalesce(m.can_manage_members, false)
    from public.members m
    left join public.committees c on c.id = m.committee_id
    where m.auth_user_id = auth.uid()
      and coalesce(m.is_active, true)
    limit 1
$$;

grant execute on function public.get_my_profile() to authenticated;

alter table public.members enable row level security;
alter table public.committees enable row level security;
alter table public.administrative_structure enable row level security;
alter table public.committee_members enable row level security;
alter table public.ai_knowledge_sources enable row level security;
alter table public.ai_usage_limits enable row level security;
alter table public.ai_chat_logs enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.committees, public.administrative_structure, public.committee_members, public.ai_knowledge_sources to anon, authenticated;
grant select on public.members to authenticated;
grant insert, update, delete on public.committees, public.administrative_structure, public.committee_members to authenticated;
grant update (full_name, committee_id, administrative_position_id, position_title, membership_number, image_url, bio, phone, email, is_active, sort_order, name, committee, role, avatar_url) on public.members to authenticated;

drop policy if exists committees_select_public on public.committees;
create policy committees_select_public
on public.committees
for select
to anon, authenticated
using (coalesce(is_active, true) or public.current_member_can_manage_committees());

drop policy if exists committees_manage_authorized on public.committees;
create policy committees_manage_authorized
on public.committees
for all
to authenticated
using (public.current_member_can_manage_committees())
with check (public.current_member_can_manage_committees());

drop policy if exists administrative_structure_select_public on public.administrative_structure;
create policy administrative_structure_select_public
on public.administrative_structure
for select
to anon, authenticated
using (coalesce(is_active, true) or public.current_member_can_manage_committees());

drop policy if exists administrative_structure_manage_authorized on public.administrative_structure;
create policy administrative_structure_manage_authorized
on public.administrative_structure
for all
to authenticated
using (public.current_member_can_manage_committees())
with check (public.current_member_can_manage_committees());

drop policy if exists committee_members_select_public on public.committee_members;
create policy committee_members_select_public
on public.committee_members
for select
to anon, authenticated
using (coalesce(is_active, true) or public.current_member_can_manage_committees());

drop policy if exists committee_members_manage_authorized on public.committee_members;
create policy committee_members_manage_authorized
on public.committee_members
for all
to authenticated
using (public.current_member_can_manage_committees())
with check (public.current_member_can_manage_committees());

drop policy if exists members_select_self on public.members;
create policy members_select_self
on public.members
for select
to authenticated
using (auth_user_id = auth.uid() or public.current_member_can_manage_committees());

drop policy if exists members_update_authorized on public.members;
create policy members_update_authorized
on public.members
for update
to authenticated
using (public.current_member_can_manage_committees())
with check (public.current_member_can_manage_committees());

drop policy if exists ai_knowledge_sources_select_public on public.ai_knowledge_sources;
create policy ai_knowledge_sources_select_public
on public.ai_knowledge_sources
for select
to anon, authenticated
using (is_public);

drop policy if exists ai_usage_limits_service_only on public.ai_usage_limits;
create policy ai_usage_limits_service_only
on public.ai_usage_limits
for all
to service_role
using (true)
with check (true);

drop policy if exists ai_chat_logs_service_only on public.ai_chat_logs;
create policy ai_chat_logs_service_only
on public.ai_chat_logs
for all
to service_role
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('member-images', 'member-images', true)
on conflict (id) do update set public = true;

drop policy if exists member_images_public_read on storage.objects;
create policy member_images_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'member-images');

drop policy if exists member_images_insert_managers on storage.objects;
create policy member_images_insert_managers
on storage.objects
for insert
to authenticated
with check (bucket_id = 'member-images' and public.current_member_can_manage_committees());

drop policy if exists member_images_update_managers on storage.objects;
create policy member_images_update_managers
on storage.objects
for update
to authenticated
using (bucket_id = 'member-images' and public.current_member_can_manage_committees())
with check (bucket_id = 'member-images' and public.current_member_can_manage_committees());

drop policy if exists member_images_delete_managers on storage.objects;
create policy member_images_delete_managers
on storage.objects
for delete
to authenticated
using (bucket_id = 'member-images' and public.current_member_can_manage_committees());

alter table public.committees replica identity full;
alter table public.administrative_structure replica identity full;
alter table public.committee_members replica identity full;
alter table public.members replica identity full;

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        if not exists (
            select 1 from pg_publication_rel pr
            join pg_publication p on p.oid = pr.prpubid
            where p.pubname = 'supabase_realtime'
              and pr.prrelid = 'public.committees'::regclass
        ) then
            alter publication supabase_realtime add table public.committees;
        end if;

        if not exists (
            select 1 from pg_publication_rel pr
            join pg_publication p on p.oid = pr.prpubid
            where p.pubname = 'supabase_realtime'
              and pr.prrelid = 'public.administrative_structure'::regclass
        ) then
            alter publication supabase_realtime add table public.administrative_structure;
        end if;

        if not exists (
            select 1 from pg_publication_rel pr
            join pg_publication p on p.oid = pr.prpubid
            where p.pubname = 'supabase_realtime'
              and pr.prrelid = 'public.committee_members'::regclass
        ) then
            alter publication supabase_realtime add table public.committee_members;
        end if;
    end if;
end $$;
