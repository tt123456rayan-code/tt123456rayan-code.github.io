# إعداد تسجيل الدخول عبر Supabase

## 1. إنشاء مشروع Supabase

1. أنشئ مشروع Supabase.
2. من SQL Editor شغّل:

```text
supabase/schema.sql
```

3. لا تفتح التسجيل العام للمستخدمين.

## 2. إنشاء المستخدمين دفعة واحدة

لا تضف الأعضاء يدويًا من لوحة Supabase. استخدم السكربت المحلي الموضح في:

```text
BULK_CREATE_USERS.md
```

السكربت ينشئ مستخدمي Supabase Auth من `private/member-credentials.csv` ويربطهم بجدول `public.members`.
تبقى صلاحيات إنشاء وتعديل وحذف الاجتماعات محصورة في عمر وريّان عبر RLS داخل `supabase/schema.sql`.
تبقى صلاحيات إنشاء وتعديل وحذف الإعلامات محصورة في عمر وريّان وزيد عبر `can_manage_announcements` و RLS.
إذا كان المشروع موجودًا مسبقًا، شغّل `supabase/announcements-permissions.sql` من SQL Editor لتطبيق صلاحيات الاجتماعات والإعلامات.

## 3. Realtime

`schema.sql` يحاول إضافة جدولي `public.meetings` و `public.announcements` إلى `supabase_realtime`. إذا رفضت صلاحيات SQL ذلك، فعّل Realtime للجدولين من Supabase Dashboard.

## 4. Netlify

أضف Environment Variables في Netlify:

```text
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

لا تضف `SUPABASE_SERVICE_ROLE_KEY` إلى Netlify أو أي ملف واجهة.

إعدادات البناء موجودة في `netlify.toml`:

```text
build command: node scripts/write-env.js
publish directory: .
```

إذا لم تكن متغيرات Netlify مضافة أو كانت بقيم غير صحيحة، يحافظ `scripts/write-env.js` على القيم الموجودة مسبقًا في `assets/js/env.js` بدل تفريغها أو استبدالها بقيم خاطئة.

## 5. التشغيل المحلي

لإنشاء `assets/js/env.js` محليًا عند الحاجة، اضبط متغيرات البيئة ثم شغّل:

```bash
node scripts/write-env.js
```

ملفات `.env.local` و `private/` محلية فقط ولا ترفع إلى GitHub أو Netlify.
