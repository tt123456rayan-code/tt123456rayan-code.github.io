# AI همّة الوطني - تقرير التنفيذ

## 1. فحص المشروع

- نوع المشروع: موقع Static HTML/CSS/Vanilla JavaScript يعمل على Netlify مع Netlify Functions.
- الصفحة الرئيسية: `index.html`.
- لوحة الدخول والإدارة: `assets/js/auth.js` داخل نفس الصفحة.
- صفحة اللجان والهيكل الإداري والأعضاء: أقسام داخل `index.html` مع ربط JavaScript.
- Supabase client: `assets/js/env.js` و `assets/js/auth.js`.
- ملفات SQL الحالية: مجلد `supabase/`، وتمت إضافة `supabase_himma_full_schema.sql` و `supabase_himma_seed.sql`.
- الشات/الذكاء القديم: `assets/js/himma-ai-chat.js` و `netlify/functions/himma-ai.js`.
- الذكاء الجديد: `AI همّة الوطني` عبر `assets/js/himma-ai-chat.js` و `netlify/functions/ai-himma.js`.
- ملفات المعرفة: `knowledge/` و `ai-knowledge/knowledge-base.json`.

## 2. ما الذي كان معطلاً

- جدول `committees` غير موجود في Supabase.
- جدول `administrative_structure` غير موجود في Supabase.
- جدول `committee_members` غير موجود في Supabase.
- جداول AI (`ai_knowledge_sources`, `ai_usage_limits`, `ai_chat_logs`) غير موجودة.
- لهذا كانت الواجهة تعرض رسائل مثل: تعذر تحميل اللجان والهيكل الإداري.
- رفع صور الأعضاء كان يحتاج bucket واضح وسياسات Storage مناسبة.

## 3. سبب مشكلة تعذر تحميل اللجان

تم فحص Supabase REST باستخدام إعدادات المشروع، وكانت النتيجة أن جدول `members` موجود، لكن الجداول المطلوبة للجان والهيكل الإداري غير موجودة في قاعدة البيانات. لذلك فشل تحميل القوائم والـ select/options في لوحة الإدارة.

## 4. إصلاح Supabase

- تم إنشاء ملف `supabase_himma_full_schema.sql` بدون `DROP TABLE`.
- الملف ينشئ أو يحدّث الجداول:
  - `committees`
  - `administrative_structure`
  - `members`
  - `committee_members`
  - `ai_knowledge_sources`
  - `ai_usage_limits`
  - `ai_chat_logs`
- يضيف indexes و updated_at triggers و RLS policies.
- يجهز realtime للجداول المناسبة.
- يجهز bucket باسم `member-images`.
- تم إنشاء bucket `member-images` عبر Supabase Storage API بنجاح.

ملاحظة تطبيق SQL: لم أستطع تطبيق ملفات SQL مباشرة من المتصفح المفتوح لأن أداة Browser المتاحة تتحكم بالمتصفح الداخلي فقط وليس Chrome الذي يحتوي جلسة Supabase. كما أن Supabase HTTP API المتاح لا يوفر endpoint لتنفيذ DDL مباشرة. ملفات SQL جاهزة للتطبيق من SQL Editor.

## 5. Seed Data

تم إنشاء `supabase_himma_seed.sql` لإضافة لجان ومناصب افتراضية بدون حذف أو تكرار بيانات موجودة، وبدون اختراع أعضاء جدد.

## 6. إصلاح ربط الواجهة

تم تعديل `assets/js/auth.js` بحيث:

- يحمّل اللجان من `committees`.
- يحمّل المناصب من `administrative_structure`.
- يحمّل أعضاء اللجان من `committee_members`.
- يعرض رسائل خطأ أوضح عند غياب الجداول أو RLS أو env.
- يدعم إضافة وتعديل وحذف اللجنة.
- يدعم اختيار اللجنة والمنصب عند إضافة أو تعديل عضو.
- يدعم رفع صورة العضو إلى bucket `member-images`.
- يدعم تحديث القوائم بعد الحفظ بدون تحديث الصفحة.
- يمنح ريّان صلاحيات إدارة اللجان والهيكل والأعضاء عند توفر الأعمدة والسياسات.

## 7. إصلاح تسجيل دخول الأعضاء

تم تحديث `scripts/bulk-create-auth-users.mjs` لربط أعضاء CSV مع Supabase Auth وتحديث حقول الإدارة عند توفرها. تم تشغيل السكربت محلياً وتحديث/ربط 14 عضواً. تم التأكد من أن تسجيل دخول أيوب السكارنة `NYIJO0011` يعمل عبر Supabase Auth.

## 8. AI همّة الوطني

تم استبدال الذكاء القديم باسم وواجهة `AI همّة الوطني`.

الواجهة:

- عربية RTL.
- تظهر كتويب عائم إلزامي في الموقع.
- تحتوي ترحيب رسمي:
  "أهلاً بك في AI همّة الوطني، مساعدك الذكي للتعرّف على مبادرة همّة الوطنية والثقافة الوطنية والتاريخ الأردني."
- تحتوي أسئلة مقترحة عن المبادرة واللجان والأردن والاستقلال والثقافة الوطنية.
- تدعم fallback محلي إذا تعذر الاتصال بالـ endpoint.

الـ backend:

