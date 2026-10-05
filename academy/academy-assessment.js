(() => {
  const dialog = document.querySelector("#assessment-dialog");
  const content = document.querySelector("#assessment-content");
  const counter = document.querySelector("#assessment-counter");
  let attemptId = null;
  let items = [];
  let currentIndex = 0;

  const escapeHtml = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const auth = () => window.HimmaAcademyAuth;
  const selected = item => item.selected_option_id || null;
  const answeredCount = () => items.filter(item => selected(item)).length;
  const flaggedCount = () => items.filter(item => item.flagged_for_review).length;
  const classification = value => ({ needs_review: "لم يجتز - يحتاج إلى مراجعة", acceptable: "مقبول", good: "جيد", very_good: "جيد جدًا", excellent: "ممتاز" }[value] || "");

  function render() {
    const item = items[currentIndex];
    if (!item) return;
    const question = item.question || {};
    counter.textContent = `السؤال ${currentIndex + 1} من ${items.length}`;
    content.innerHTML = `<div class="assessment-meta"><span>تمت الإجابة عن ${answeredCount()} من ${items.length}</span><span>${flaggedCount() ? `${flaggedCount()} للمراجعة` : ""}</span></div><div class="assessment-progress"><i style="width:${((currentIndex + 1) / items.length) * 100}%"></i></div><h2 class="assessment-question">${escapeHtml(question.prompt)}</h2><div class="assessment-options">${(question.options || []).map(option => `<button type="button" class="assessment-option ${selected(item) === option.id ? "is-selected" : ""}" data-option-id="${option.id}">${escapeHtml(option.text)}</button>`).join("")}</div><div class="assessment-controls"><button class="subtle" type="button" id="assessment-flag">${item.flagged_for_review ? "إلغاء علامة المراجعة" : "تحديد للمراجعة"}</button><div><button class="subtle" type="button" id="assessment-prev" ${currentIndex === 0 ? "disabled" : ""}>السابق</button>${currentIndex === items.length - 1 ? '<button class="submit" type="button" id="assessment-submit">تسليم الاختبار</button>' : '<button class="submit" type="button" id="assessment-next">التالي</button>'}</div></div><nav class="assessment-nav" aria-label="أسئلة الاختبار">${items.map((row, index) => `<button type="button" data-goto="${index}" class="${index === currentIndex ? "is-current" : ""} ${selected(row) ? "is-answered" : ""} ${row.flagged_for_review ? "is-flagged" : ""}" aria-label="الانتقال للسؤال ${index + 1}">${index + 1}</button>`).join("")}</nav>`;
    content.querySelectorAll("[data-option-id]").forEach(button => button.addEventListener("click", () => choose(item, button.dataset.optionId)));
    content.querySelectorAll("[data-goto]").forEach(button => button.addEventListener("click", () => { currentIndex = Number(button.dataset.goto); render(); }));
    content.querySelector("#assessment-prev")?.addEventListener("click", () => { currentIndex -= 1; render(); });
    content.querySelector("#assessment-next")?.addEventListener("click", () => { currentIndex += 1; render(); });
    content.querySelector("#assessment-flag")?.addEventListener("click", () => toggleFlag(item));
    content.querySelector("#assessment-submit")?.addEventListener("click", submit);
  }
  async function choose(item, optionId) {
    item.selected_option_id = optionId;
    render();
    try { await auth().rpc("academy_save_attempt_answer", { input_attempt_id: attemptId, input_question_id: item.question_id, input_option_id: optionId, input_flagged: item.flagged_for_review }); }
    catch (error) { item.selected_option_id = null; render(); window.alert(error.message || "تعذر حفظ الإجابة."); }
  }
  async function toggleFlag(item) {
    item.flagged_for_review = !item.flagged_for_review; render();
    try { await auth().rpc("academy_save_attempt_answer", { input_attempt_id: attemptId, input_question_id: item.question_id, input_option_id: selected(item), input_flagged: item.flagged_for_review }); }
    catch (error) { item.flagged_for_review = !item.flagged_for_review; render(); window.alert(error.message || "تعذر حفظ العلامة."); }
  }
  async function submit() {
    const unanswered = items.length - answeredCount();
    if (unanswered && !window.confirm(`لديك ${unanswered} سؤالًا غير مجاب عنه وستحسب بدرجة صفر. هل تريد التسليم؟`)) return;
    content.innerHTML = "<p>جارٍ تصحيح الاختبار بأمان...</p>";
    try {
      const resultRows = await auth().rpc("academy_submit_attempt", { input_attempt_id: attemptId });
      const result = Array.isArray(resultRows) ? resultRows[0] : resultRows;
      const review = await auth().rpc("academy_get_attempt_review", { input_attempt_id: attemptId });
      renderResult(result, Array.isArray(review) ? review : []);
    } catch (error) { content.innerHTML = `<p class="goal-message">${escapeHtml(error.message || "تعذر تسليم الاختبار.")}</p>`; }
  }
  function renderResult(result, review) {
    const certificate = result.certificate_token ? `<a class="certificate-link" href="./certificate.html?token=${encodeURIComponent(result.certificate_token)}">عرض الشهادة وتنزيل PDF</a>` : "";
    counter.textContent = "نتيجة الاختبار";
    content.innerHTML = `<article class="result-card"><p class="eyebrow">نتيجتك</p><p class="result-score">${result.score}/50</p><p><strong>${result.passed ? "مبروك، اجتزت الاختبار." : "لم تجتز الاختبار بعد."}</strong> ${escapeHtml(classification(result.classification))} · ${Number(result.percentage || 0)}%</p>${certificate}<h3>مراجعة الإجابات</h3><ul>${review.map(row => { const options = row.options || []; const answerText = options.find(option => option.id === row.selected_option_id)?.text || "لم تُجب"; const correctText = options.find(option => option.id === row.correct_option_id)?.text || ""; return `<li><strong>${escapeHtml(row.prompt)}</strong><span>إجابتك: ${escapeHtml(answerText)}</span><span>الصحيح: ${escapeHtml(correctText)}</span><span>${escapeHtml(row.explanation)}</span></li>`; }).join("")}</ul></article>`;
  }
  async function start(courseSlug) {
    if (!auth()?.user) { auth().showAccount(); return; }
    if (!auth().requireProfile()) { auth().showRegistration(2); return; }
    try {
      const started = await auth().rpc("academy_start_attempt", { input_course_slug: courseSlug });
      attemptId = typeof started === "string" ? started : started?.[0]?.academy_start_attempt || started?.academy_start_attempt;
      const loaded = await auth().rpc("academy_get_attempt", { input_attempt_id: attemptId });
      items = Array.isArray(loaded) ? loaded : [];
      currentIndex = 0;
      if (items.length !== 50) throw new Error("الاختبار غير مكتمل حاليًا.");
      dialog.showModal(); render();
    } catch (error) { window.alert(error.message || "تعذر بدء الاختبار."); }
  }
  document.querySelector("#assessment-close")?.addEventListener("click", () => dialog.close());
  window.HimmaAcademyAssessment = Object.freeze({ start });
})();
