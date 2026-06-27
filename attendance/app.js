(() => {
    const config = window.HIMMA_SUPABASE_CONFIG;
    const token = new URLSearchParams(window.location.search).get("token") || "";
    const adminSession = { membershipId: "", password: "" };

    const elements = {
        tabs: Array.from(document.querySelectorAll("[data-mode]")),
        checkinPanel: document.getElementById("checkin-panel"),
        adminPanel: document.getElementById("admin-panel"),
        eventSummary: document.getElementById("event-summary"),
        checkinForm: document.getElementById("checkin-form"),
        checkinMembership: document.getElementById("checkin-membership"),
        checkinPassword: document.getElementById("checkin-password"),
        checkinMessage: document.getElementById("checkin-message"),
        adminLoginForm: document.getElementById("admin-login-form"),
        adminMembership: document.getElementById("admin-membership"),
        adminPassword: document.getElementById("admin-password"),
        adminLoginMessage: document.getElementById("admin-login-message"),
        adminWorkspace: document.getElementById("admin-workspace"),
        adminName: document.getElementById("admin-name"),
        adminRefresh: document.getElementById("admin-refresh"),
        eventForm: document.getElementById("event-form"),
        eventMeeting: document.getElementById("event-meeting"),
        eventOpens: document.getElementById("event-opens"),
        eventLate: document.getElementById("event-late"),
        eventCloses: document.getElementById("event-closes"),
        eventMessage: document.getElementById("event-message"),
        qrResult: document.getElementById("qr-result"),
        qrCode: document.getElementById("qr-code"),
        attendanceUrl: document.getElementById("attendance-url"),
        copyUrl: document.getElementById("copy-url"),
        eventList: document.getElementById("event-list")
    };

    function setMessage(element, message, isError = false) {
        element.textContent = message || "";
        element.classList.toggle("error", Boolean(isError));
    }

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleString("ar-JO", { dateStyle: "medium", timeStyle: "short" });
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function readMemberSession() {
        try {
            return JSON.parse(sessionStorage.getItem("himma_member_session_v1") || "null");
        } catch (_) {
            return null;
        }
    }

    async function rpc(name, body) {
        if (!config || !config.url || !config.anonKey) {
            throw new Error("missing_config");
        }
        const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": config.anonKey,
                "Authorization": `Bearer ${config.anonKey}`
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error("rpc_failed");
        }
        return response.json();
    }

    function setMode(mode) {
        elements.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
        elements.checkinPanel.hidden = mode !== "checkin";
        elements.adminPanel.hidden = mode !== "admin";
    }

    async function loadEvent() {
        if (!token) return;
        elements.eventSummary.textContent = "جاري تحميل بيانات الفعالية...";
        try {
            const event = await rpc("attendance_get_event", { input_token: token });
            if (!event || event.success === false) {
                elements.eventSummary.textContent = "رمز الحضور غير صالح.";
                return;
            }
            elements.eventSummary.innerHTML = `
                <strong>${escapeHtml(event.title)}</strong><br>
                التاريخ: ${escapeHtml(event.meeting_date)} - الوقت: ${escapeHtml(event.meeting_time)}<br>
                ${event.is_open ? "سجّل دخولك الآن لتثبيت حضورك باسمك." : "التسجيل مغلق حاليًا."}
            `;
            elements.checkinForm.hidden = !event.is_open;
            const memberSession = readMemberSession();
            const savedMembership = memberSession && (memberSession.membership_number || memberSession.membership_id);
            if (savedMembership && !elements.checkinMembership.value) {
                elements.checkinMembership.value = savedMembership;
            }
        } catch {
            elements.eventSummary.textContent = "تعذر تحميل بيانات الفعالية حاليًا.";
        }
    }

    async function loadAdminPortal() {
        const data = await rpc("attendance_admin_portal", {
            input_membership_id: adminSession.membershipId,
            input_password: adminSession.password
        });
        if (!data || data.success === false) {
            throw new Error("not_allowed");
        }

        elements.adminName.textContent = data.admin_name || "-";
        elements.eventMeeting.innerHTML = "";
        (data.meetings || []).forEach((meeting) => {
            const option = document.createElement("option");
            option.value = meeting.id;
            option.textContent = `${meeting.title} - ${meeting.meeting_date}`;
            elements.eventMeeting.appendChild(option);
        });
        renderEvents(data.events || []);
        return data;
    }

    function renderEvents(events) {
        elements.eventList.innerHTML = "";
        if (!events.length) {
            elements.eventList.innerHTML = '<p class="form-message">لا توجد رموز حضور منشأة بعد.</p>';
            return;
        }
        events.forEach((event) => {
            const card = document.createElement("article");
            card.className = "event-card";
            const attendees = Array.isArray(event.attendees) ? event.attendees : [];
            card.innerHTML = `
                <h3>${escapeHtml(event.title)}</h3>
                <p class="event-meta">
                    فتح التسجيل: ${escapeHtml(formatDate(event.opens_at))}<br>
                    إغلاق التسجيل: ${escapeHtml(formatDate(event.closes_at))}<br>
                    عدد الحضور: ${Number(event.attendance_count || 0)}
                </p>
                <ul class="attendee-list">
                    ${attendees.map((attendee) => `
                        <li>
                            <span>${escapeHtml(attendee.name)} (${escapeHtml(attendee.membership_id)})</span>
                            <span>${attendee.status === "late" ? "متأخر" : "حاضر"} - ${escapeHtml(formatDate(attendee.checked_in_at))}</span>
                        </li>
                    `).join("")}
                </ul>
            `;
            elements.eventList.appendChild(card);
        });
    }

    function setDefaultTimes() {
        const now = new Date();
        const late = new Date(now.getTime() + 15 * 60 * 1000);
        const close = new Date(now.getTime() + 60 * 60 * 1000);
        const localValue = (date) => {
            const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return shifted.toISOString().slice(0, 16);
        };
        elements.eventOpens.value = localValue(now);
        elements.eventLate.value = localValue(late);
        elements.eventCloses.value = localValue(close);
    }

    elements.tabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    elements.checkinForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setMessage(elements.checkinMessage, "جاري تسجيل الحضور...");
        try {
            const result = await rpc("attendance_check_in", {
                input_token: token,
                input_membership_id: elements.checkinMembership.value.trim(),
                input_password: elements.checkinPassword.value
            });
            elements.checkinPassword.value = "";
            if (!result || result.success === false) {
                const closed = result && result.message === "event_closed";
                setMessage(
                    elements.checkinMessage,
                    closed ? "انتهت فترة تسجيل الحضور." : "بيانات العضوية غير صحيحة أو تعذر تسجيل الحضور.",
                    true
                );
                return;
            }
            const message = result.already_registered
                ? `حضور ${result.member_name || "العضو"} مسجل مسبقًا.`
                : result.attendance_status === "late"
                    ? `تم تسجيل حضور ${result.member_name || "العضو"} كمتأخر.`
                    : `تم تسجيل حضور ${result.member_name || "العضو"} بنجاح.`;
            elements.checkinForm.hidden = true;
            setMessage(elements.checkinMessage, message);
        } catch {
            elements.checkinPassword.value = "";
            setMessage(elements.checkinMessage, "خدمة الحضور غير متاحة حاليًا، يرجى المحاولة لاحقًا.", true);
        }
    });

    elements.adminLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        adminSession.membershipId = elements.adminMembership.value.trim();
        adminSession.password = elements.adminPassword.value;
        setMessage(elements.adminLoginMessage, "جاري التحقق...");
        try {
            await loadAdminPortal();
            elements.adminPassword.value = "";
            elements.adminLoginForm.hidden = true;
            elements.adminWorkspace.hidden = false;
            setMessage(elements.adminLoginMessage, "");
            setDefaultTimes();
        } catch {
            adminSession.password = "";
            elements.adminPassword.value = "";
            setMessage(elements.adminLoginMessage, "لا تملك صلاحية إدارة الاجتماعات أو بيانات الدخول غير صحيحة.", true);
        }
    });

    elements.adminRefresh.addEventListener("click", async () => {
        try {
            await loadAdminPortal();
        } catch {
            setMessage(elements.eventMessage, "تعذر تحديث السجل.", true);
        }
    });

    elements.eventForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setMessage(elements.eventMessage, "جاري إنشاء الرمز...");
        try {
            const result = await rpc("attendance_create_event", {
                input_membership_id: adminSession.membershipId,
                input_password: adminSession.password,
                input_meeting_id: elements.eventMeeting.value,
                input_opens_at: new Date(elements.eventOpens.value).toISOString(),
                input_late_after: new Date(elements.eventLate.value).toISOString(),
                input_closes_at: new Date(elements.eventCloses.value).toISOString()
            });
            if (!result || result.success === false || !result.token) {
                throw new Error("create_failed");
            }

            const url = new URL("./", window.location.href);
            url.search = "";
            url.searchParams.set("token", result.token);
            elements.attendanceUrl.value = url.toString();
            elements.qrCode.textContent = "";
            new QRCode(elements.qrCode, {
                text: url.toString(),
                width: 240,
                height: 240,
                colorDark: "#063c2b",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            elements.qrResult.hidden = false;
            setMessage(elements.eventMessage, "تم إنشاء رمز الحضور. اعرضه للأعضاء أثناء الفعالية.");
            await loadAdminPortal();
        } catch {
            setMessage(elements.eventMessage, "تعذر إنشاء رمز الحضور. تحقق من الأوقات والصلاحية.", true);
        }
    });

    elements.copyUrl.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(elements.attendanceUrl.value);
            elements.copyUrl.textContent = "تم النسخ";
        } catch {
            elements.attendanceUrl.select();
        }
    });

    if (token) {
        setMode("checkin");
        loadEvent();
    } else {
        setMode("admin");
    }
})();
