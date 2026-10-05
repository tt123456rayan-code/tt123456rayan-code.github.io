(() => {
  const config = window.HIMMA_SUPABASE_CONFIG || {};
  const baseUrl = String(config.url || "").replace(/\/$/, "");
  const anonKey = String(config.anonKey || "");
  const sessionKey = "himma_academy_auth_session_v1";
  let session = null;
  let learners = [];
  let contentCourses = [];
  let contentUnits = [];
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  function setStatus(message, failed = false) { const node = $("#admin-status"); node.textContent = message; node.style.color = failed ? "#ffd7df" : ""; }
  function headers() { return { apikey: anonKey, Authorization: `Bearer ${session?.access_token || ""}`, "Content-Type": "application/json" }; }
  async function api(path, options = {}) { const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || data?.msg || "تعذر تحميل بيانات الإدارة."); return data; }
  async function rpc(name, payload = {}) { return api(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(payload) }); }
  async function validateAdmin() {
    try {
      session = JSON.parse(localStorage.getItem(sessionKey) || "null");
      if (!session?.access_token) throw new Error("سجّل الدخول من صفحة الأكاديمية أولًا.");
      const user = await api("/auth/v1/user", { method: "GET" });
      const isAdmin = await rpc("academy_is_admin");
      if (isAdmin !== true) throw new Error("هذا الحساب لا يملك صلاحية إدارة الأكاديمية.");
      setStatus(`مرحبًا ${user.email}. صلاحية الإدارة مفعلة.`); $("#admin-panel").hidden = false; await loadAll();
    } catch (error) { setStatus(error.message || "تعذر التحقق من الصلاحية.", true); }
  }
  function renderLearners() {
    const term = $("#learner-search").value.trim().toLowerCase(); const committee = $("#committee-filter").value.trim().toLowerCase(); const governorate = $("#governorate-filter").value.trim().toLowerCase();
    const rows = learners.filter(row => [row.full_name, ...(row.skills || [])].join(" ").toLowerCase().includes(term) && (!committee || String(row.committee_preference || "").toLowerCase().includes(committee)) && (!governorate || String(row.governorate || "").toLowerCase().includes(governorate)));
    $("#learners-table").innerHTML = rows.length ? `<table><thead><tr><th>الاسم</th><th>اللجنة</th><th>المحافظة</th><th>المهارات</th><th>الحالة</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.full_name)}</td><td>${escapeHtml(row.committee_preference || "-")}</td><td>${escapeHtml(row.governorate || "-")}</td><td>${escapeHtml((row.skills || []).join("، ") || "-")}</td><td>${row.profile_completed_at ? "مكتمل" : "غير مكتمل"}</td></tr>`).join("")}</tbody></table>` : "<p class=\"service-empty\">لا توجد نتائج مطابقة.</p>";
  }
  async function revoke(id) {
    const reason = window.prompt("سبب إلغاء الشهادة:"); if (!reason) return;
    await api(`/rest/v1/academy_certificates?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ revoked_at: new Date().toISOString(), revoked_reason: reason }) });
    await loadAll();
  }
  function contentOptions(rows, label = "title") { return rows.map(row => `<option value="${row.id}">${escapeHtml(row[label])}</option>`).join(""); }
  function renderContentFields() {
    const type = $("#content-type").value;
    const courseSelect = `<label>المادة *<select name="course_id" required>${contentOptions(contentCourses)}</select></label>`;
    const unitSelect = `<label>الوحدة *<select name="unit_id" required>${contentOptions(contentUnits)}</select></label>`;
    const shared = `<label>العنوان *<input name="title" required></label><label>الترتيب <input name="sort_order" type="number" min="0" value="10"></label>`;
    const fields = type === "course" ? `<div class="admin-form-grid"><label>المعرف الإنجليزي *<input name="slug" pattern="[a-z0-9-]{2,80}" required></label>${shared}<label class="wide">الملخص *<textarea name="summary" required></textarea></label><label>التصنيف *<input name="category" required></label></div>`
      : type === "unit" ? `<div class="admin-form-grid">${courseSelect}<label>المعرف الإنجليزي *<input name="slug" pattern="[a-z0-9-]{2,100}" required></label>${shared}<label class="wide">ملخص الوحدة *<textarea name="summary" required></textarea></label></div>`
      : type === "lesson" ? `<div class="admin-form-grid">${courseSelect}${unitSelect}<label>المعرف الإنجليزي *<input name="slug" pattern="[a-z0-9-]{2,80}" required></label>${shared}<label class="wide">شرح الدرس *<textarea name="body" required></textarea></label><label class="wide">النقاط الأساسية، افصل بفاصلة *<textarea name="learning_points" required></textarea></label></div>`
      : `<div class="admin-form-grid">${courseSelect}${unitSelect}<label>الدرس المرتبط <select name="lesson_id"><option value="">غير مرتبط</option></select></label><label>الصعوبة *<select name="difficulty"><option value="1">1 - أساسي</option><option value="2" selected>2 - تمهيدي</option><option value="3">3 - متوسط</option><option value="4">4 - متقدم</option><option value="5">5 - تطبيقي</option></select></label><label class="wide">السؤال *<textarea name="prompt" required></textarea></label><label class="wide">تفسير الإجابة *<textarea name="explanation" required></textarea></label><label>الخيار الأول *<input name="option_1" required></label><label>الخيار الثاني *<input name="option_2" required></label><label>الخيار الثالث *<input name="option_3" required></label><label>الخيار الرابع *<input name="option_4" required></label><label>الإجابة الصحيحة *<select name="correct_option" required><option value="1">الخيار الأول</option><option value="2">الخيار الثاني</option><option value="3">الخيار الثالث</option><option value="4">الخيار الرابع</option></select></label></div>`;
    $("#content-fields").innerHTML = fields;
    const unit = $("#content-fields select[name=unit_id]"); const lesson = $("#content-fields select[name=lesson_id]");
    if (lesson) lesson.innerHTML = `<option value="">غير مرتبط</option>${contentOptions(contentUnits.flatMap(unitRow => unitRow.lessons || []))}`;
    unit?.addEventListener("change", () => { if (lesson) { const selected = contentUnits.find(row => row.id === unit.value); lesson.innerHTML = `<option value="">غير مرتبط</option>${contentOptions(selected?.lessons || [])}`; } });
  }
  function setContentMessage(message, failed = false) { const node = $("#content-message"); node.textContent = message; node.style.color = failed ? "var(--red)" : ""; }
  async function createContent(event) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const type = data.get("content_type"); setContentMessage("جارٍ الحفظ...");
    try {
      if (type === "course") await api("/rest/v1/academy_courses", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ slug: data.get("slug"), title: data.get("title"), summary: data.get("summary"), category: data.get("category"), sort_order: Number(data.get("sort_order")), is_active: false }) });
      if (type === "unit") await api("/rest/v1/academy_units", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ course_id: data.get("course_id"), slug: data.get("slug"), title: data.get("title"), summary: data.get("summary"), sort_order: Number(data.get("sort_order")), is_active: false }) });
      if (type === "lesson") await api("/rest/v1/academy_lessons", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ course_id: data.get("course_id"), unit_id: data.get("unit_id"), slug: data.get("slug"), title: data.get("title"), body: data.get("body"), learning_points: String(data.get("learning_points")).split(/[،,]/).map(item => item.trim()).filter(Boolean), sort_order: Number(data.get("sort_order")), is_active: false }) });
      if (type === "question") {
        const rows = await api("/rest/v1/academy_questions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ source_key: `admin-${crypto.randomUUID()}`, course_id: data.get("course_id"), unit_id: data.get("unit_id"), lesson_id: data.get("lesson_id") || null, prompt: data.get("prompt"), explanation: data.get("explanation"), difficulty: Number(data.get("difficulty")), is_active: false }) });
        const question = rows?.[0]; if (!question?.id) throw new Error("تعذر إنشاء السؤال.");
        await api("/rest/v1/academy_question_options", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify([1,2,3,4].map(index => ({ question_id: question.id, option_text: data.get(`option_${index}`), sort_order: index, is_correct: Number(data.get("correct_option")) === index }))) });
      }
      event.currentTarget.reset(); setContentMessage("تم الحفظ كمسودة. انشره من جدول المحتوى بعد المراجعة."); await loadAll();
    } catch (error) { setContentMessage(error.message || "تعذر حفظ المحتوى.", true); }
  }
  async function togglePublish(id, active) {
    await api(`/rest/v1/academy_courses?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ is_active: !active }) }); await loadAll();
  }
  async function loadAll() {
    const [courses, units, lessons, questions, profiles, attempts, certificates] = await Promise.all([
      api("/rest/v1/academy_courses?select=id,title,is_active"), api("/rest/v1/academy_units?select=id"), api("/rest/v1/academy_lessons?select=id,is_active"), api("/rest/v1/academy_questions?select=id,is_active"),
      api("/rest/v1/academy_learner_profiles?select=full_name,committee_preference,governorate,skills,profile_completed_at&order=full_name.asc"),
      api("/rest/v1/academy_attempts?submitted_at=not.is.null&select=course_title_snapshot,score,passed,submitted_at,academy_learner_profiles(full_name)&order=submitted_at.desc&limit=50"),
      api("/rest/v1/academy_certificates?select=id,recipient_name,course_title,serial_number,issued_at,revoked_at&order=issued_at.desc&limit=50")
    ]);
    $("#content-summary").innerHTML = `<article><strong>${courses.length}</strong><span>مادة</span></article><article><strong>${units.length}</strong><span>وحدة</span></article><article><strong>${lessons.filter(row => row.is_active).length}</strong><span>درس منشور</span></article><article><strong>${questions.filter(row => row.is_active).length}</strong><span>سؤال منشور</span></article>`;
    learners = profiles; renderLearners();
    contentCourses = courses; const unitRows = await api("/rest/v1/academy_units?select=id,title,course_id,academy_lessons(id,title)&order=sort_order.asc"); contentUnits = unitRows.map(row => ({ ...row, lessons: row.academy_lessons || [] }));
    $("#content-publish-list").innerHTML = courses.length ? `<table><thead><tr><th>المادة</th><th>النشر</th><th></th></tr></thead><tbody>${courses.map(row => `<tr><td>${escapeHtml(row.title)}</td><td>${row.is_active ? "منشورة" : "مسودة"}</td><td><button class="admin-revoke content-toggle" data-course-id="${row.id}" data-active="${row.is_active}">${row.is_active ? "إيقاف النشر" : "نشر"}</button></td></tr>`).join("")}</tbody></table>` : "<p class=\"service-empty\">لا توجد مواد.</p>";
    document.querySelectorAll(".content-toggle").forEach(button => button.addEventListener("click", () => togglePublish(button.dataset.courseId, button.dataset.active === "true").catch(error => window.alert(error.message || "تعذر تعديل النشر."))));
    renderContentFields();
    $("#results-table").innerHTML = attempts.length ? `<table><thead><tr><th>المتعلم</th><th>المادة</th><th>الدرجة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>${attempts.map(row => `<tr><td>${escapeHtml(row.academy_learner_profiles?.full_name || "-")}</td><td>${escapeHtml(row.course_title_snapshot)}</td><td>${row.score}/50</td><td>${row.passed ? "مجتاز" : "لم يجتز"}</td><td>${new Date(row.submitted_at).toLocaleDateString("ar-JO")}</td></tr>`).join("")}</tbody></table>` : "<p class=\"service-empty\">لا توجد نتائج بعد.</p>";
    $("#certificates-table").innerHTML = certificates.length ? `<table><thead><tr><th>صاحب الشهادة</th><th>المادة</th><th>الرقم</th><th>الحالة</th><th></th></tr></thead><tbody>${certificates.map(row => `<tr><td>${escapeHtml(row.recipient_name)}</td><td>${escapeHtml(row.course_title)}</td><td>${escapeHtml(row.serial_number)}</td><td>${row.revoked_at ? "ملغاة" : "صالحة"}</td><td>${row.revoked_at ? "-" : `<button class="admin-revoke" data-certificate-id="${row.id}">إلغاء</button>`}</td></tr>`).join("")}</tbody></table>` : "<p class=\"service-empty\">لا توجد شهادات بعد.</p>";
    document.querySelectorAll(".admin-revoke").forEach(button => button.addEventListener("click", () => revoke(button.dataset.certificateId).catch(error => window.alert(error.message || "تعذر إلغاء الشهادة."))));
  }
  ["#learner-search", "#committee-filter", "#governorate-filter"].forEach(selector => $(selector).addEventListener("input", renderLearners));
  $("#content-type").addEventListener("change", renderContentFields); $("#content-create-form").addEventListener("submit", createContent);
  validateAdmin();
})();
