(() => {
    const state = {
        isOpen: false,
        isSending: false,
        language: "ar",
        elements: {}
    };

    const scriptConfig = document.currentScript;

    const copy = {
        ar: {
            launcherTitle: "AI همّة الوطني",
            launcherNote: "اسأل عن المبادرة والوطن",
            title: "AI همّة الوطني",
            subtitle: "مساعدك الذكي للمبادرة والثقافة الوطنية والتاريخ الأردني",
            close: "إغلاق",
            dialectLabel: "اختر أسلوب الإجابة",
            placeholder: "اكتب سؤالك الوطني هنا...",
            send: "إرسال",
            clear: "مسح المحادثة",
            thinking: "جار تجهيز الإجابة...",
            empty: "اكتب سؤالك أولاً.",
            fallbackNotice: "لم أجد إجابة دقيقة لهذا السؤال حاليًا، يرجى التواصل مع فريق المبادرة.",
            error: "خدمة المساعد غير متاحة مؤقتًا، يرجى المحاولة لاحقًا.",
            noAnswer: "لم أجد إجابة دقيقة لهذا السؤال حاليًا، يرجى التواصل مع فريق المبادرة.",
            welcome: "أهلاً بك في AI همّة الوطني، مساعدك الذكي للتعرّف على مبادرة همّة الوطنية والثقافة الوطنية والتاريخ الأردني.",
            suggestions: [
                "ما هي مبادرة همّة الوطنية؟",
                "ما رؤية ورسالة المبادرة؟",
                "ما لجان المبادرة؟",
                "من رئيس لجنة التكنولوجيا والابتكار؟",
                "من رئيس لجنة التمكين السياسي؟",
                "احكِ لي نبذة عن الأردن.",
                "متى استقل الأردن؟",
                "ما المقصود بالثقافة الوطنية؟"
            ],
            dialects: [
                ["fusha", "العربية الفصحى"],
                ["jordanian", "اللهجة الأردنية"],
                ["fallahi", "لهجة الفلاحين الأردنية"],
                ["bedouin", "لهجة البدو الأردنية"]
            ]
        },
        en: {
            launcherTitle: "AI Himma National",
            launcherNote: "Ask about Himma and Jordan",
            title: "AI Himma National",
            subtitle: "Knowledge assistant for Himma, Jordanian culture, and Jordanian history",
            close: "Close",
            dialectLabel: "Answer style",
            placeholder: "Write your national question here...",
            send: "Send",
            clear: "Clear chat",
            thinking: "Preparing the answer...",
            empty: "Write your question first.",
            fallbackNotice: "I could not find an accurate answer for this question right now. Please contact the initiative team.",
            error: "The assistant service is temporarily unavailable. Please try again later.",
            noAnswer: "I could not find an accurate answer for this question right now. Please contact the initiative team.",
            welcome: "Welcome to AI Himma National, your smart assistant for learning about Himma National Initiative, national culture, and Jordanian history.",
            suggestions: [
                "What is Himma National Initiative?",
                "What are the initiative vision and mission?",
                "What are Himma committees?",
                "Who chairs the Technology and Innovation Committee?",
                "Who chairs the Political Empowerment Committee?",
                "Tell me about Jordan.",
                "When did Jordan gain independence?",
                "What does national culture mean?"
            ],
            dialects: [
                ["fusha", "Modern Standard Arabic"],
                ["jordanian", "Jordanian Arabic"],
                ["fallahi", "Jordanian rural dialect"],
                ["bedouin", "Jordanian Bedouin dialect"]
            ]
        }
    };

    function currentCopy() {
        return copy[state.language] || copy.ar;
    }

    function detectLanguage() {
        return document.documentElement.lang === "en" ? "en" : "ar";
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (text !== undefined) {
            element.textContent = text;
        }
        return element;
    }

    function createAiMark() {
        const wrap = createElement("span", "himma-ai-mark");
        wrap.setAttribute("aria-hidden", "true");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 72 72");
        svg.setAttribute("focusable", "false");

        function svgNode(name, attrs) {
            const node = document.createElementNS("http://www.w3.org/2000/svg", name);
            Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
            return node;
        }

        svg.appendChild(svgNode("rect", { x: "0", y: "0", width: "72", height: "24", fill: "#0b0f0d" }));
        svg.appendChild(svgNode("rect", { x: "0", y: "24", width: "72", height: "24", fill: "#ffffff" }));
        svg.appendChild(svgNode("rect", { x: "0", y: "48", width: "72", height: "24", fill: "#007a3d" }));
        svg.appendChild(svgNode("path", { d: "M0 0 34 36 0 72Z", fill: "#ce1126" }));
        svg.appendChild(svgNode("polygon", {
            points: "13,26 15.3,31.6 21.3,30.7 16.7,34.7 20.2,39.8 15,36.7 10.2,40.4 11.5,34.5 6.5,31.2 12.6,31",
            fill: "#ffffff"
        }));
        svg.appendChild(svgNode("path", {
            d: "M42 13c3.6 3.3 8.4 3.3 12 0M38 17c5.9 4.6 14.1 4.6 20 0",
            fill: "none",
            stroke: "#d4af37",
            "stroke-width": "2.6",
            "stroke-linecap": "round"
        }));
        svg.appendChild(svgNode("path", {
            d: "M36 52 44 28l8 24M39 43h10M57 29v23",
            fill: "none",
            stroke: "#111111",
            "stroke-width": "4.4",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        }));
        svg.appendChild(svgNode("path", {
            d: "M35 54h26",
            fill: "none",
            stroke: "#d4af37",
            "stroke-width": "2.4",
            "stroke-linecap": "round"
        }));
        svg.appendChild(svgNode("circle", { cx: "60", cy: "23", r: "2.6", fill: "#d4af37" }));

        wrap.appendChild(svg);
        return wrap;
    }

    function buildWidget() {
        const text = currentCopy();
        const launcher = createElement("button", "himma-ai-launcher");
        launcher.type = "button";
        launcher.setAttribute("aria-expanded", "false");
        launcher.setAttribute("aria-controls", "himma-ai-panel");

        const launcherCopy = createElement("span", "himma-ai-launcher-copy");
        const launcherTitle = createElement("span", "himma-ai-launcher-title", text.launcherTitle);
        const launcherNote = createElement("span", "himma-ai-launcher-note", text.launcherNote);
        launcherCopy.append(launcherTitle, launcherNote);
        launcher.append(createAiMark(), launcherCopy);

        const panel = createElement("section", "himma-ai-panel");
        panel.id = "himma-ai-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-labelledby", "himma-ai-title");

        const header = createElement("div", "himma-ai-header");
        const headerText = createElement("div", "himma-ai-title-wrap");
        const title = createElement("h2", "himma-ai-title", text.title);
        title.id = "himma-ai-title";
        const subtitle = createElement("p", "himma-ai-subtitle", text.subtitle);
        headerText.append(title, subtitle);
        const close = createElement("button", "himma-ai-close", "×");
        close.type = "button";
        close.setAttribute("aria-label", text.close);
        header.append(createAiMark(), headerText, close);

        const body = createElement("div", "himma-ai-body");
        const controls = createElement("div", "himma-ai-controls");
        const label = createElement("label", "himma-ai-label", text.dialectLabel);
        label.setAttribute("for", "himma-ai-dialect");
        const select = createElement("select", "himma-ai-select");
        select.id = "himma-ai-dialect";
        const suggestions = createElement("div", "himma-ai-suggestions");
        controls.append(label, select, suggestions);

        const messages = createElement("div", "himma-ai-messages");
        messages.setAttribute("aria-live", "polite");

        const form = createElement("form", "himma-ai-form");
        const input = createElement("textarea", "himma-ai-input");
        input.name = "message";
        input.rows = "3";
        input.maxLength = 1000;
        const actions = createElement("div", "himma-ai-actions");
        const send = createElement("button", "himma-ai-send", text.send);
        send.type = "submit";
        const clear = createElement("button", "himma-ai-clear", text.clear);
        clear.type = "button";
        actions.append(send, clear);
        const status = createElement("div", "himma-ai-status");
        status.setAttribute("role", "status");
        form.append(input, actions, status);

        body.append(controls, messages, form);
        panel.append(header, body);
        document.body.append(launcher, panel);

        state.elements = {
            launcher,
            launcherTitle,
            launcherNote,
            panel,
            title,
            subtitle,
            close,
            label,
            select,
            suggestions,
            messages,
            form,
            input,
            send,
            clear,
            status
        };

        refreshLanguage();
        appendMessage("bot", text.welcome);
    }

    function refreshLanguage() {
        state.language = detectLanguage();
        const text = currentCopy();
        const els = state.elements;
        if (!els.launcher) {
            return;
        }

        els.launcherTitle.textContent = text.launcherTitle;
        els.launcherNote.textContent = text.launcherNote;
        els.launcher.setAttribute("aria-label", text.launcherTitle);
        els.title.textContent = text.title;
        els.subtitle.textContent = text.subtitle;
        els.close.setAttribute("aria-label", text.close);
        els.label.textContent = text.dialectLabel;
        els.input.placeholder = text.placeholder;
        els.send.textContent = text.send;
        els.clear.textContent = text.clear;
        els.panel.dir = state.language === "en" ? "ltr" : "rtl";
        els.launcher.dir = state.language === "en" ? "ltr" : "rtl";

        const selectedValue = els.select.value || "jordanian";
        els.select.textContent = "";
        text.dialects.forEach(([value, label]) => {
            const option = createElement("option", "", label);
            option.value = value;
            els.select.appendChild(option);
        });
        els.select.value = selectedValue;

        els.suggestions.textContent = "";
        text.suggestions.forEach((suggestion) => {
            const chip = createElement("button", "himma-ai-chip", suggestion);
            chip.type = "button";
            chip.addEventListener("click", () => {
                els.input.value = suggestion;
                els.input.focus();
                sendQuestion(suggestion);
            });
            els.suggestions.appendChild(chip);
        });
    }

    function setOpen(isOpen) {
        state.isOpen = isOpen;
        const els = state.elements;
        els.panel.classList.toggle("is-open", isOpen);
        els.launcher.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
            setTimeout(() => els.input.focus(), 40);
        }
    }

    function appendMessage(role, message, isError = false) {
        const bubble = createElement("div", `himma-ai-message himma-ai-message-${role}`);
        if (isError) {
            bubble.classList.add("himma-ai-message-error");
        }
        bubble.textContent = message;
        state.elements.messages.appendChild(bubble);
        state.elements.messages.scrollTop = state.elements.messages.scrollHeight;
        return bubble;
    }

    function setStatus(message) {
        state.elements.status.textContent = message || "";
    }

    function normalizeArabic(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[\u064b-\u065f\u0670]/g, "")
            .replace(/[أإآ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ة/g, "ه")
            .replace(/[ؤئء]/g, "")
            .replace(/[^\p{L}\p{N}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function tokenize(value) {
        return normalizeArabic(value).split(" ").filter((part) => part.length > 1);
    }

    function scoreKnowledgeRow(row, question) {
        const normalizedQuestion = normalizeArabic(question);
        const rowQuestion = normalizeArabic(row.question);
        const rowCategory = normalizeArabic(row.category);
        const keywords = Array.isArray(row.keywords) ? row.keywords : [];
        const questionTerms = tokenize(question);
        let score = 0;

        if (rowQuestion === normalizedQuestion) {
            score += 100;
        }
        if (rowQuestion.includes(normalizedQuestion) || normalizedQuestion.includes(rowQuestion)) {
            score += 45;
        }
        keywords.forEach((keyword) => {
            const normalizedKeyword = normalizeArabic(keyword);
            if (normalizedKeyword && normalizedQuestion.includes(normalizedKeyword)) {
                score += 28;
            }
        });
        questionTerms.forEach((term) => {
            if (rowQuestion.includes(term)) {
                score += 8;
            }
            if (rowCategory.includes(term)) {
                score += 5;
            }
            keywords.forEach((keyword) => {
                if (normalizeArabic(keyword).includes(term)) {
                    score += 6;
                }
            });
        });

        return score;
    }

    async function requestAiAnswer(question) {
        const config = window.HIMMA_SUPABASE_CONFIG;
        if (!config || !config.url || !config.anonKey) {
            throw new Error("Missing Supabase public config");
        }

        const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/himma_ai_knowledge?select=question,answer,keywords,category&is_active=eq.true&limit=100`;
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "apikey": config.anonKey,
                "Authorization": `Bearer ${config.anonKey}`
            }
        });

        if (!response.ok) {
            throw new Error("Supabase knowledge query failed");
        }

        const rows = await response.json().catch(() => []);
        const ranked = Array.isArray(rows)
            ? rows
                .map((row) => ({ row, score: scoreKnowledgeRow(row, question) }))
                .filter((item) => item.score >= 18 && item.row.answer)
                .sort((a, b) => b.score - a.score)
            : [];

        if (!ranked.length) {
            return { answer: currentCopy().noAnswer };
        }

        return { answer: ranked[0].row.answer };
    }

    async function sendQuestion(rawQuestion) {
        const text = currentCopy();
        const question = String(rawQuestion || state.elements.input.value || "").trim();
        if (!question) {
            setStatus(text.empty);
            return;
        }
        if (state.isSending) {
            return;
        }

        state.isSending = true;
        state.elements.send.disabled = true;
        setStatus("");
        appendMessage("user", question);
        state.elements.input.value = "";
        const pending = appendMessage("bot", text.thinking);

        try {
            const result = await requestAiAnswer(question);
            pending.textContent = result.answer;
        } catch (error) {
            pending.textContent = text.error;
            pending.classList.add("himma-ai-message-error");
            setStatus(text.error);
        } finally {
            state.isSending = false;
            state.elements.send.disabled = false;
            state.elements.messages.scrollTop = state.elements.messages.scrollHeight;
        }
    }

    function bindEvents() {
        const els = state.elements;
        els.launcher.addEventListener("click", () => setOpen(!state.isOpen));
        els.close.addEventListener("click", () => setOpen(false));
        els.clear.addEventListener("click", () => {
            els.messages.textContent = "";
            appendMessage("bot", currentCopy().welcome);
            setStatus("");
        });
        els.form.addEventListener("submit", (event) => {
            event.preventDefault();
            sendQuestion();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && state.isOpen) {
                setOpen(false);
            }
        });

        new MutationObserver(refreshLanguage).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["lang", "dir"]
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        state.language = detectLanguage();
        buildWidget();
        bindEvents();
    });
})();
