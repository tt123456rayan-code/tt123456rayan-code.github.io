(() => {
  const courseVisuals = {
    culture: { src: "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=82", alt: "شباب يتعلمون ويتعاونون" },
    education: { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=82", alt: "مساحة تعلّم وقراءة" },
    awareness: { src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=82", alt: "تقنية ووعي رقمي" }
  };
  function visualFor(course) { return courseVisuals[course.id] || courseVisuals[course.slug] || courseVisuals.awareness; }
  const defaultCourses = [
    { id: "culture", skillId: "national-identity", category: "ثقافي", categoryId: "culture", title: "الثقافة الوطنية والهوية", summary: "مدخل مبسّط لفهم الهوية الوطنية، المسؤولية، ودور الشباب في الشأن العام.", lessons: [
      { title: "الهوية: معنى يتجدد بالممارسة", text: "الهوية ليست شعارًا ثابتًا فقط؛ هي معرفة بتاريخ المكان، احترام للتنوع، وسلوك مسؤول في الحياة اليومية.", points: ["ابدأ من معرفة السياق الذي تعيش فيه.", "اربط الانتماء بالفعل النافع لا بالكلام وحده.", "احترم اختلاف التجارب والخلفيات داخل المجتمع."] },
      { title: "المواطنة والمسؤولية", text: "المواطنة تعني الوعي بالحقوق والواجبات، والمشاركة الإيجابية في حل المشكلات القريبة منك.", points: ["تحقق من المعلومات قبل نشرها.", "شارك في حوار يحترم الآخرين.", "حوّل الملاحظة إلى اقتراح قابل للتنفيذ."] },
      { title: "الشباب وصناعة الأثر", text: "الأثر يبدأ بخطوة صغيرة واضحة: تعلم مهارة، انضمام لنشاط، أو مبادرة تعالج احتياجًا حقيقيًا.", points: ["اختر قضية واحدة قريبة منك.", "حدد نتيجة يمكن ملاحظتها.", "راجع ما تعلمته وطوّره مع فريقك."] }
    ], quiz: { question: "أي سلوك يعبر عن مواطنة مسؤولة؟", answers: ["نشر المعلومات دون تحقق", "المشاركة الإيجابية والتحقق من المعلومات", "تجاهل المشكلات القريبة"], correct: 1 } },
    { id: "education", skillId: "self-directed-learning", category: "تعليمي", categoryId: "education", title: "مهارات التعلّم الذاتي", summary: "أدوات عملية لتنظيم التعلّم، بناء عادة معرفية، وتحويل الهدف إلى خطة قابلة للاستمرار.", lessons: [
      { title: "ابدأ بهدف قابل للقياس", text: "التعلم يصبح أسهل عندما تحدد ما تريد أن تعرفه أو تنجزه بنهاية فترة قصيرة بدل وضع هدف عام واسع.", points: ["اكتب هدفًا واحدًا واضحًا.", "حدد وقتًا ثابتًا ومناسبًا لك.", "قسّم الموضوع إلى خطوات صغيرة."] },
      { title: "التعلّم النشط", text: "لا تكتفِ بالقراءة. لخّص الفكرة بأسلوبك، اطرح سؤالًا، ثم جرّب تطبيقًا صغيرًا عليها.", points: ["اكتب أهم ثلاث نقاط بعد كل مادة.", "اربط المفهوم بمثال من واقعك.", "راجع المادة بعد فترة قصيرة."] },
      { title: "إدارة الانتباه", text: "جودة الوقت أهم من طوله. جلسات تركيز قصيرة ومنتظمة تساعد على بناء عادة أكثر واقعية.", points: ["أبعد مصادر التشتيت قبل البدء.", "اعمل على مهمة واحدة في كل جلسة.", "خذ استراحة قصيرة ثم قيّم ما أنجزته."] }
    ], quiz: { question: "ما أفضل بداية لخطة تعلّم ذاتي؟", answers: ["هدف واضح وخطوات صغيرة", "دراسة موضوعات كثيرة دفعة واحدة", "انتظار الوقت المثالي"], correct: 0 } },
    { id: "awareness", skillId: "digital-civic-awareness", category: "توعوي", categoryId: "awareness", title: "الوعي الرقمي والمجتمعي", summary: "أساسيات التفكير النقدي، الاستخدام الآمن للتقنية، والتعامل الواعي مع المعلومات والمجتمع.", lessons: [
      { title: "تحقق قبل أن تشارك", text: "المعلومة السريعة ليست دائمًا صحيحة. راجع المصدر والتاريخ والسياق قبل إعادة النشر أو اتخاذ موقف.", points: ["ابحث عن المصدر الأصلي للمعلومة.", "انتبه للتاريخ والسياق.", "قارن مع مصدر موثوق آخر عند الحاجة."] },
      { title: "خصوصيتك الرقمية", text: "بياناتك الشخصية جزء من أمانك. راجع ما تشاركه ومن يمكنه الوصول إليه، واستخدم كلمات مرور قوية ومختلفة.", points: ["لا تشارك رموز التحقق أو كلمات المرور.", "فعّل وسائل الحماية المتاحة.", "راجع صلاحيات التطبيقات بانتظام."] },
      { title: "الحوار المسؤول", text: "الخلاف لا يلغي الاحترام. الحوار الجيد يركز على الفكرة، ويترك مساحة للاستماع والتعلّم.", points: ["ناقش الفكرة دون الإساءة إلى الشخص.", "اسأل قبل أن تفترض.", "توقف عند الإهانة أو المخاطر الرقمية واطلب مساعدة موثوقة."] }
    ], quiz: { question: "ما الخطوة الأولى قبل مشاركة معلومة؟", answers: ["إعادة نشرها بسرعة", "التحقق من المصدر والسياق", "إرسالها إلى الجميع"], correct: 1 } }
  ];
  let courses = defaultCourses;
  const skillLabels = {
    "national-identity": "الثقافة الوطنية والهوية",
    "self-directed-learning": "مهارات التعلّم الذاتي",
    "digital-civic-awareness": "الوعي الرقمي والمجتمعي"
  };
  const diagnosticQuestions = [
    { id: "culture-1", skillId: "national-identity", difficulty: 0.35, question: "أي تصرف يربط الانتماء الوطني بالفعل المسؤول؟", answers: ["نشر أي معلومة بسرعة", "المشاركة الإيجابية والتحقق من المعلومات", "تجاهل القضايا القريبة"], correct: 1, explanation: "المواطنة المسؤولة تجمع بين المشاركة والتحقق." },
    { id: "culture-2", skillId: "national-identity", difficulty: 0.5, question: "كيف يتحول الاهتمام بقضية محلية إلى أثر؟", answers: ["بالاكتفاء بالشكوى", "بتحديد نتيجة واقتراح قابل للتنفيذ", "بانتظار الآخرين"], correct: 1, explanation: "الخطوة العملية تبدأ بتحديد احتياج ونتيجة واضحة." },
    { id: "education-1", skillId: "self-directed-learning", difficulty: 0.35, question: "ما البداية الأكثر واقعية لخطة تعلّم ذاتي؟", answers: ["هدف واضح وخطوات صغيرة", "عدة موضوعات في وقت واحد", "انتظار الوقت المثالي"], correct: 0, explanation: "الهدف المحدد والخطوات الصغيرة يسهلان الاستمرار." },
    { id: "education-2", skillId: "self-directed-learning", difficulty: 0.5, question: "أي ممارسة تعبّر عن التعلّم النشط؟", answers: ["القراءة دون مراجعة", "تلخيص الفكرة وتجربة تطبيق صغير", "الانتقال السريع لموضوع آخر"], correct: 1, explanation: "التطبيق والتلخيص يحولان المعلومة إلى فهم قابل للاستخدام." },
    { id: "awareness-1", skillId: "digital-civic-awareness", difficulty: 0.35, question: "ما الخطوة الأولى قبل مشاركة معلومة؟", answers: ["إعادة إرسالها فورًا", "التحقق من المصدر والسياق", "إرسالها إلى الجميع"], correct: 1, explanation: "المصدر والسياق يحميان من نشر معلومات مضللة." },
    { id: "awareness-2", skillId: "digital-civic-awareness", difficulty: 0.55, question: "ما التصرف الأكثر أمانًا تجاه بياناتك الشخصية؟", answers: ["مشاركة رموز التحقق عند الطلب", "مراجعة صلاحيات التطبيقات وعدم مشاركة كلمات المرور", "استخدام كلمة مرور واحدة للجميع"], correct: 1, explanation: "حماية الحساب تبدأ من كلمات مرور منفصلة وصلاحيات مدروسة." }
  ];

  const storeKey = "himma-academy-progress-v1";
  const core = window.HimmaLearningCore;
  const state = loadState();
  state.learner = core ? core.createLearnerProfile(state.learner) : (state.learner || {});
  const grid = document.querySelector("#path-grid");
  const dialog = document.querySelector("#lesson-dialog");
  const content = document.querySelector("#lesson-content");
  const category = document.querySelector("#dialog-category");
  const closeButton = document.querySelector("#dialog-close");
  const diagnosticDialog = document.querySelector("#diagnostic-dialog");
  const diagnosticContent = document.querySelector("#diagnostic-content");
  const diagnosticStart = document.querySelector("#diagnostic-start");
  const diagnosticClose = document.querySelector("#diagnostic-close");
  const goalForm = document.querySelector("#learning-goal-form");
  const nextActionButton = document.querySelector("#next-action-button");
  let diagnosticIndex = 0;
  let diagnosticAnswers = [];
  let activeCourse = null;
  let activeLesson = 0;

  function loadState() { try { return JSON.parse(localStorage.getItem(storeKey)) || { completed: {} }; } catch { return { completed: {} }; } }
  function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
  function saveState() { localStorage.setItem(storeKey, JSON.stringify(state)); updateProgress(); }
  function lessonKey(courseId, lessonIndex) { return `${courseId}:${lessonIndex}`; }
  function completedCount() { return Object.keys(state.completed).length; }
  function totalLessons() { return courses.reduce((count, course) => count + course.lessons.length, 0); }
  function updateProgress() {
    const total = totalLessons(); const done = completedCount(); const value = total ? Math.round((done / total) * 100) : 0;
    document.querySelector("#progress-value").textContent = `${value}%`;
    document.querySelector("#progress-bar").style.width = `${value}%`;
    const recommendation = core?.recommendNextAction(state.learner, courses);
    document.querySelector("#progress-note").textContent = recommendation ? `أفضل خطوة الآن: ${recommendation.reason}` : (done ? `أكملت ${done} من ${total} دروس. تابع من حيث توقفت.` : "ابدأ أول درس لتُحفظ خطواتك على هذا الجهاز.");
    renderLearnerHome(recommendation);
  }

  function renderLearnerHome(recommendation = core?.recommendNextAction(state.learner, courses)) {
    const masteryList = document.querySelector("#mastery-list");
    const title = document.querySelector("#next-action-title");
    const reason = document.querySelector("#next-action-reason");
    const reviewNote = document.querySelector("#review-note");
    if (!masteryList || !title || !reason || !reviewNote) return;
    const diagnosticDone = Boolean(state.learner?.diagnostics?.latest);
    title.textContent = diagnosticDone && recommendation ? (recommendation.action === "REVIEW_MISTAKE" ? "راجع الأخطاء أولًا" : "تابع المسار الأنسب لك") : "ابدأ بتحديد مستواك";
    reason.textContent = diagnosticDone && recommendation ? recommendation.reason : "سيظهر هنا الإجراء الأنسب بناءً على هدفك، تقدمك، وأدائك في التقييم.";
    nextActionButton.textContent = diagnosticDone && recommendation ? "ابدأ الخطوة المقترحة" : "ابدأ التقييم التشخيصي";
    const entries = Object.entries(state.learner?.skillMastery || {});
    masteryList.innerHTML = entries.length ? entries.map(([skillId, value]) => `<div class="mastery-item"><span>${escapeHtml(skillLabels[skillId] || skillId)}</span><span>${Math.round((value.mastery || 0) * 100)}%</span><div class="mastery-meter"><i style="width:${Math.round((value.mastery || 0) * 100)}%"></i></div></div>`).join("") : "<p class=\"service-empty\">أكمل التقييم التشخيصي لتظهر خريطة إتقانك.</p>";
    const due = core?.dueReviews(state.learner, courses) || [];
    reviewNote.textContent = due.length ? `لديك ${due.length} مراجعة مستحقة.` : (diagnosticDone ? "لا توجد مراجعات مستحقة حاليًا." : "");
  }
  function renderCourses(filter = "all") {
    grid.textContent = "";
    const visible = courses.filter(course => filter === "all" || course.categoryId === filter);
    if (!visible.length) { grid.innerHTML = '<div class="empty-state">لا توجد مسارات ضمن هذا التصنيف حاليًا.</div>'; return; }
    visible.forEach(course => {
      const completed = course.lessons.filter((_, index) => state.completed[lessonKey(course.id, index)]).length;
      const card = document.createElement("article"); card.className = "path-card";
      const lessonList = course.lessons.map((lesson, index) => `<li>${state.completed[lessonKey(course.id, index)] ? "✓ " : ""}${lesson.unitTitle ? `<small>${escapeHtml(lesson.unitTitle)}</small>` : ""}${escapeHtml(lesson.title)}</li>`).join("");
      const visual = visualFor(course);
      card.innerHTML = `<div class="path-visual"><img src="${visual.src}" alt="${visual.alt}" loading="lazy" decoding="async"></div><div class="path-top"><span class="path-category">${escapeHtml(course.category)}</span><span class="path-count">${completed}/${course.lessons.length}</span></div><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.summary)}</p><ul class="lesson-list">${lessonList}</ul><button class="course-button" type="button">${completed === course.lessons.length ? "راجع المسار" : "ابدأ المسار"} <span aria-hidden="true">←</span></button><button class="course-button course-test-button" type="button">اختبار المادة (50 سؤالًا)</button>`;
      card.querySelector("button").addEventListener("click", () => {
        const nextLesson = course.lessons.findIndex((_, index) => !state.completed[lessonKey(course.id, index)]);
        openCourse(course, nextLesson === -1 ? 0 : nextLesson);
      });
      card.querySelector(".course-test-button").addEventListener("click", () => {
        window.HimmaAcademyAssessment?.start(course.id);
      });
      grid.appendChild(card);
    });
  }
  function openCourse(course, lessonIndex) { activeCourse = course; activeLesson = Math.max(0, lessonIndex); renderLesson(); dialog.showModal(); }
  function renderLesson() {
    const lesson = activeCourse.lessons[activeLesson]; const done = Boolean(state.completed[lessonKey(activeCourse.id, activeLesson)]);
    category.textContent = `${activeCourse.category} · ${lesson.unitTitle || `الدرس ${activeLesson + 1}`} · ${activeLesson + 1} من ${activeCourse.lessons.length}`;
    const visual = visualFor(activeCourse);
    content.innerHTML = `<div class="lesson-inner"><p class="lesson-index">${escapeHtml(activeCourse.title)}</p><h2 id="lesson-title">${escapeHtml(lesson.title)}</h2><img class="lesson-visual" src="${visual.src}" alt="${visual.alt}" loading="lazy" decoding="async">${lesson.summary ? `<p class="lesson-summary">${escapeHtml(lesson.summary)}</p>` : ""}<p class="lesson-text">${escapeHtml(lesson.text)}</p>${lesson.objectives?.length ? `<section class="lesson-block"><h3>أهداف الدرس</h3><ul class="lesson-points">${lesson.objectives.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul></section>` : ""}<section class="lesson-block"><h3>نقاط أساسية</h3><ul class="lesson-points">${lesson.points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul></section>${lesson.activity ? `<section class="lesson-activity"><h3>تطبيق عملي</h3><p>${escapeHtml(lesson.activity)}</p></section>` : ""}<div class="lesson-controls"><button class="complete-button" type="button">${done ? "مكتمل ✓" : "أكملت هذا الدرس"}</button>${activeLesson < activeCourse.lessons.length - 1 ? '<button class="next-button" type="button">الدرس التالي ←</button>' : ""}</div></div>`;
    content.querySelector(".complete-button").addEventListener("click", () => {
      state.completed[lessonKey(activeCourse.id, activeLesson)] = true;
      if (core) state.learner = core.recordLearningEvent(state.learner, { type: "LESSON_COMPLETED", skillId: activeCourse.skillId || activeCourse.id, contentId: lessonKey(activeCourse.id, activeLesson), correct: true, difficulty: 0.35 });
      if (lesson.id) window.HimmaAcademyAuth?.saveProgress(lesson.id, 100);
      saveState(); renderLesson(); renderCourses(document.querySelector(".filter.is-active").dataset.filter);
    });
    content.querySelector(".next-button")?.addEventListener("click", () => { activeLesson += 1; renderLesson(); });
    content.querySelectorAll(".quiz-option").forEach(button => button.addEventListener("click", () => answerQuiz(Number(button.dataset.answer))));
  }
  function quizMarkup(quiz) { if (!quiz) return ""; return `<section class="quiz"><h3>${escapeHtml(quiz.question)}</h3>${quiz.answers.map((answer, index) => `<button class="quiz-option" type="button" data-answer="${index}">${escapeHtml(answer)}</button>`).join("")}<p class="quiz-feedback" aria-live="polite"></p></section>`; }
  function answerQuiz(answer) { const quiz = activeCourse.quiz; const feedback = content.querySelector(".quiz-feedback"); const correct = answer === quiz.correct; if (core) { state.learner = core.recordLearningEvent(state.learner, { type: "QUESTION_ANSWERED", skillId: activeCourse.skillId || activeCourse.id, contentId: `${activeCourse.id}:quiz`, correct, difficulty: 0.55 }); saveState(); } feedback.textContent = correct ? "إجابة صحيحة. أحسنت." : "راجع الدرس ثم حاول مرة أخرى."; feedback.className = `quiz-feedback ${correct ? "correct" : "incorrect"}`; }

  function openDiagnostic() {
    diagnosticIndex = 0;
    diagnosticAnswers = [];
    renderDiagnostic();
    diagnosticDialog?.showModal();
  }
  function renderDiagnostic() {
    const question = diagnosticQuestions[diagnosticIndex];
    if (!question || !diagnosticContent) return;
    diagnosticContent.innerHTML = `<div class="diagnostic-body"><p class="diagnostic-progress">سؤال ${diagnosticIndex + 1} من ${diagnosticQuestions.length}</p><h2 id="diagnostic-title">${escapeHtml(question.question)}</h2><p>اختر الإجابة الأقرب لفهمك الحالي. النتيجة تحدد نقطة البداية ولا تُعرض كدرجة عامة.</p>${question.answers.map((answer, index) => `<button class="diagnostic-option" type="button" data-answer="${index}">${escapeHtml(answer)}</button>`).join("")}</div>`;
    diagnosticContent.querySelectorAll(".diagnostic-option").forEach(button => button.addEventListener("click", () => answerDiagnostic(Number(button.dataset.answer))));
  }
  function answerDiagnostic(answerIndex) {
    const question = diagnosticQuestions[diagnosticIndex];
    diagnosticAnswers.push({ questionId: question.id, answerIndex });
    if (diagnosticIndex < diagnosticQuestions.length - 1) {
      diagnosticIndex += 1;
      renderDiagnostic();
      return;
    }
    if (core) state.learner = core.applyDiagnostic(state.learner, diagnosticAnswers, diagnosticQuestions);
    saveState();
    diagnosticContent.innerHTML = `<div class="diagnostic-body"><p class="diagnostic-progress">اكتمل التقييم</p><h2 id="diagnostic-title">تم إعداد نقطة البداية</h2><p>استخدمنا إجاباتك لتقدير مستوى كل مهارة من المسارات الحالية، وستظهر الآن الخطوة التعليمية الأقرب لهدفك.</p><button class="diagnostic-next" type="button">عرض خطتي</button></div>`;
    diagnosticContent.querySelector(".diagnostic-next").addEventListener("click", () => { diagnosticDialog.close(); document.querySelector("#learner-home")?.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".filter").forEach(item => { item.classList.remove("is-active"); item.setAttribute("aria-selected", "false"); }); button.classList.add("is-active"); button.setAttribute("aria-selected", "true"); renderCourses(button.dataset.filter); }));
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  diagnosticStart?.addEventListener("click", openDiagnostic);
  diagnosticClose?.addEventListener("click", () => diagnosticDialog.close());
  diagnosticDialog?.addEventListener("click", event => { if (event.target === diagnosticDialog) diagnosticDialog.close(); });
  goalForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(goalForm);
    state.learner.goals = [String(data.get("learning_goal") || "")].filter(Boolean);
    state.learner.studyTimeMinutes = Number(data.get("study_time")) || 20;
    saveState();
    document.querySelector("#goal-message").textContent = "تم حفظ خطتك على هذا الجهاز.";
  });
  nextActionButton?.addEventListener("click", () => {
    const recommendation = core?.recommendNextAction(state.learner, courses);
    if (!state.learner?.diagnostics?.latest || !recommendation) return openDiagnostic();
    const course = courses.find(item => item.id === recommendation.courseId);
    if (course) openCourse(course, recommendation.lessonIndex);
  });
  const themeButton = document.querySelector("#theme-button");
  const savedTheme = localStorage.getItem("himma-academy-theme");
  if (savedTheme === "dark") document.body.classList.add("dark");
  themeButton.addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("himma-academy-theme", document.body.classList.contains("dark") ? "dark" : "light"); });
  async function loadPublishedCourses() {
    const config = window.HIMMA_SUPABASE_CONFIG;
    const url = config?.url;
    const anonKey = config?.anonKey || config?.anon_key;
    if (!url || !anonKey) return;
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
    try {
      const baseUrl = url.replace(/\/$/, "");
      const [courseResponse, lessonResponse, unitResponse] = await Promise.all([
        fetch(`${baseUrl}/rest/v1/academy_courses?select=id,slug,title,summary,category&is_active=eq.true&order=sort_order.asc`, { headers }),
        fetch(`${baseUrl}/rest/v1/academy_lessons?select=id,course_id,unit_id,slug,title,body,learning_points,learning_objectives,activity,lesson_summary,review_questions,estimated_minutes,sort_order&is_active=eq.true&order=sort_order.asc`, { headers }),
        fetch(`${baseUrl}/rest/v1/academy_units?select=id,course_id,title,summary,sort_order&is_active=eq.true&order=sort_order.asc`, { headers })
      ]);
      if (!courseResponse.ok || !lessonResponse.ok) return;
      const [remoteCourses, remoteLessons, remoteUnits] = await Promise.all([courseResponse.json(), lessonResponse.json(), unitResponse.ok ? unitResponse.json() : Promise.resolve([])]);
      if (!Array.isArray(remoteCourses) || !remoteCourses.length || !Array.isArray(remoteLessons)) return;
      const quizzes = new Map(defaultCourses.map(course => [course.id, course.quiz]));
      const mapped = remoteCourses.map(course => {
        const units = (Array.isArray(remoteUnits) ? remoteUnits : []).filter(unit => unit.course_id === course.id);
        const lessons = remoteLessons.filter(lesson => lesson.course_id === course.id).map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          text: lesson.body,
          points: Array.isArray(lesson.learning_points) ? lesson.learning_points : [],
          unitId: lesson.unit_id,
          unitTitle: units.find(unit => unit.id === lesson.unit_id)?.title || "",
          objectives: Array.isArray(lesson.learning_objectives) ? lesson.learning_objectives : [],
          activity: lesson.activity,
          summary: lesson.lesson_summary,
          reviewQuestions: Array.isArray(lesson.review_questions) ? lesson.review_questions : [],
          estimatedMinutes: lesson.estimated_minutes,
          sortOrder: lesson.sort_order
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        const fallback = defaultCourses.find(item => item.id === course.slug);
        return { id: course.slug, skillId: fallback?.skillId || course.slug, category: course.category, categoryId: course.slug, title: course.title, summary: course.summary, units, lessons, quiz: quizzes.get(course.slug) || null };
      }).filter(course => course.lessons.length);
      if (mapped.length) courses = mapped;
    } catch (_) {
      // The local curriculum remains available when Supabase is unreachable.
    }
  }

  async function initializeAcademy() {
    updateProgress();
    renderCourses();
    await loadPublishedCourses();
    updateProgress();
    renderCourses();
  }
  initializeAcademy();
})();
