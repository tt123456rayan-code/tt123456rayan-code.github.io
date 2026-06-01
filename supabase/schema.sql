create extension if not exists pgcrypto;

create table if not exists public.members (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null unique references auth.users(id) on delete cascade,
    membership_id text not null unique check (membership_id ~ '^NYIJO[0-9]{4}$'),
    name text not null,
    committee text not null,
    role text not null,
    avatar_url text,
    password_hash text,
    can_create_meetings boolean not null default false,
    can_manage_announcements boolean not null default false,
    can_manage_committees boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.meetings (
    id uuid primary key default gen_random_uuid(),
    title text not null check (char_length(title) between 3 and 160),
    meeting_date date not null,
    meeting_time time not null,
    location_or_link text not null check (char_length(location_or_link) between 2 and 240),
    meeting_type text not null check (meeting_type in ('in_person', 'online')),
    details text not null check (char_length(details) between 1 and 2000),
    created_by uuid not null references public.members(id) on delete restrict,
    created_at timestamptz not null default now()
);

create table if not exists public.announcements (
    id uuid primary key default gen_random_uuid(),
    title text not null check (char_length(title) between 3 and 160),
    body text not null check (char_length(body) between 1 and 3000),
    created_by uuid not null references public.members(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.committees (
    slug text primary key check (slug ~ '^[a-z0-9-]+$'),
    name_ar text not null check (char_length(name_ar) between 2 and 120),
    name_en text not null check (char_length(name_en) between 2 and 160),
    article_ar text not null default '',
    article_en text not null default '',
    vision_ar text not null default '',
    vision_en text not null default '',
    is_active boolean not null default true,
    updated_by uuid references public.members(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.committee_members (
    id uuid primary key default gen_random_uuid(),
    committee_slug text not null references public.committees(slug) on update cascade on delete cascade,
    member_name text not null check (char_length(member_name) between 2 and 160),
    role_ar text not null check (char_length(role_ar) between 2 and 180),
    role_en text not null default '',
    bio_ar text not null default '',
    bio_en text not null default '',
    avatar_url text,
    sort_order integer not null default 100,
    is_chair boolean not null default false,
    is_active boolean not null default true,
    updated_by uuid references public.members(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.meetings enable row level security;
alter table public.announcements enable row level security;
alter table public.committees enable row level security;
alter table public.committee_members enable row level security;

alter table public.members alter column password_hash drop not null;
alter table public.members drop constraint if exists members_password_hash_check;
alter table public.members add column if not exists can_manage_announcements boolean not null default false;
alter table public.members add column if not exists can_manage_committees boolean not null default false;

revoke all on public.members from anon, authenticated;
revoke all on public.meetings from anon, authenticated;
revoke all on public.announcements from anon, authenticated;
revoke all on public.committees from anon, authenticated;
revoke all on public.committee_members from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.meetings to authenticated;
grant update (title, meeting_date, meeting_time, location_or_link, meeting_type, details) on public.meetings to authenticated;
grant select, insert, delete on public.announcements to authenticated;
grant update (title, body) on public.announcements to authenticated;
grant select on public.committees, public.committee_members to anon, authenticated;
grant insert, delete on public.committees, public.committee_members to authenticated;
grant update (name_ar, name_en, article_ar, article_en, vision_ar, vision_en, is_active, updated_by) on public.committees to authenticated;
grant update (committee_slug, member_name, role_ar, role_en, bio_ar, bio_en, avatar_url, sort_order, is_chair, is_active, updated_by) on public.committee_members to authenticated;

alter table public.meetings replica identity full;
alter table public.announcements replica identity full;
alter table public.committees replica identity full;
alter table public.committee_members replica identity full;

update public.members
set can_manage_announcements = membership_id in ('NYIJO0001', 'NYIJO0002', 'NYIJO0003');

update public.members
set can_manage_committees = membership_id in ('NYIJO0002');

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
        select m.can_manage_committees
        from public.members m
        where m.auth_user_id = auth.uid()
        limit 1
    ), false)
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at();

drop trigger if exists committees_set_updated_at on public.committees;
create trigger committees_set_updated_at
before update on public.committees
for each row
execute function public.set_updated_at();

drop trigger if exists committee_members_set_updated_at on public.committee_members;
create trigger committee_members_set_updated_at
before update on public.committee_members
for each row
execute function public.set_updated_at();

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
    can_manage_committees boolean
)
language sql
stable
security definer
set search_path = public
as $$
    select
        m.id,
        m.membership_id,
        m.name,
        m.committee,
        m.role,
        m.avatar_url,
        m.can_create_meetings,
        m.can_manage_announcements,
        m.can_manage_committees
    from public.members m
    where m.auth_user_id = auth.uid()
    limit 1
$$;

create or replace function public.get_meetings()
returns table (
    id uuid,
    title text,
    meeting_date date,
    meeting_time time,
    location_or_link text,
    meeting_type text,
    details text,
    creator_name text,
    created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
    select
        mt.id,
        mt.title,
        mt.meeting_date,
        mt.meeting_time,
        mt.location_or_link,
        mt.meeting_type,
        mt.details,
        creator.name as creator_name,
        mt.created_at
    from public.meetings mt
    join public.members creator on creator.id = mt.created_by
    where public.current_member_id() is not null
    order by mt.meeting_date desc, mt.meeting_time desc, mt.created_at desc
$$;

create or replace function public.get_announcements()
returns table (
    id uuid,
    title text,
    body text,
    creator_name text,
    created_at timestamptz,
    updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
    select
        an.id,
        an.title,
        an.body,
        creator.name as creator_name,
        an.created_at,
        an.updated_at
    from public.announcements an
    join public.members creator on creator.id = an.created_by
    where public.current_member_id() is not null
    order by an.created_at desc
$$;

grant execute on function public.current_member_id() to authenticated;
grant execute on function public.current_member_can_create_meetings() to authenticated;
grant execute on function public.current_member_can_manage_announcements() to authenticated;
grant execute on function public.current_member_can_manage_committees() to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_meetings() to authenticated;
grant execute on function public.get_announcements() to authenticated;

drop policy if exists meetings_select_authenticated on public.meetings;
create policy meetings_select_authenticated
on public.meetings
for select
to authenticated
using (public.current_member_id() is not null);

drop policy if exists meetings_insert_authorized on public.meetings;
create policy meetings_insert_authorized
on public.meetings
for insert
to authenticated
with check (
    created_by = public.current_member_id()
    and public.current_member_can_create_meetings()
);

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

drop policy if exists announcements_select_authenticated on public.announcements;
create policy announcements_select_authenticated
on public.announcements
for select
to authenticated
using (public.current_member_id() is not null);

drop policy if exists announcements_insert_authorized on public.announcements;
create policy announcements_insert_authorized
on public.announcements
for insert
to authenticated
with check (
    created_by = public.current_member_id()
    and public.current_member_can_manage_announcements()
);

drop policy if exists announcements_update_authorized on public.announcements;
create policy announcements_update_authorized
on public.announcements
for update
to authenticated
using (public.current_member_can_manage_announcements())
with check (public.current_member_can_manage_announcements());

drop policy if exists announcements_delete_authorized on public.announcements;
create policy announcements_delete_authorized
on public.announcements
for delete
to authenticated
using (public.current_member_can_manage_announcements());

drop policy if exists committees_select_public on public.committees;
create policy committees_select_public
on public.committees
for select
to anon, authenticated
using (is_active or public.current_member_can_manage_committees());

drop policy if exists committees_insert_authorized on public.committees;
create policy committees_insert_authorized
on public.committees
for insert
to authenticated
with check (public.current_member_can_manage_committees());

drop policy if exists committees_update_authorized on public.committees;
create policy committees_update_authorized
on public.committees
for update
to authenticated
using (public.current_member_can_manage_committees())
with check (public.current_member_can_manage_committees());

drop policy if exists committees_delete_authorized on public.committees;
create policy committees_delete_authorized
on public.committees
for delete
to authenticated
using (public.current_member_can_manage_committees());

drop policy if exists committee_members_select_public on public.committee_members;
create policy committee_members_select_public
on public.committee_members
for select
to anon, authenticated
using (is_active or public.current_member_can_manage_committees());

drop policy if exists committee_members_insert_authorized on public.committee_members;
create policy committee_members_insert_authorized
on public.committee_members
for insert
to authenticated
with check (public.current_member_can_manage_committees());

drop policy if exists committee_members_update_authorized on public.committee_members;
create policy committee_members_update_authorized
on public.committee_members
for update
to authenticated
using (public.current_member_can_manage_committees())
with check (public.current_member_can_manage_committees());

drop policy if exists committee_members_delete_authorized on public.committee_members;
create policy committee_members_delete_authorized
on public.committee_members
for delete
to authenticated
using (public.current_member_can_manage_committees());

insert into public.committees (slug, name_ar, name_en, article_ar, article_en, vision_ar, vision_en)
values
    ('administrative', 'اللجنة الإدارية', 'Administrative Committee', 'تتابع اللجنة الإدارية تنظيم العمل الداخلي وتنسيق الأدوار القيادية والاستشارية في المبادرة.', 'The Administrative Committee coordinates internal operations and leadership roles across the initiative.', 'حوكمة واضحة وتنسيق مرن يساند عمل جميع اللجان.', 'Clear governance and agile coordination that supports every committee.'),
    ('technology', 'لجنة التكنولوجيا والابتكار', 'Technology and Innovation Committee', 'تعمل لجنة التكنولوجيا والابتكار على تمكين الشباب تقنياً وربط الأفكار الرقمية بتطبيقات عملية مفيدة.', 'The Technology and Innovation Committee equips youth with practical digital skills and turns technical ideas into useful applications.', 'جيل شبابي قادر على استخدام التكنولوجيا بأمان وابتكار لخدمة المجتمع.', 'A youth generation able to use technology safely and creatively for community impact.'),
    ('health', 'لجنة الصحة', 'Health Committee', 'تعمل لجنة الصحة على تحويل الوعي الصحي إلى نشاط شبابي عملي عبر حملات وقائية ولقاءات تثقيفية وحوارات حول الصحة الجسدية والنفسية.', 'The Health Committee turns health awareness into practical youth action through prevention campaigns, educational sessions, and conversations about physical and mental wellbeing.', 'رؤيتها بناء مجتمع شبابي يفهم الوقاية ويدعم العادات الصحية ويتعامل مع العافية كمسؤولية يومية تجاه الذات والمجتمع.', 'Its vision is a youth community that understands prevention, supports healthy habits, and treats wellbeing as a daily responsibility toward self and society.'),
    ('legal', 'لجنة الشؤون القانونية', 'Legal Affairs Committee', 'تقرّب لجنة الشؤون القانونية الثقافة القانونية من الشباب بلغة واضحة، وتدعم معرفة الحقوق والواجبات والسلوك المؤسسي السليم.', 'The Legal Affairs Committee makes legal awareness accessible to youth, strengthening understanding of rights, duties, and sound institutional conduct.', 'رؤيتها شباب واع قانونياً، قادر على المشاركة بثقة وفهم واحترام للأنظمة.', 'Its vision is legally aware youth who participate with confidence, understanding, and respect for regulations.'),
    ('sports', 'اللجنة الرياضية', 'Sports Committee', 'تدعم اللجنة الرياضية النشاط البدني والعمل الجماعي والانضباط من خلال مبادرات ومساحات شبابية صحية.', 'The Sports Committee supports physical activity, teamwork, and discipline through healthy youth initiatives and spaces.', 'رياضة مجتمعية تعزز الصحة والانتماء وروح الفريق.', 'Community sport that strengthens health, belonging, and team spirit.'),
    ('arts', 'لجنة الفنون والثقافة', 'Arts and Culture Committee', 'تفتح لجنة الفنون والثقافة مساحة للتعبير الإبداعي واكتشاف المواهب وربط الثقافة بالعمل الشبابي.', 'The Arts and Culture Committee creates space for creative expression, talent discovery, and connecting culture with youth work.', 'ثقافة شبابية حيّة تعبر عن الهوية وتدعم الإبداع.', 'A vibrant youth culture that expresses identity and supports creativity.'),
    ('economy', 'لجنة الاقتصاد والريادة', 'Economy and Entrepreneurship Committee', 'تركز لجنة الاقتصاد والريادة على الوعي المالي، التفكير الريادي، وربط الشباب بفرص بناء المشاريع والأثر الاقتصادي.', 'The Economy and Entrepreneurship Committee focuses on financial awareness, entrepreneurial thinking, and connecting youth to venture-building opportunities.', 'شباب قادر على تحويل الأفكار إلى مشاريع مسؤولة ومستدامة.', 'Youth able to turn ideas into responsible and sustainable ventures.'),
    ('political', 'لجنة التمكين السياسي والدبلوماسي', 'Political and Diplomatic Empowerment Committee', 'تعزز لجنة التمكين السياسي والدبلوماسي فهم المشاركة العامة والحوار وأدوات التأثير المسؤول.', 'The Political and Diplomatic Empowerment Committee strengthens understanding of public participation, dialogue, and responsible influence.', 'مشاركة شبابية واعية ومؤثرة في الشأن العام.', 'Aware and effective youth participation in public life.'),
    ('media', 'لجنة الإعلام', 'Media Committee', 'تدير لجنة الإعلام حضور المبادرة ورسائلها ومحتواها بما يعكس هويتها الشبابية الوطنية.', 'The Media Committee manages the initiative presence, messaging, and content in a way that reflects its national youth identity.', 'إعلام شبابي مهني يبرز أثر همّة ويصل للمجتمع بوضوح.', 'Professional youth media that highlights Himma impact and reaches the community clearly.'),
    ('community', 'اللجنة المجتمعية والعمل التطوعي', 'Community and Volunteering Committee', 'توجه اللجنة المجتمعية والعمل التطوعي طاقة الشباب نحو خدمة مباشرة وفعالة للمجتمع.', 'The Community and Volunteering Committee channels youth energy into direct and effective community service.', 'ثقافة تطوع مستدامة تربط المبادرة باحتياجات الناس.', 'A sustainable volunteering culture that connects the initiative with people needs.'),
    ('public-relations', 'لجنة العلاقات العامة والشراكات', 'Public Relations and Partnerships Committee', 'تبني لجنة العلاقات العامة والشراكات جسور التعاون مع المؤسسات والداعمين والجهات المجتمعية.', 'The Public Relations and Partnerships Committee builds cooperation bridges with institutions, supporters, and community stakeholders.', 'شبكة شراكات موثوقة توسع أثر المبادرة وتحفظ هويتها.', 'A trusted partnership network that expands the initiative impact while preserving its identity.'),
    ('environment', 'لجنة البيئة', 'Environment Committee', 'تعمل لجنة البيئة على رفع الوعي البيئي وربط الاستدامة بسلوك الشباب اليومي ومبادراتهم.', 'The Environment Committee raises environmental awareness and connects sustainability with daily youth behavior and initiatives.', 'شباب يحمي البيئة ويمارس الاستدامة كمسؤولية وطنية.', 'Youth who protect the environment and practice sustainability as a national responsibility.')
on conflict (slug) do update
set
    name_ar = excluded.name_ar,
    name_en = excluded.name_en,
    article_ar = case when public.committees.article_ar = '' then excluded.article_ar else public.committees.article_ar end,
    article_en = case when public.committees.article_en = '' then excluded.article_en else public.committees.article_en end,
    vision_ar = case when public.committees.vision_ar = '' then excluded.vision_ar else public.committees.vision_ar end,
    vision_en = case when public.committees.vision_en = '' then excluded.vision_en else public.committees.vision_en end;

create unique index if not exists committee_members_slug_name_idx
on public.committee_members (committee_slug, member_name);

insert into public.committee_members (committee_slug, member_name, role_ar, role_en, sort_order, is_chair)
values
    ('administrative', 'عمر دقروق', 'رئيس مبادرة همّة', 'President of Himma Initiative', 10, true),
    ('administrative', 'معن مصطفى العدوان', 'المستشار الأعلى لمبادرة همّة', 'Senior Advisor to Himma Initiative', 20, false),
    ('administrative', 'علاء العبادي', 'المستشار الثاني لرئيس مبادرة همّة', 'Second Advisor to the President of Himma Initiative', 30, false),
    ('administrative', 'زيد عبد الله المناصير', 'الأمين العام للمبادرة', 'Secretary General of the Initiative', 40, false),
    ('technology', 'ريان عبد القادر ابوجاموس', 'رئيس لجنة التكنولوجيا والابتكار', 'Chair of the Technology and Innovation Committee', 10, true),
    ('health', 'مها دكيدك', 'رئيسة لجنة الصحة', 'Chair of the Health Committee', 10, true),
    ('health', 'سلين بكر', 'نائبة رئيس لجنة الصحة', 'Deputy Chair of the Health Committee', 20, false),
    ('legal', 'رؤى النشاش', 'رئيسة لجنة الشؤون القانونية', 'Chair of the Legal Affairs Committee', 10, true),
    ('legal', 'ايوب احمد عبد السكارنه', 'نائب رئيس لجنة القانون', 'Deputy Chair of the Legal Committee', 20, false),
    ('environment', 'جمان الزغل', 'رئيسة لجنة البيئة', 'Chair of the Environment Committee', 10, true),
    ('economy', 'أحمد جمال الفاعوري', 'رئيس لجنة الاقتصاد والريادة', 'Chair of the Economy and Entrepreneurship Committee', 10, true),
    ('arts', 'هديل كتكت', 'رئيسة لجنة الفنون والثقافة', 'Chair of the Arts and Culture Committee', 10, true),
    ('media', 'شهد سنجق', 'نائب رئيس لجنة الإعلام', 'Deputy Chair of the Media Committee', 10, false),
    ('media', 'Hook Jo', 'داعم مبادرة همّة ضمن لجنة الإعلام', 'Media Supporter for Himma Initiative', 20, false)
on conflict (committee_slug, member_name) do nothing;

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
           select 1
           from pg_publication_rel pr
           join pg_publication p on p.oid = pr.prpubid
           where p.pubname = 'supabase_realtime'
             and pr.prrelid = 'public.meetings'::regclass
    ) then
        alter publication supabase_realtime add table public.meetings;
    end if;
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
           select 1
           from pg_publication_rel pr
           join pg_publication p on p.oid = pr.prpubid
           where p.pubname = 'supabase_realtime'
             and pr.prrelid = 'public.announcements'::regclass
       ) then
        alter publication supabase_realtime add table public.announcements;
    end if;
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
           select 1
           from pg_publication_rel pr
           join pg_publication p on p.oid = pr.prpubid
           where p.pubname = 'supabase_realtime'
             and pr.prrelid = 'public.committees'::regclass
       ) then
        alter publication supabase_realtime add table public.committees;
    end if;
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
           select 1
           from pg_publication_rel pr
           join pg_publication p on p.oid = pr.prpubid
           where p.pubname = 'supabase_realtime'
             and pr.prrelid = 'public.committee_members'::regclass
       ) then
        alter publication supabase_realtime add table public.committee_members;
    end if;
end $$;
