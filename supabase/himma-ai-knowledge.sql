create extension if not exists pgcrypto;

create table if not exists public.himma_ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  keywords text[] default '{}',
  category text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.himma_ai_knowledge enable row level security;

drop policy if exists "Allow anon read active Himma AI knowledge" on public.himma_ai_knowledge;
create policy "Allow anon read active Himma AI knowledge"
on public.himma_ai_knowledge
for select
to anon
using (is_active = true);

revoke insert, update, delete on public.himma_ai_knowledge from anon;
grant select on public.himma_ai_knowledge to anon;

insert into public.himma_ai_knowledge (question, answer, keywords, category)
values
  (
    'ما هي مبادرة همّة؟',
    'مبادرة همّة الوطنية منصة شبابية وطنية تعمل على تمكين الشباب، صقل مهاراتهم، وتوسيع حضورهم في العمل التطوعي والحوار المجتمعي والمبادرات ذات الأثر.',
    array['همة','مبادرة همّة','تعريف','المبادرة'],
    'about'
  ),
  (
    'كيف أنضم إلى المبادرة؟',
    'يمكنك الانضمام من خلال قسم سجل معنا في الموقع وتعبئة نموذج التسجيل بالمعلومات المطلوبة.',
    array['انضمام','سجل معنا','التسجيل','نموذج التسجيل'],
    'join'
  ),
  (
    'ما هي لجان المبادرة؟',
    'تعرض صفحة لجاننا في الموقع اللجان المتاحة ومقال كل لجنة، وتعرض صفحة الهيكل الإداري الرؤساء والنواب المتوفرين حسب بيانات الموقع.',
    array['اللجان','لجاننا','الهيكل الإداري','رؤساء اللجان'],
    'committees'
  ),
  (
    'كيف أتواصل مع المبادرة؟',
    'يمكنك استخدام قسم تواصل معنا في الموقع للوصول إلى وسائل التواصل المتاحة للمبادرة.',
    array['تواصل','تواصل معنا','التواصل','اتصال'],
    'contact'
  ),
  (
    'أين أجد نموذج التسجيل؟',
    'نموذج التسجيل موجود في قسم سجل معنا داخل الموقع.',
    array['نموذج التسجيل','سجل معنا','استمارة','تسجيل'],
    'join'
  )
on conflict do nothing;
