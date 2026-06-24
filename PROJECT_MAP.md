# PROJECT_MAP

مرجع سريع لتقليل القراءة غير الضرورية في مشروع موقع مبادرة همّة الوطنية.

## جذر المشروع
- المسار الأساسي: `C:\Users\user\Documents\Codex\2026-05-18\files-mentioned-by-the-user-himma\himma-site-work`
- النسخة المختصرة/الأقدم في OneDrive ليست المرجع الأساسي للتعديلات الحالية.

## الملفات الأساسية
- `index.html`: الصفحة الرئيسية وكل أقسام الموقع الثابتة: الهيدر، النافبار، الهيرو، الرؤية، لجاننا، الهيكل الإداري، الأخبار، الإعلانات، الأنشطة، نموذج الانضمام، الشركاء، التواصل، تسجيل الدخول، لوحة العضو. يحتوي أيضًا على CSP وروابط ملفات CSS/JS.
- `thank-you.html`: صفحة الشكر بعد إرسال النموذج.
- `assets/css/ui-polish.css`: تحسينات UI/UX والأنيميشن الخفيف والتجاوب، وفيه إضافات مثل كتلة كلمة رئيس المبادرة وموضع نموذج GLB.
- `assets/js/site-main.js`: منطق الواجهة العام، الترجمة AR/EN، تبويبات اللجان والهيكل، وتفاصيل اللجان المعروضة.
- `assets/js/auth.js`: تسجيل الدخول، لوحة الإدارة/العضو، مزامنة أعضاء اللجان والهيكل الإداري مع Supabase.
- `assets/js/himma-ai-chat.js`: واجهة مساعد همّة AI في المتصفح، اللغة، الإرسال إلى Netlify Function، fallback المحلي.
- `assets/js/ui-polish.js`: أنيميشن/تحسينات واجهة خارجية لتجنب CSP inline script.

## ملفات AI
- `assets/js/himma-ai-chat.js`: واجهة مساعد همّة AI. بعد التحويل إلى GitHub Pages لا تستدعي Backend، وتعرض رسالة تعطيل لأن GitHub Pages لا يشغل Functions.
- `ai-knowledge/build-knowledge-base.mjs`: يبني قاعدة معرفة AI من الملفات المسموحة ويستثني الأسرار والنسخ الاحتياطية.
- `ai-knowledge/knowledge-base.json`: ملف مولد، يتحدث عبر build.
- `knowledge/himma-leadership-reference.txt`: مرجع داخلي مختصر لقيادة المبادرة واللجان.

## الأصول
- `assets/images/`: صور الموقع والأعضاء.
- `assets/images/members/`: صور أعضاء مضافة يدويًا مثل صورة علي.
- `assets/images/optimized/`: صور محسنة مولدة.
- `assets/images-manifest.json`: فهرس الصور المحسنة.
- `assets/models/hemma_logo_final.glb`: نموذج GLB المستخدم في الصفحة الرئيسية كما هو بدون تعديل.
- `assets/vendor/model-viewer.min.js`: ملف محلي لعرض GLB بدون إضافة CDN جديد.

## Supabase
- `.env.local`: يحتوي مفاتيح Supabase محليًا، لا يضاف للـ ZIP ولا ينشر.
- `supabase/`: ملفات SQL/مراجع قاعدة البيانات.
- `supabase/attendance-qr.sql`: جداول ودوال نظام حضور الاجتماعات عبر QR.
- `supabase/member-meetings-rpc.sql`: دوال تحميل وإنشاء الاجتماعات من تسجيل دخول الأعضاء الحالي.
- الجداول المهمة حسب العمل السابق: `committee_members`, `members`, `ai_usage_limits`, `ai_chat_logs`.
- أي تعديل على الصلاحيات أو قاعدة البيانات يجب أن يكون موجّهًا ومتحققًا، بدون تغيير schema إلا للضرورة.

## نظام الحضور
- `attendance/index.html`: صفحة تسجيل الحضور وإدارة رموز QR.
- `attendance/app.js`: استدعاءات Supabase وتسجيل الحضور وعرض السجل.
- `attendance/styles.css`: تنسيق صفحة الحضور المتجاوب.
- `attendance/vendor/qrcode.min.js`: مولد QR محلي خفيف.

## البناء والنشر
- `package.json`: يحتوي `npm run build`.
- `npm run build`: يبني قاعدة معرفة AI فقط عبر `ai-knowledge/build-knowledge-base.mjs`.
- النشر المستهدف: GitHub Pages من جذر المشروع `root` لأن `index.html` موجود في الجذر.
- عند إنشاء ZIP للنشر يجب استثناء: `.git`, `node_modules`, `backups`, `backup-before-ai-himma`, `private`, `.env`, `.env.local`, وملفات ZIP القديمة.

## قواعد عمل مختصرة
- لا تقرأ المشروع كاملًا؛ استخدم `rg` موجهًا بالنص/الكلاس/الـ ID.
- لتعديلات الصفحة: غالبًا `index.html` + CSS/JS المرتبط فقط.
- لتعديلات الترجمة: `assets/js/site-main.js`.
- لتعديلات AI: `assets/js/himma-ai-chat.js` + `knowledge/*` عند الحاجة.
- لتعديلات الإدارة/Supabase UI: `assets/js/auth.js` غالبًا.
- بعد تعديل معرفة AI شغّل build لتحديث `ai-knowledge/knowledge-base.json`.
