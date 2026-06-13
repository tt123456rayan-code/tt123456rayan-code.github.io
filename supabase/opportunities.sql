create extension if not exists pgcrypto;

create table if not exists public.himma_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text not null,
  type text not null,
  field text not null,
  governorate text not null,
  mode text not null,
  is_free boolean not null default true,
  has_certificate boolean not null default false,
  deadline date not null,
  age_min integer,
  age_max integer,
  short_description text not null,
  description text not null,
  requirements text[] not null default '{}',
  skills text[] not null default '{}',
  apply_url text not null default '#',
  featured boolean not null default false,
  status text not null default 'approved',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.himma_opportunity_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.himma_opportunities enable row level security;
alter table public.himma_opportunity_admins enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.himma_opportunities to authenticated;
grant select on public.himma_opportunities to anon;
grant select on public.himma_opportunity_admins to authenticated;

insert into public.himma_opportunity_admins (email, display_name)
values ('r47296207@gmail.com', 'ريان')
on conflict (email) do update set display_name = excluded.display_name, is_active = true;

-- أضف إيميلات عمر وزيد الحقيقية هنا بعد إنشائها في Supabase Auth:
-- insert into public.himma_opportunity_admins (email, display_name)
-- values ('OMAR_EMAIL_HERE', 'عمر'), ('ZAID_EMAIL_HERE', 'زيد')
-- on conflict (email) do update set display_name = excluded.display_name, is_active = true;

drop policy if exists "Public can read approved Himma opportunities" on public.himma_opportunities;
create policy "Public can read approved Himma opportunities"
on public.himma_opportunities
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Rayan can manage Himma opportunities" on public.himma_opportunities;
create policy "Rayan can manage Himma opportunities"
on public.himma_opportunities
for all
to authenticated
using (
  exists (
    select 1 from public.himma_opportunity_admins a
    where a.email = (auth.jwt() ->> 'email')
      and a.is_active = true
  )
)
with check (
  exists (
    select 1 from public.himma_opportunity_admins a
    where a.email = (auth.jwt() ->> 'email')
      and a.is_active = true
  )
);

drop policy if exists "Admins can verify own opportunity admin access" on public.himma_opportunity_admins;
create policy "Admins can verify own opportunity admin access"
on public.himma_opportunity_admins
for select
to authenticated
using (email = (auth.jwt() ->> 'email') and is_active = true);