- endpoint جديد: `netlify/functions/ai-himma.js`.
- endpoint القديم `himma-ai.js` يحوّل إلى الجديد.
- يجلب بيانات Supabase live كل سؤال تقريباً مع cache قصير.
- يبحث في `ai-knowledge/knowledge-base.json`.
- لا يعرض أسماء الملفات أو المصادر للمستخدم.
- لا يعرض أسرار أو كلمات مرور.
- يدعم providers من env: Groq, Gemini, OpenAI, Ollama.
- يعمل محلياً بدون مفتاح خارجي عبر RAG/fallback.

## 9. معرفة الأردن والقيادة الهاشمية

تمت إضافة المرجع `التربية الوطنية.pdf` كمصدر داخلي. لأن الملف مصوّر، تم تشغيل OCR محلي على 151 صفحة وإنشاء:

- `knowledge/jordan-national-education-reference.txt`
- `knowledge/jordan-hashemite-reference-summary.txt`

تم ضبط المساعد حتى لا يذكر أسماء الملفات أو المصادر للمستخدمين. أضيفت إجابات مباشرة عن:

- الملك عبد الله الثاني.
- الأسرة الهاشمية والعائلة المالكة.
- ولي العهد الأمير الحسين بن عبد الله الثاني.
- الملكة رانيا العبد الله.
- استقلال الأردن.
- الثقافة الوطنية.

## 10. قاعدة المعرفة

تم إنشاء:

- `ai-knowledge/build-knowledge-base.mjs`
- `ai-knowledge/knowledge-base.json`
- `ai-knowledge/README.md`

قاعدة المعرفة تسحب النصوص العامة من `index.html` و `knowledge/` وملفات المحتوى العامة. تم استثناء `.env` و `.env.local` و `private/` وملفات الأسرار. عدد chunks الحالي بعد إضافة مرجع الوطنية: 393.

## 11. Netlify

- `netlify.toml` يشغّل:
  `node scripts/write-env.js && node ai-knowledge/build-knowledge-base.mjs`
- Netlify Functions مفعلة من `netlify/functions`.
- `ai-knowledge/**` مضافة إلى included files.
- `scripts/write-env.js` يستخدم:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - ويدعم أيضاً `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- لا يوجد `SUPABASE_SERVICE_ROLE_KEY` في الواجهة.

## 12. متغيرات البيئة المطلوبة

في Netlify:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- اختياري للـ AI الخارجي:
  - `AI_PROVIDER=groq`
  - `GROQ_API_KEY`
  - `GEMINI_API_KEY`
  - `OPENAI_API_KEY`
  - `LOCAL_OLLAMA_URL`

محلياً فقط:

- `SUPABASE_SERVICE_ROLE_KEY`

## 13. الاختبارات المنفذة

- فحص syntax:
  - `assets/js/auth.js`
  - `assets/js/himma-ai-chat.js`
  - `netlify/functions/ai-himma.js`
  - `netlify/functions/himma-ai.js`
  - `netlify/functions/lib/aiProvider.js`
- بناء قاعدة المعرفة: نجح.
- اختبار endpoint محلياً لأسئلة:
  - الملك عبد الله الثاني.
  - العائلة الهاشمية.
  - استقلال الأردن.
- تحقق من عدم وجود حقل `sources` في استجابة المستخدم.
- تحقق من تسجيل دخول عضو موجود مثل أيوب السكارنة بعد bulk auth.

## 14. المتبقي

- تطبيق `supabase_himma_full_schema.sql` ثم `supabase_himma_seed.sql` داخل Supabase SQL Editor لتفعيل جداول اللجان والهيكل والإدارة بشكل كامل.
- بعد تطبيق SQL، تعمل إضافة/تعديل/حذف اللجان والأعضاء ورفع الصور من لوحة الإدارة وفق الكود الحالي.
- نشر آخر نسخة على Netlify أو انتظار deploy Git التلقائي حسب طريقة النشر الحالية.

## 15. تحديث الرؤساء والنواب ولجنة الإعلام

تم تثبيت إجابات مباشرة داخل `netlify/functions/ai-himma.js` و `netlify/functions/himma-ai.js` وداخل الواجهة `assets/js/himma-ai-chat.js` حتى تعمل إجبارياً حتى لو بقيت دالة Netlify القديمة على الكاش.

الإجابات التي تم اختبارها محلياً:

- رئيس مبادرة همّة: عمر دقروق.
- نواب الرؤساء المتوفرون: سلين بكر، ايوب احمد عبد السكارنه، شهد سنجق.
- لجنة الإعلام: شرح مباشر عن دور اللجنة، مع ذكر شهد سنجق كنائب رئيس لجنة الإعلام و Hook Jo كداعم ضمن اللجنة.
- كل رؤساء اللجان المتوفرين من بيانات الموقع، مع توضيح أن رئيس لجنة الإعلام غير ظاهر حالياً في بيانات الموقع.

تم اختبار الواجهة محلياً عبر `http://127.0.0.1:8765/index.html` وكانت الردود صحيحة للأسئلة:

- `من رئيس المبادرة؟`
- `مين نواب الرئساء؟`
- `احكي لي عن لجنة الاعلام`
- `من نائب رئيس لجنة الاعلام؟`
- `كل رؤساء اللجان`

ملاحظة نشر: تم إنشاء حزم نشر مؤقتة ومحاولة النشر عبر Netlify MCP. آخر محاولات Netlify الرسمية أعادت `404 Not Found` من proxy الخاص بالنشر، لذلك بقيت آخر تغييرات الواجهة والدالة جاهزة محلياً ولم يتم تأكيد نشرها على الرابط الحي من داخل هذه الجلسة.

