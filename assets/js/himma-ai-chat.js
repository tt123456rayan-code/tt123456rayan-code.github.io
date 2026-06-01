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
            fallbackNotice: "تم استخدام الرد المحلي لأن الاتصال بالذكاء الاصطناعي غير متاح الآن.",
            error: "تعذر إرسال السؤال الآن. حاول مرة أخرى لاحقاً.",
            backendReady: "AI همّة الذكي جاهز من الواجهة، ويحتاج تفعيل الخادم الخلفي الآمن قبل استقبال الأسئلة.",
            backendError: "تعذر الوصول إلى الخادم الخلفي الآمن حاليًا. حاول مرة أخرى لاحقًا.",
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
            fallbackNotice: "Local fallback was used because AI connection is not available now.",
            error: "Could not send the question now. Try again later.",
            backendReady: "AI Himma is ready in the interface and requires a secure backend before it can receive questions.",
            backendError: "Could not reach the secure backend now. Please try again later.",
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

    function aiEndpoint() {
        const fromWindow = typeof window.HIMMA_AI_ENDPOINT === "string" ? window.HIMMA_AI_ENDPOINT.trim() : "";
        const fromScript = scriptConfig && scriptConfig.dataset ? String(scriptConfig.dataset.aiEndpoint || "").trim() : "";
        const fromMeta = document.querySelector('meta[name="himma-ai-endpoint"]');
        const fromMetaValue = fromMeta ? String(fromMeta.getAttribute("content") || "").trim() : "";
        return fromWindow || fromScript || fromMetaValue;
    }

    function visitorId() {
        const key = "himma_ai_visitor_id";
        let value = window.localStorage.getItem(key);
        if (!value) {
            value = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            window.localStorage.setItem(key, value);
        }
        return value;
    }

    async function authPayload() {
        const client = window.HIMMA_SUPABASE_CLIENT;
        if (!client || !client.auth || !client.auth.getSession) {
            return {};
        }
        try {
            const { data } = await client.auth.getSession();
            return data && data.session && data.session.user
                ? { user_id: data.session.user.id, plan: "member" }
                : {};
        } catch (_) {
            return {};
        }
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

    function includesAny(value, terms) {
        const normalized = normalizeArabic(value);
        return terms.some((term) => normalized.includes(normalizeArabic(term)));
    }

    function forcedLocalAnswer(question) {
        const q = normalizeArabic(question);
        const isEnglish = state.language === "en";
        if (isEnglish) {
            return "";
        }

        const mediaAsked = includesAny(q, ["لجنة الاعلام", "الاعلام", "hook jo", "هوك جو", "شهد سنجق"]);
        const wantsDeputies = includesAny(q, ["نواب الرؤساء", "نواب الرئساء", "كل النواب", "النواب", "نائب", "نائبة"]);
        const wantsChairs = includesAny(q, ["رؤساء اللجان", "رئساء اللجان", "كل الرؤساء", "كل الرئساء", "الرؤساء", "الرئساء"]);
        const wantsChair = includesAny(q, ["رئيس", "ريس", "مين", "من هو", "من هي"]);

        if (mediaAsked) {
            if (wantsDeputies) {
                return "نائب رئيس لجنة الإعلام المتوفر في بيانات الموقع هي شهد سنجق (ممثلة الشركة)، كما يظهر Hook Jo كداعم لمبادرة همّة ضمن لجنة الإعلام.";
            }
            if (wantsChair) {
                return "لا يظهر في بيانات الموقع رئيس للجنة الإعلام حالياً. المتوفر أن شهد سنجق هي نائب رئيس لجنة الإعلام (ممثلة الشركة)، و Hook Jo داعم مبادرة همّة ضمن لجنة الإعلام.";
            }
            return "لجنة الإعلام تدير المحتوى والتغطيات والسرد الإعلامي والهوية الاتصالية للمبادرة، وتهدف إلى تقديم أثر همّة بوضوح ومهنية وبأسلوب قريب من لغة الشباب. المتوفر في بيانات اللجنة: شهد سنجق نائب رئيس لجنة الإعلام (ممثلة الشركة)، و Hook Jo داعم مبادرة همّة ضمن لجنة الإعلام.";
        }

        if (includesAny(q, ["رئيس المبادرة", "ريس المبادرة", "عمر دقروق", "عمر"]) && wantsChair) {
            return "رئيس مبادرة همّة هو عمر دقروق، حسب بيانات مبادرة همّة الوطنية.";
        }

        if (wantsDeputies && !mediaAsked) {
            return [
                "نواب الرؤساء المتوفرون في بيانات الموقع هم:",
                "لجنة الصحة: سلين بكر (نائبة رئيس لجنة الصحة)",
                "لجنة الشؤون القانونية: ايوب احمد عبد السكارنه (نائب رئيس لجنة القانون)",
                "لجنة الإعلام: شهد سنجق (نائب رئيس لجنة الإعلام - ممثلة الشركة)"
            ].join("\n");
        }

        if (wantsChairs && !wantsDeputies) {
            return [
                "الرؤساء المتوفرون في بيانات مبادرة همّة الوطنية هم:",
                "مبادرة همّة الوطنية: عمر دقروق (رئيس مبادرة همّة)",
                "لجنة التكنولوجيا والابتكار: ريّان عبد القادر ابوجاموس (رئيس لجنة التكنولوجيا والابتكار)",
                "لجنة الصحة: مها دكيدك (رئيسة لجنة الصحة)",
                "لجنة الشؤون القانونية: رؤى النشاش (رئيسة لجنة الشؤون القانونية)",
                "لجنة البيئة: جمان الزغل (رئيسة لجنة البيئة)",
                "لجنة الاقتصاد والريادة: أحمد جمال الفاعوري (رئيس لجنة الاقتصاد والريادة)",
                "لجنة الفنون والثقافة: هديل كتكت (رئيسة لجنة الفنون والثقافة)",
                "لجنة الإعلام: لا يظهر في بيانات الموقع رئيس للجنة الإعلام حالياً؛ المتوفر شهد سنجق نائب رئيس لجنة الإعلام و Hook Jo داعم ضمن اللجنة."
            ].join("\n");
        }

        if (includesAny(q, ["لجنة التكنولوجيا", "التكنولوجيا والابتكار", "ريان", "ريّان"]) && wantsChair) {
            return "رئيس لجنة التكنولوجيا والابتكار هو ريّان عبد القادر أبو جاموس، حسب بيانات مبادرة همّة الوطنية.";
        }

        return "";
    }

    function localFallback(question) {
        const ar = state.language !== "en";
        const q = question.toLowerCase();
        if (q.includes("هم") || q.includes("himma") || q.includes("initiative")) {
            return ar
                ? "مبادرة همّة الشبابية منصة وطنية شبابية تهدف إلى تمكين الشباب، تنظيم العمل التطوعي، وبناء مهارات قيادية وتقنية ومجتمعية تخدم الأردن."
                : "Himma Youth Initiative is a national youth platform focused on empowering young people, organizing volunteering, and building leadership, technical, and community skills for Jordan.";
        }
        if (q.includes("تكنولوجيا") || q.includes("technology") || q.includes("ai") || q.includes("ذكاء")) {
            return ar
                ? "لجنة التكنولوجيا والابتكار تركّز على الثقافة الرقمية، الأمن السيبراني، حلول الويب، الذكاء الاصطناعي، واستخدام التقنية لخدمة المبادرات الشبابية."
                : "The Technology and Innovation Committee focuses on digital literacy, cybersecurity, web solutions, AI, and using technology to support youth initiatives.";
        }
        if (q.includes("اردن") || q.includes("الأردن") || q.includes("jordan")) {
            return ar
                ? "الأردن يقوم على الانتماء، الخدمة العامة، احترام القانون، والتنوع الاجتماعي. المشاركة الشبابية الواعية تجعل هذه القيم عملاً يومياً لا مجرد شعارات."
                : "Jordanian civic identity is built on belonging, public service, rule of law, and social diversity. Conscious youth participation turns these values into daily practice.";
        }
        return ar
            ? "أقدر أساعدك بأسئلة عن مبادرة همّة، اللجان، التطوع، الثقافة الوطنية، والمعلومات العامة عن الأردن. اكتب سؤالك بشكل محدد حتى أعطيك إجابة أوضح."
            : "I can help with questions about Himma, committees, volunteering, national culture, and general information about Jordan. Ask a specific question for a clearer answer.";
    }

    function backendDisabledMessage() {
        return currentCopy().backendReady;
    }

    async function requestAiAnswer(question) {
        const endpoint = aiEndpoint();
        if (!endpoint) {
            return { disabled: true, answer: backendDisabledMessage() };
        }

        const payload = {
            question,
            language: state.language,
            dialect: state.elements.select.value || "jordanian",
            visitor_id: visitorId(),
            ...(await authPayload())
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`AI endpoint responded with ${response.status}`);
        }

        const data = await response.json().catch(() => ({}));
        const answer = data.answer || data.reply || data.message;
        if (!answer || typeof answer !== "string") {
            throw new Error("AI endpoint response did not include an answer.");
        }
        return { answer };
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
            if (result.disabled) {
                setStatus("");
            }
        } catch (error) {
            pending.textContent = text.backendError || text.error;
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
