(() => {
  const config = window.HIMMA_SUPABASE_CONFIG || {};
  const baseUrl = String(config.url || "").replace(/\/$/, "");
  const anonKey = String(config.anonKey || "");
  const sessionKey = "himma_academy_auth_session_v1";
  const draftKey = "himma_academy_registration_draft_v1";
  let session = null;
  let user = null;
  let profile = null;

  const $ = selector => document.querySelector(selector);
  const accountDialog = $("#account-dialog");
  const registrationDialog = $("#registration-dialog");
  const accountMessage = $("#account-message");
  const registrationMessage = $("#registration-message");
  const form = $("#academy-registration-form");
  let registrationStep = 1;

  function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
  function setMessage(target, message, isError = false) { if (!target) return; target.textContent = message || ""; target.style.color = isError ? "var(--red)" : ""; }
  function configured() { return Boolean(baseUrl && anonKey); }
  function headers(accessToken = session?.access_token) { return { apikey: anonKey, "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }; }
  function readSession() { try { return JSON.parse(localStorage.getItem(sessionKey) || "null"); } catch (_) { return null; } }
  function saveSession(value) { session = value; if (value?.access_token) localStorage.setItem(sessionKey, JSON.stringify(value)); else localStorage.removeItem(sessionKey); }
  function authError(error, fallback) { return error?.msg || error?.message || error?.error_description || fallback; }
  function splitValues(value) { return String(value || "").split(/[\n,،]/).map(item => item.trim()).filter(Boolean).slice(0, 20); }
  function validJordanPhone(value) { return /^(?:07[789]\d{7}|\+9627[789]\d{7})$/.test(String(value || "").replace(/[\s()-]/g, "")); }

  async function request(path, options = {}, authenticated = true) {
    if (!configured()) throw new Error("إعداد الاتصال بالأكاديمية غير متاح حاليًا.");
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...headers(authenticated ? session?.access_token : null), ...(options.headers || {}) } });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(authError(payload, "تعذر إتمام الطلب حاليًا."));
    return payload;
  }

  async function rpc(name, params = {}) { return request(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(params) }); }
  async function loadProfile() {
    if (!user) { profile = null; return null; }
    const rows = await request(`/rest/v1/academy_learner_profiles?auth_user_id=eq.${encodeURIComponent(user.id)}&select=*`, { method: "GET" });
    profile = Array.isArray(rows) ? rows[0] || null : null;
    return profile;
  }
  async function refreshUser() {
    if (!session?.access_token) { user = null; profile = null; updateAccountUi(); return null; }
    try {
      user = await request("/auth/v1/user", { method: "GET" });
      await loadProfile();
    } catch (_) { saveSession(null); user = null; profile = null; }
    updateAccountUi();
    return user;
  }
  function updateAccountUi() {
    const guest = $("#account-guest-view"); const member = $("#account-member-view"); const button = $("#account-open");
    if (guest) guest.hidden = Boolean(user); if (member) member.hidden = !user;
    if (button) button.textContent = user ? "حسابي" : "تسجيل الدخول";
    if (user) {
      $("#account-member-name").textContent = profile?.full_name ? `مرحبًا، ${profile.full_name}` : "أكمل ملفك التعليمي";
      $("#account-member-status").textContent = profile?.profile_completed_at ? "يمكنك الآن حفظ التقدم، دخول الاختبارات، واستعراض شهاداتك." : "أكمل بياناتك التنظيمية لتفعيل الحفظ والاختبارات والشهادات.";
    }
  }
  function showAccount() { accountDialog?.showModal(); }
  function showRegistration(step = user ? 2 : 1) { registrationStep = step; renderRegistrationStep(); if (!registrationDialog?.open) registrationDialog?.showModal(); }
  function renderRegistrationStep() {
    form?.querySelectorAll(".registration-step").forEach(node => { node.hidden = Number(node.dataset.step) !== registrationStep; });
    $("#registration-back").hidden = registrationStep === 1;
    $("#registration-next").hidden = registrationStep === 3;
    $("#registration-submit").hidden = registrationStep !== 3;
    const email = form?.elements.email;
    if (email && user) { email.value = user.email || email.value; email.disabled = true; }
    setMessage(registrationMessage, "");
  }
  function storeDraft() {
    if (!form) return;
    const fields = ["email", "full_name", "phone", "governorate", "city", "neighborhood", "age", "specialization", "professional_status", "committee_preference", "interests", "skills", "volunteering_experience", "courses_completed", "joining_reason", "preferred_role", "availability_text", "participation_mode", "portfolio_urls"];
    const draft = Object.fromEntries(fields.map(name => [name, form.elements[name]?.value || ""]));
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }
  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || "{}");
      Object.entries(draft).forEach(([name, value]) => { if (form?.elements[name] && !form.elements[name].value) form.elements[name].value = value; });
    } catch (_) { /* Invalid local draft is safely ignored. */ }
  }
  function validateStep(step) {
    const section = form?.querySelector(`.registration-step[data-step="${step}"]`);
    const controls = [...(section?.querySelectorAll("input, textarea, select") || [])].filter(input => !input.disabled);
    for (const control of controls) { if (!control.checkValidity()) { control.reportValidity(); return false; } }
    if (step === 1 && form.elements.password.value !== form.elements.password_confirmation.value) { setMessage(registrationMessage, "تأكيد كلمة المرور غير مطابق.", true); return false; }
    if (step === 2 && !validJordanPhone(form.elements.phone.value)) { setMessage(registrationMessage, "أدخل رقم هاتف أردني بصيغة 07 أو +962.", true); return false; }
    return true;
  }
  function profilePayload() {
    const data = new FormData(form);
    return {
      full_name: data.get("full_name"), phone: data.get("phone"), governorate: data.get("governorate"), city: data.get("city"), neighborhood: data.get("neighborhood"),
      committee_preference: data.get("committee_preference"), interests: splitValues(data.get("interests")), skills: splitValues(data.get("skills")),
      volunteering_experience: data.get("volunteering_experience"), courses_completed: data.get("courses_completed"), joining_reason: data.get("joining_reason"), preferred_role: data.get("preferred_role"),
      availability: { text: data.get("availability_text") }, participation_mode: data.get("participation_mode"), age: data.get("age"), specialization: data.get("specialization"),
      professional_status: data.get("professional_status"), portfolio_urls: splitValues(data.get("portfolio_urls")), privacy_accepted: data.get("privacy_accepted") === "on", conduct_accepted: data.get("conduct_accepted") === "on"
    };
  }
  async function completeProfile() {
    const data = new FormData(form);
    await rpc("academy_complete_profile", { input_profile: profilePayload(), input_national_id: data.get("national_id") });
    localStorage.removeItem(draftKey); await loadProfile(); updateAccountUi();
  }
  async function signUpAndComplete() {
    const data = new FormData(form);
    const payload = { email: data.get("email"), password: data.get("password"), data: { full_name: data.get("full_name") }, email_redirect_to: `${location.origin}${location.pathname}#account` };
    const result = await request("/auth/v1/signup", { method: "POST", body: JSON.stringify(payload) }, false);
    if (result?.access_token) { saveSession(result); await refreshUser(); await completeProfile(); return "تم إنشاء الحساب وإكمال ملفك. يمكنك الدخول إلى لوحة المتعلم الآن."; }
    return "تم إنشاء الحساب. تحقق من بريدك الإلكتروني، ثم افتح رابط التحقق وعد إلى الأكاديمية لإكمال ملفك.";
  }
  async function handleRegistration(event) {
    event.preventDefault(); if (!validateStep(3)) return;
    storeDraft(); setMessage(registrationMessage, "جارٍ حفظ البيانات...");
    try {
      const message = user ? (await completeProfile(), "تم حفظ ملفك وتفعيل خدمات الأكاديمية.") : await signUpAndComplete();
      setMessage(registrationMessage, message);
      if (user && profile?.profile_completed_at) { setTimeout(() => { registrationDialog.close(); showAccount(); }, 700); }
    } catch (error) { setMessage(registrationMessage, error.message || "تعذر إكمال التسجيل.", true); }
  }
  async function handleLogin(event) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setMessage(accountMessage, "جارٍ تسجيل الدخول...");
    try {
      const result = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) }, false);
      saveSession(result); await refreshUser(); setMessage(accountMessage, "تم تسجيل الدخول.");
      if (!profile?.profile_completed_at) showRegistration(2);
    } catch (error) { setMessage(accountMessage, "بيانات الدخول غير صحيحة أو لم يتم تفعيل البريد بعد.", true); }
  }
  async function recover() {
    const email = window.prompt("أدخل بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور:");
    if (!email) return;
    try { await request("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email, redirect_to: `${location.origin}${location.pathname}#account` }) }, false); setMessage(accountMessage, "أرسلنا رابط الاستعادة إلى بريدك الإلكتروني."); }
    catch (_) { setMessage(accountMessage, "تعذر إرسال رابط الاستعادة حاليًا.", true); }
  }
  async function signOut() { saveSession(null); user = null; profile = null; updateAccountUi(); accountDialog?.close(); }
  async function saveProgress(lessonId, percent = 100) { if (!profile?.profile_completed_at) return; try { await rpc("academy_mark_lesson_progress", { input_lesson_id: lessonId, input_percent: percent }); } catch (_) { /* Local progress remains available while network is unavailable. */ } }
  async function loadDashboard() {
    if (!profile?.id) { showAccount(); return; }
    const [progress, attempts, certificates] = await Promise.all([
      request(`/rest/v1/academy_lesson_progress?learner_id=eq.${profile.id}&select=progress_percent,completed_at,academy_lessons(title,academy_courses(title))&order=last_opened_at.desc&limit=8`, { method: "GET" }),
      request(`/rest/v1/academy_attempts?learner_id=eq.${profile.id}&submitted_at=not.is.null&select=course_title_snapshot,score,classification,passed,submitted_at&order=submitted_at.desc&limit=8`, { method: "GET" }),
      request(`/rest/v1/academy_certificates?learner_id=eq.${profile.id}&select=course_title,serial_number,verification_token,issued_at,revoked_at&order=issued_at.desc`, { method: "GET" })
    ]);
    const render = (node, rows, empty, make) => { node.innerHTML = rows.length ? rows.map(make).join("") : `<p class="service-empty">${empty}</p>`; };
    render($("#member-progress-list"), progress, "لا يوجد تقدم محفوظ بعد.", row => `<div class="member-list-item"><strong>${escapeHtml(row.academy_lessons?.academy_courses?.title || "مادة")}</strong><span>${escapeHtml(row.academy_lessons?.title || "درس")} · ${row.progress_percent}%</span></div>`);
    render($("#member-attempts-list"), attempts, "لم تسلّم اختبارًا بعد.", row => `<div class="member-list-item"><strong>${escapeHtml(row.course_title_snapshot)}</strong><span>${row.score}/50 · ${row.passed ? "مجتاز" : "يحتاج مراجعة"}</span></div>`);
    render($("#member-certificates-list"), certificates, "لا توجد شهادات بعد.", row => `<div class="member-list-item"><strong>${escapeHtml(row.course_title)}</strong><span>${escapeHtml(row.serial_number)}${row.revoked_at ? " · ملغاة" : ""}</span><a href="./certificate.html?token=${encodeURIComponent(row.verification_token)}">عرض الشهادة</a></div>`);
    $("#member-dashboard").hidden = false; $("#member-dashboard").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function acceptHashSession() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (hash.get("access_token")) { saveSession({ access_token: hash.get("access_token"), refresh_token: hash.get("refresh_token"), token_type: hash.get("token_type") || "bearer" }); history.replaceState(null, "", `${location.pathname}${location.search}#account`); }
  }

  $("#account-open")?.addEventListener("click", showAccount); $("#account-close")?.addEventListener("click", () => accountDialog.close());
  $("#registration-open")?.addEventListener("click", () => showRegistration()); $("#recovery-open")?.addEventListener("click", recover);
  $("#profile-open")?.addEventListener("click", () => showRegistration(2)); $("#account-dashboard-open")?.addEventListener("click", loadDashboard); $("#account-logout")?.addEventListener("click", signOut);
  $("#registration-close")?.addEventListener("click", () => registrationDialog.close()); $("#academy-login-form")?.addEventListener("submit", handleLogin); form?.addEventListener("submit", handleRegistration);
  $("#registration-next")?.addEventListener("click", () => { if (!validateStep(registrationStep)) return; storeDraft(); registrationStep += 1; renderRegistrationStep(); });
  $("#registration-back")?.addEventListener("click", () => { registrationStep -= 1; renderRegistrationStep(); });
  document.addEventListener("DOMContentLoaded", async () => { restoreDraft(); acceptHashSession(); saveSession(readSession()); await refreshUser(); if (location.hash === "#account") showAccount(); });

  window.HimmaAcademyAuth = Object.freeze({ rpc, get user() { return user; }, get profile() { return profile; }, requireProfile: () => Boolean(profile?.profile_completed_at), showAccount, showRegistration, saveProgress, loadDashboard });
})();
