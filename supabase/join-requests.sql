create table if not exists public.join_requests (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    age integer not null check (age between 15 and 40),
    phone text not null,
    governorate text not null,
    committee text not null,
    courses text,
    motivation text not null,
    skills text,
    availability text,
    page_url text,
    user_agent text,
    created_at timestamptz not null default now()
);

alter table public.join_requests enable row level security;
alter table public.join_requests alter column age set not null;

revoke all on table public.join_requests from anon;
revoke all on table public.join_requests from authenticated;

grant usage on schema public to anon;
grant insert on table public.join_requests to anon;

drop policy if exists "Allow anonymous join request inserts" on public.join_requests;
create policy "Allow anonymous join request inserts"
on public.join_requests
for insert
to anon
with check (true);
