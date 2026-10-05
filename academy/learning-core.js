(() => {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const now = () => new Date().toISOString();

  function createLearnerProfile(seed = {}) {
    return {
      goals: Array.isArray(seed.goals) ? seed.goals : [],
      learningPace: seed.learningPace || "steady",
      studyTimeMinutes: Number.isFinite(seed.studyTimeMinutes) ? seed.studyTimeMinutes : 20,
      skillMastery: seed.skillMastery && typeof seed.skillMastery === "object" ? seed.skillMastery : {},
      events: Array.isArray(seed.events) ? seed.events.slice(-150) : [],
      diagnostics: seed.diagnostics && typeof seed.diagnostics === "object" ? seed.diagnostics : {},
      updatedAt: seed.updatedAt || now()
    };
  }

  function masteryLevel(value) {
    if (value >= 0.95) return "MASTERED";
    if (value >= 0.8) return "PROFICIENT";
    if (value >= 0.6) return "DEVELOPING";
    if (value > 0) return "EMERGING";
    return "UNKNOWN";
  }

  function recordLearningEvent(profile, event) {
    const next = createLearnerProfile(profile);
    const safeEvent = {
      type: String(event.type || "UNKNOWN"),
      skillId: String(event.skillId || ""),
      contentId: String(event.contentId || ""),
      correct: typeof event.correct === "boolean" ? event.correct : null,
      difficulty: clamp(Number(event.difficulty) || 0.4),
      hintsUsed: Math.max(0, Number(event.hintsUsed) || 0),
      occurredAt: event.occurredAt || now()
    };
    next.events.push(safeEvent);
    next.events = next.events.slice(-150);

    if (safeEvent.skillId && (safeEvent.type === "LESSON_COMPLETED" || safeEvent.type === "QUESTION_ANSWERED")) {
      const current = next.skillMastery[safeEvent.skillId] || { mastery: 0, confidence: 0, evidenceCount: 0, mistakes: 0 };
      const independentSuccess = safeEvent.correct !== false;
      const evidence = (independentSuccess ? 0.13 : -0.09) + (safeEvent.difficulty * 0.05) - (safeEvent.hintsUsed * 0.025);
      const evidenceCount = current.evidenceCount + 1;
      next.skillMastery[safeEvent.skillId] = {
        mastery: clamp(current.mastery + evidence),
        confidence: clamp(evidenceCount / 6),
        evidenceCount,
        mistakes: current.mistakes + (independentSuccess ? 0 : 1),
        lastPracticedAt: safeEvent.occurredAt
      };
    }
    next.updatedAt = now();
    return next;
  }

  function recommendNextAction(profile, curriculum) {
    const learner = createLearnerProfile(profile);
    const candidates = [];
    const selectedGoals = new Set(learner.goals);
    const scopedCurriculum = selectedGoals.size
      ? (curriculum || []).filter(course => selectedGoals.has(course.skillId || course.id))
      : (curriculum || []);
    scopedCurriculum.forEach((course) => {
      const skillId = course.skillId || course.id;
      const state = learner.skillMastery[skillId] || { mastery: 0, confidence: 0, mistakes: 0 };
      const firstIncomplete = course.lessons.findIndex((_, index) => !learner.events.some(event => event.type === "LESSON_COMPLETED" && event.contentId === `${course.id}:${index}`));
      const action = state.mistakes >= 2 ? "REVIEW_MISTAKE" : firstIncomplete >= 0 ? "READ_EXPLANATION" : state.mastery < 0.8 ? "TAKE_QUIZ" : "REVIEW";
      const goalRelevance = learner.goals.includes(skillId) ? 0.18 : 0;
      const score = (1 - state.mastery) * 0.55 + (1 - state.confidence) * 0.25 + Math.min(state.mistakes, 3) * 0.07 + (firstIncomplete >= 0 ? 0.1 : 0) + goalRelevance;
      candidates.push({ courseId: course.id, skillId, action, score, lessonIndex: Math.max(0, firstIncomplete), reason: state.mistakes >= 2 ? "تحتاج مراجعة الأخطاء الأخيرة قبل الانتقال." : state.mastery < 0.6 ? "هذه المهارة ما زالت تحتاج أساسًا أقوى." : "هذه هي الخطوة الأقرب لإكمال مسارك." });
    });
    return candidates.sort((a, b) => b.score - a.score)[0] || null;
  }

  function applyDiagnostic(profile, answers, questionBank) {
    const next = createLearnerProfile(profile);
    const grouped = new Map();
    (answers || []).forEach((answer) => {
      const question = (questionBank || []).find(item => item.id === answer.questionId);
      if (!question) return;
      const bucket = grouped.get(question.skillId) || [];
      bucket.push({ correct: answer.answerIndex === question.correct, difficulty: clamp(Number(question.difficulty) || 0.45) });
      grouped.set(question.skillId, bucket);
    });
    grouped.forEach((responses, skillId) => {
      const correct = responses.filter(item => item.correct).length;
      const accuracy = correct / responses.length;
      const difficulty = responses.reduce((sum, item) => sum + item.difficulty, 0) / responses.length;
      const current = next.skillMastery[skillId] || { mistakes: 0 };
      next.skillMastery[skillId] = {
        mastery: clamp((accuracy * 0.78) + (difficulty * 0.12)),
        confidence: clamp(responses.length / 3),
        evidenceCount: Math.max(current.evidenceCount || 0, responses.length),
        mistakes: (current.mistakes || 0) + (responses.length - correct),
        lastPracticedAt: now()
      };
    });
    next.diagnostics.latest = { completedAt: now(), questionCount: (answers || []).length };
    next.updatedAt = now();
    return next;
  }

  function dueReviews(profile, curriculum) {
    const learner = createLearnerProfile(profile);
    return (curriculum || []).map(course => {
      const skillId = course.skillId || course.id;
      const state = learner.skillMastery[skillId];
      if (!state || !state.lastPracticedAt) return null;
      const elapsedDays = (Date.now() - new Date(state.lastPracticedAt).getTime()) / 86400000;
      const interval = state.mastery >= 0.8 ? 14 : state.mastery >= 0.6 ? 7 : 3;
      return elapsedDays >= interval ? { courseId: course.id, skillId, due: true } : null;
    }).filter(Boolean);
  }

  window.HimmaLearningCore = Object.freeze({ createLearnerProfile, masteryLevel, recordLearningEvent, recommendNextAction, applyDiagnostic, dueReviews });
})();
