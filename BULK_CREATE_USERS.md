# إنشاء أعضاء Supabase دفعة واحدة

هذا السكربت محلي فقط، ويستخدم `service_role` لإنشاء مستخدمي Supabase Auth من ملف `private/member-credentials.csv`.

## 1. إنشاء `.env.local`

أنشئ الملف في جذر المشروع:

```text
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_KEY
```

لا تضع `SUPABASE_SERVICE_ROLE_KEY` في الواجهة أو Netlify. Netlify يحتاج فقط `SUPABASE_URL` و `SUPABASE_ANON_KEY`.

## 2. تجهيز قاعدة البيانات

من Supabase SQL Editor شغّل الملف:

```text
supabase/schema.sql
```

هذا يجعل `password_hash` غير إجباري لأن كلمات المرور أصبحت داخل Supabase Auth فقط.
إذا كانت قاعدة البيانات القديمة ما زالت تفرض `password_hash NOT NULL`، فالسكربت يضع قيمة توافق غير سرية في هذا الحقل فقط، ولا يضع كلمة المرور أو hash مشتق منها.

## 3. تشغيل السكربت

```bash
npm install
node scripts/bulk-create-auth-users.mjs
```

أو:

```bash
npm run bulk:create-auth-users
```

السكربت يقرأ `private/member-credentials.csv`، يحوّل رقم العضوية إلى بريد داخلي مثل:

```text
NYIJO0001 -> nyijo0001@members.nyi.local
```

ثم ينشئ مستخدم Auth بكلمة المرور الموجودة في CSV، ويجعل البريد مؤكدًا، ويربط `auth_user_id` مع جدول `public.members`.

## 4. التحقق

افتح Supabase Dashboard ثم:

```text
Authentication -> Users
```

يجب أن تظهر حسابات الأعضاء. عمر وريّان فقط تكون لديهم صلاحية إنشاء الاجتماعات، وعمر وريّان وزيد تكون لديهم صلاحية إنشاء وتعديل وحذف الإعلامات.

## ملاحظات أمنية

- لا يتم حفظ كلمة المرور كنص عادي في قاعدة البيانات.
- لا يتم طباعة كلمات المرور في مخرجات السكربت.
- `.env.local` و `private/` داخل `.gitignore` ولا يدخلان في ملف Netlify النهائي.
- السكربت يستثني مؤمن إذا وجد في CSV.
