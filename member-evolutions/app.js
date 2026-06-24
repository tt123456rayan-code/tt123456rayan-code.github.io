(() => {
    const state = {
        membershipNumber: "",
        password: "",
        viewer: null,
        members: [],
        selectedMember: null
    };

    const els = {
        loginView: document.getElementById("login-view"),
        dashboardView: document.getElementById("dashboard-view"),
        loginForm: document.getElementById("login-form"),
        loginMessage: document.getElementById("login-message"),
        membershipNumber: document.getElementById("membership-number"),
        password: document.getElementById("password"),
        logoutButton: document.getElementById("logout-button"),
        viewerRole: document.getElementById("viewer-role"),
        viewerName: document.getElementById("viewer-name"),
        viewerMembership: document.getElementById("viewer-membership"),
        memberView: document.getElementById("member-view"),
        adminView: document.getElementById("admin-view"),
        memberRating: document.getElementById("member-rating"),
        memberWarning: document.getElementById("member-warning"),
        memberStatus: document.getElementById("member-status"),
        memberNotes: document.getElementById("member-notes"),
        memberUpdated: document.getElementById("member-updated"),
        createMemberForm: document.getElementById("create-member-form"),
        newMemberName: document.getElementById("new-member-name"),
        newMemberNumber: document.getElementById("new-member-number"),
        newMemberPassword: document.getElementById("new-member-password"),
        createMessage: document.getElementById("create-message"),
        createdCredentials: document.getElementById("created-credentials"),
        memberSearch: document.getElementById("member-search"),
        memberList: document.getElementById("member-list"),
        evaluationForm: document.getElementById("evaluation-form"),
        evaluationTitle: document.getElementById("evaluation-title"),
        targetMemberId: document.getElementById("target-member-id"),
        ratingSelect: document.getElementById("rating-select"),
        warningSelect: document.getElementById("warning-select"),
        statusSelect: document.getElementById("status-select"),
        notesInput: document.getElementById("notes-input"),
        evaluationMessage: document.getElementById("evaluation-message"),
        permissionBox: document.getElementById("permission-box"),
        permissionSelect: document.getElementById("permission-select"),
        permissionButton: document.getElementById("permission-button"),
        deleteButton: document.getElementById("delete-button")
    };

    function config() {
        const cfg = window.HIMMA_SUPABASE_CONFIG;
        if (!cfg || !cfg.url || !cfg.anonKey) {
            throw new Error("missing_config");
        }
        return {
            url: cfg.url.replace(/\/$/, ""),
            anonKey: cfg.anonKey
        };
    }

    async function rpc(functionName, body) {
        const cfg = config();
        const response = await fetch(`${cfg.url}/rest/v1/rpc/${functionName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": cfg.anonKey,
                "Authorization": `Bearer ${cfg.anonKey}`
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error("rpc_failed");
        }
        return response.json();
    }

    function setMessage(element, text, isError = false) {
        element.textContent = text || "";
        element.classList.toggle("error", Boolean(isError));
    }

    function warningText(level) {
        if (Number(level) === 1) return "إنذار أول";
        if (Number(level) === 2) return "إنذار ثاني";
        if (Number(level) === 3) return "إنذار ثالث";
        return "لا يوجد إنذار";
    }

    function roleLabel(role) {
        if (role === "super_admin") return "مدير النظام";
        if (role === "discipline_admin") return "إدارة الانضباط وإضافة/حذف الأعضاء";
        if (role === "evaluator") return "مشرف تقييمات";
        return "عضو";
    }

    function isProtectedRayan(member) {
        const fullName = String(member && member.full_name || "").replace(/\s+/g, " ").trim();
        return /ريان/.test(fullName) && /عبد/.test(fullName) && /القادر/.test(fullName);
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString("ar-JO", { dateStyle: "medium", timeStyle: "short" });
    }

    function renderShell(data) {
        state.viewer = data.viewer;
        els.loginView.hidden = true;
        els.dashboardView.hidden = false;
        els.viewerName.textContent = data.viewer.full_name || "-";
        els.viewerMembership.textContent = data.viewer.membership_number || "-";

        const role = data.viewer.admin_role;
        els.viewerRole.textContent = roleLabel(role);

        if (role === "super_admin" || role === "discipline_admin" || role === "evaluator") {
            state.members = Array.isArray(data.members) ? data.members : [];
            els.memberView.hidden = true;
            els.adminView.hidden = false;
            els.createMemberForm.hidden = !canManageMembers();
            renderMemberList();
            return;
        }

        els.adminView.hidden = true;
        els.memberView.hidden = false;
        renderMemberEvaluation(data.evaluation || {});
    }

    function renderMemberEvaluation(evaluation) {
        els.memberRating.textContent = evaluation.rating || "جيد";
        els.memberWarning.textContent = warningText(evaluation.warning_level);
        els.memberStatus.textContent = evaluation.status || "مستقيم";
        els.memberNotes.textContent = evaluation.notes || "لا توجد ملاحظات حالياً.";
        els.memberUpdated.textContent = evaluation.updated_at ? `آخر تحديث: ${formatDate(evaluation.updated_at)}` : "";
    }

    function renderMemberList() {
        const term = els.memberSearch.value.trim().toLowerCase();
        const members = state.members.filter((member) => {
            const haystack = `${member.full_name || ""} ${member.membership_number || ""}`.toLowerCase();
            return haystack.includes(term);
        });
        els.memberList.innerHTML = "";
        if (!members.length) {
            els.memberList.innerHTML = `<p class="form-message">لا توجد نتائج.</p>`;
            return;
        }
        members.forEach((member) => {
            const row = document.createElement("article");
            row.className = "member-row";
            const warningLevel = Number(member.warning_level || 0);
            row.innerHTML = `
                <div>
                    <strong>${escapeHtml(member.full_name || "-")}</strong>
                    <small>${escapeHtml(member.membership_number || "-")}</small>
                    <div class="badges">
                        <span class="badge">${escapeHtml(member.rating || "جيد")}</span>
                        <span class="badge ${warningLevel >= 3 ? "danger" : ""}">${warningText(warningLevel)}</span>
                        <span class="badge ${member.status === "مطرود" ? "danger" : ""}">${escapeHtml(member.status || "مستقيم")}</span>
                        <span class="badge">${escapeHtml(roleLabel(member.admin_role))}</span>
                    </div>
                </div>
            `;
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "تعديل";
            button.addEventListener("click", () => selectMember(member));
            row.appendChild(button);
            els.memberList.appendChild(row);
        });
    }

    function selectMember(member) {
        state.selectedMember = member;
        els.evaluationForm.hidden = false;
        els.evaluationTitle.textContent = `تعديل تقييم: ${member.full_name}`;
        els.targetMemberId.value = member.id;
        els.ratingSelect.value = member.rating || "جيد";
        els.warningSelect.value = String(member.warning_level || 0);
        els.statusSelect.value = member.status || "مستقيم";
        els.notesInput.value = member.notes || "";
        els.permissionBox.hidden = !canGrantPermissions();
        els.permissionSelect.value = member.admin_role || "none";
        els.deleteButton.hidden = !canManageMembers() || isProtectedRayan(member);
        setMessage(els.evaluationMessage, "");
        els.evaluationForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function canManageMembers() {
        return state.viewer && (state.viewer.admin_role === "super_admin" || state.viewer.admin_role === "discipline_admin");
    }

    function canGrantPermissions() {
        return state.viewer && state.viewer.admin_role === "super_admin";
    }

    async function refreshPortal(preservedRole = null, preservedMemberId = "") {
        const data = await rpc("member_evolution_get_portal", {
            input_membership_number: state.membershipNumber,
            input_password: state.password
        });
        if (!data || data.success === false) {
            throw new Error("invalid_login");
        }
        if (preservedRole && Array.isArray(data.members)) {
            const member = data.members.find((item) => item.id === preservedMemberId);
            if (member && !member.admin_role) {
                member.admin_role = preservedRole === "none" ? null : preservedRole;
            }
        }
        renderShell(data);
    }

    els.loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        state.membershipNumber = els.membershipNumber.value.trim();
        state.password = els.password.value;
        setMessage(els.loginMessage, "جاري تسجيل الدخول...");
        try {
            await refreshPortal();
            els.password.value = "";
            setMessage(els.loginMessage, "");
        } catch {
            state.password = "";
            els.password.value = "";
            setMessage(els.loginMessage, "بيانات الدخول غير صحيحة أو الخدمة غير مفعلة بعد.", true);
        }
    });

    els.logoutButton.addEventListener("click", () => {
        state.membershipNumber = "";
        state.password = "";
        state.viewer = null;
        state.members = [];
        state.selectedMember = null;
        els.dashboardView.hidden = true;
        els.loginView.hidden = false;
        els.loginForm.reset();
    });

    els.memberSearch.addEventListener("input", renderMemberList);

    els.warningSelect.addEventListener("change", () => {
        if (Number(els.warningSelect.value) >= 3 && els.statusSelect.value !== "مطرود") {
            els.statusSelect.value = "تحت المتابعة";
        }
        if (state.selectedMember) {
            els.deleteButton.hidden = !canManageMembers() || isProtectedRayan(state.selectedMember);
        }
    });

    els.createMemberForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setMessage(els.createMessage, "جاري إضافة العضو...");
        els.createdCredentials.hidden = true;
        try {
            const result = await rpc("member_evolution_create_member", {
                admin_membership_number: state.membershipNumber,
                admin_password: state.password,
                new_full_name: els.newMemberName.value.trim(),
                requested_membership_number: els.newMemberNumber.value.trim() || null,
                temporary_password: els.newMemberPassword.value.trim() || null
            });
            if (!result || result.success === false) {
                throw new Error(result && result.message ? result.message : "create_failed");
            }
            const member = result.member;
            els.createdCredentials.innerHTML = `
                <div>تم إنشاء العضو.</div>
                <div>رقم العضوية: <strong>${escapeHtml(member.membership_number)}</strong></div>
                <div>الباسورد المؤقت: <strong>${escapeHtml(member.temporary_password)}</strong></div>
            `;
            els.createdCredentials.hidden = false;
            els.createMemberForm.reset();
            setMessage(els.createMessage, "تمت الإضافة. أرسل البيانات للعضو فقط.");
            await refreshPortal();
        } catch {
            setMessage(els.createMessage, "تعذر إضافة العضو. تأكد من الصلاحية أو رقم العضوية.", true);
        }
    });

    els.evaluationForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setMessage(els.evaluationMessage, "جاري حفظ التقييم...");
        try {
            const result = await rpc("member_evolution_save_evaluation", {
                admin_membership_number: state.membershipNumber,
                admin_password: state.password,
                target_member_id: els.targetMemberId.value,
                new_rating: els.ratingSelect.value,
                new_warning_level: Number(els.warningSelect.value),
                new_status: els.statusSelect.value,
                new_notes: els.notesInput.value.trim()
            });
            if (!result || result.success === false) {
                throw new Error("save_failed");
            }
            setMessage(els.evaluationMessage, "تم حفظ التقييم.");
            await refreshPortal();
            const updated = state.members.find((member) => member.id === els.targetMemberId.value);
            if (updated) selectMember(updated);
        } catch {
            setMessage(els.evaluationMessage, "تعذر حفظ التقييم.", true);
        }
    });

    els.permissionButton.addEventListener("click", async () => {
        if (!state.selectedMember || !canGrantPermissions()) return;
        const targetMemberId = state.selectedMember.id;
        const requestedRole = els.permissionSelect.value;
        setMessage(els.evaluationMessage, "جاري تحديث الصلاحية...");
        try {
            const result = await rpc("member_evolution_set_admin_role", {
                admin_membership_number: state.membershipNumber,
                admin_password: state.password,
                target_member_id: targetMemberId,
                new_admin_role: requestedRole
            });
            if (!result || result.success === false) {
                throw new Error("permission_failed");
            }
            const savedRole = result.role || requestedRole;
            await refreshPortal(savedRole, targetMemberId);
            const updated = state.members.find((member) => member.id === targetMemberId);
            if (!updated) {
                throw new Error("member_refresh_failed");
            }
            selectMember(updated);
            setMessage(els.evaluationMessage, "تم تحديث الصلاحية.");
        } catch {
            setMessage(els.evaluationMessage, "تعذر تحديث الصلاحية.", true);
        }
    });

    els.deleteButton.addEventListener("click", async () => {
        if (!state.selectedMember) return;
        if (isProtectedRayan(state.selectedMember)) {
            setMessage(els.evaluationMessage, "لا يمكن حذف ريان من النظام.", true);
            return;
        }
        if (!confirm("تأكيد حذف العضو من نظام التقييم؟")) return;
        setMessage(els.evaluationMessage, "جاري حذف العضو...");
        try {
            const result = await rpc("member_evolution_delete_member", {
                admin_membership_number: state.membershipNumber,
                admin_password: state.password,
                target_member_id: state.selectedMember.id
            });
            if (!result || result.success === false) {
                throw new Error("delete_failed");
            }
            setMessage(els.evaluationMessage, "تم حذف العضو.");
            els.evaluationForm.hidden = true;
            await refreshPortal();
        } catch {
            setMessage(els.evaluationMessage, "تعذر حذف العضو.", true);
        }
    });
})();
