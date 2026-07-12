(() => {
    const serviceViews = new Set(["certificates", "committee-tasks", "requests"]);
    const certificatesStatus = document.getElementById("certificates-status");
    const certificatesList = document.getElementById("certificates-list");
    const issuedSection = document.getElementById("issued-certificates-section");
    const issuedList = document.getElementById("issued-certificates-list");
    const certificateForm = document.getElementById("certificate-issue-form");
    const certificateMessage = document.getElementById("certificate-message");
    const certificateDate = document.getElementById("certificate-date");
    const tasksStatus = document.getElementById("committee-tasks-status");
    const tasksList = document.getElementById("committee-tasks-list");
    const taskForm = document.getElementById("committee-task-form");
    const taskMessage = document.getElementById("committee-task-message");
    const taskCommittee = document.getElementById("task-committee");
    const taskAssignee = document.getElementById("task-assignee");
    const taskDueDate = document.getElementById("task-due-date");
    const requestsStatus = document.getElementById("requests-status");
    const requestsList = document.getElementById("member-requests-list");
    const requestForm = document.getElementById("member-request-form");
    const requestMessage = document.getElementById("member-request-message");

    if (!certificatesList || !tasksList || !requestsList) return;

    let portalData = null;
    let loading = false;

    const isEnglish = () => document.documentElement.lang === "en";
    const text = (ar, en) => isEnglish() ? en : ar;
    const api = () => window.HIMMA_MEMBER_API;
    const formatDate = (value) => {
        if (!value) return "-";
        const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
        return Number.isNaN(parsed.getTime()) ? String(value) : new Intl.DateTimeFormat(isEnglish() ? "en-GB" : "ar-JO", {
            year: "numeric", month: "long", day: "numeric"
        }).format(parsed);
    };

    const statusLabels = {
        new: ["جديدة", "New"],
        in_progress: ["قيد التنفيذ", "In progress"],
        completed: ["مكتملة", "Completed"],
        pending: ["قيد الانتظار", "Pending"],
        in_review: ["قيد المراجعة", "In review"],
        approved: ["مقبول", "Approved"],
        rejected: ["مرفوض", "Rejected"]
    };
    const requestTypeLabels = {
        committee_transfer: ["نقل لجنة", "Committee transfer"],
        data_update: ["تعديل بيانات", "Data update"],
        leave: ["طلب إجازة", "Leave request"],
        activity_proposal: ["اقتراح نشاط", "Activity proposal"],
        complaint: ["شكوى", "Complaint"],
        other: ["أخرى", "Other"]
    };

    function setStatuses(message) {
        [certificatesStatus, tasksStatus, requestsStatus].forEach((element) => {
            if (element) element.textContent = message;
        });
    }

    function emptyState(container, ar, en) {
        container.textContent = "";
        const paragraph = document.createElement("p");
        paragraph.className = "form-message service-empty";
        paragraph.textContent = text(ar, en);
        container.appendChild(paragraph);
    }

    function addField(parent, label, value) {
        if (value === null || value === undefined || value === "") return;
        const row = document.createElement("p");
        row.className = "service-field";
        const strong = document.createElement("strong");
        strong.textContent = label;
        row.append(strong, document.createTextNode(` ${value}`));
        parent.appendChild(row);
    }

    function createBadge(status) {
        const badge = document.createElement("span");
        badge.className = `service-status status-${status}`;
        const label = statusLabels[status] || [status, status];
        badge.textContent = text(label[0], label[1]);
        return badge;
    }

    function renderCertificates() {
        const certificates = Array.isArray(portalData?.certificates) ? portalData.certificates : [];
        certificatesList.textContent = "";
        if (!certificates.length) {
            emptyState(certificatesList, "لا توجد شهادات صادرة لك حاليًا.", "No certificates have been issued to you yet.");
        } else {
            certificates.forEach((certificate) => {
                const card = document.createElement("article");
                card.className = "service-card certificate-card";
                const heading = document.createElement("h4");
                heading.textContent = certificate.title || "-";
                card.appendChild(heading);
                addField(card, text("النشاط:", "Activity:"), certificate.activity_name);
                addField(card, text("ساعات التطوع:", "Volunteer hours:"), certificate.volunteer_hours);
                addField(card, text("تاريخ الإصدار:", "Issue date:"), formatDate(certificate.issued_on));
                addField(card, text("رمز الشهادة:", "Certificate code:"), certificate.certificate_code);
                if (certificate.description) {
                    const description = document.createElement("p");
                    description.textContent = certificate.description;
                    card.appendChild(description);
                }
                const link = document.createElement("a");
                link.className = "btn service-action";
                link.href = `./certificate/?code=${encodeURIComponent(certificate.certificate_code || "")}`;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = text("عرض وتحميل الشهادة", "View and download certificate");
                card.appendChild(link);
                certificatesList.appendChild(card);
            });
        }

        const canIssue = Boolean(portalData?.permissions?.can_issue_certificates);
        certificateForm.hidden = !canIssue;
        issuedSection.hidden = !canIssue;
        issuedList.textContent = "";
        if (!canIssue) return;
        const issued = Array.isArray(portalData.issued_certificates) ? portalData.issued_certificates : [];
        if (!issued.length) {
            emptyState(issuedList, "لا توجد شهادات صادرة من الإدارة.", "No certificates have been issued by the administration.");
            return;
        }
        issued.forEach((certificate) => {
            const card = document.createElement("article");
            card.className = "service-card compact-service-card";
            const heading = document.createElement("h4");
            heading.textContent = certificate.member_name || certificate.membership_number || "-";
            card.appendChild(heading);
            addField(card, text("رقم العضوية:", "Membership:"), certificate.membership_number);
            addField(card, text("الشهادة:", "Certificate:"), certificate.title);
            addField(card, text("التاريخ:", "Date:"), formatDate(certificate.issued_on));
            card.appendChild(createBadge(certificate.is_active ? "approved" : "rejected"));
            if (certificate.is_active) {
                const revoke = document.createElement("button");
                revoke.className = "btn btn-secondary service-action";
                revoke.type = "button";
                revoke.dataset.revokeCertificate = certificate.id;
                revoke.textContent = text("إلغاء الشهادة", "Revoke certificate");
                card.appendChild(revoke);
            }
            issuedList.appendChild(card);
        });
    }

    function populateTaskControls() {
        if (!taskCommittee || !taskAssignee) return;
        const committees = Array.isArray(portalData?.committees) ? [...portalData.committees] : [];
        const memberCommittee = portalData?.member?.committee || "";
        if (memberCommittee && !committees.some((item) => item.value === memberCommittee)) {
            committees.push({ value: memberCommittee, label: memberCommittee });
        }
        const previousCommittee = taskCommittee.value;
        taskCommittee.textContent = "";
        committees.forEach((committee) => {
            const option = document.createElement("option");
            option.value = committee.value || "";
            option.textContent = committee.label || committee.value || "";
            taskCommittee.appendChild(option);
        });
        if (previousCommittee && committees.some((item) => item.value === previousCommittee)) {
            taskCommittee.value = previousCommittee;
        }
        populateAssignees();
    }

    function populateAssignees() {
        if (!taskAssignee || !taskCommittee) return;
        const selectedCommittee = taskCommittee.value;
        const members = Array.isArray(portalData?.task_members) ? portalData.task_members : [];
        const previous = taskAssignee.value;
        taskAssignee.textContent = "";
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = text("بدون تعيين", "Unassigned");
        taskAssignee.appendChild(empty);
        members.filter((member) => !selectedCommittee || member.committee === selectedCommittee).forEach((member) => {
            const option = document.createElement("option");
            option.value = member.membership_number || "";
            option.textContent = `${member.full_name || member.membership_number} (${member.membership_number || "-"})`;
            taskAssignee.appendChild(option);
        });
        if (previous && Array.from(taskAssignee.options).some((option) => option.value === previous)) {
            taskAssignee.value = previous;
        }
    }

    function canUpdateTask(task) {
        const member = portalData?.member || {};
        const permissions = portalData?.permissions || {};
        return Boolean(
            permissions.can_manage_tasks ||
            task.assigned_membership_number === member.membership_number ||
            task.created_by_membership === member.membership_number ||
            ((member.role || "").includes("رئيس") && (member.role || "").includes("لجنة") && task.committee === member.committee)
        );
    }

    function renderTasks() {
        const canCreate = Boolean(portalData?.permissions?.can_create_tasks);
        taskForm.hidden = !canCreate;
        if (canCreate) populateTaskControls();
        tasksList.textContent = "";
        const tasks = Array.isArray(portalData?.tasks) ? portalData.tasks : [];
        if (!tasks.length) {
            emptyState(tasksList, "لا توجد مهام لجان مرتبطة بحسابك.", "No committee tasks are linked to your account.");
            return;
        }
        tasks.forEach((task) => {
            const card = document.createElement("article");
            card.className = "service-card task-card";
            const top = document.createElement("div");
            top.className = "service-card-top";
            const heading = document.createElement("h4");
            heading.textContent = task.title || "-";
            top.append(heading, createBadge(task.status || "new"));
            card.appendChild(top);
            addField(card, text("اللجنة:", "Committee:"), task.committee);
            addField(card, text("المسؤول:", "Assignee:"), task.assigned_member_name || text("غير معيّن", "Unassigned"));
            addField(card, text("موعد الإنجاز:", "Due date:"), formatDate(task.due_date));
            const description = document.createElement("p");
            description.textContent = task.description || "";
            card.appendChild(description);
            if (canUpdateTask(task)) {
                const actions = document.createElement("div");
                actions.className = "service-inline-actions";
                const select = document.createElement("select");
                select.setAttribute("aria-label", text("حالة المهمة", "Task status"));
                [["new", "جديدة", "New"], ["in_progress", "قيد التنفيذ", "In progress"], ["completed", "مكتملة", "Completed"]].forEach(([value, ar, en]) => {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = text(ar, en);
                    option.selected = task.status === value;
                    select.appendChild(option);
                });
                const update = document.createElement("button");
                update.className = "btn service-action";
                update.type = "button";
                update.dataset.updateTask = task.id;
                update.textContent = text("تحديث الحالة", "Update status");
                actions.append(select, update);
                card.appendChild(actions);
            }
            tasksList.appendChild(card);
        });
    }

    function renderRequests() {
        requestForm.hidden = false;
        requestsList.textContent = "";
        const requests = Array.isArray(portalData?.requests) ? portalData.requests : [];
        const canManage = Boolean(portalData?.permissions?.can_manage_requests);
        if (!requests.length) {
            emptyState(requestsList, "لا توجد طلبات مسجلة حاليًا.", "No requests are currently registered.");
            return;
        }
        requests.forEach((request) => {
            const card = document.createElement("article");
            card.className = "service-card request-card";
            const top = document.createElement("div");
            top.className = "service-card-top";
            const heading = document.createElement("h4");
            heading.textContent = request.subject || "-";
            top.append(heading, createBadge(request.status || "pending"));
            card.appendChild(top);
            if (canManage) {
                addField(card, text("العضو:", "Member:"), `${request.member_name || "-"} (${request.membership_number || "-"})`);
            }
            const typeLabel = requestTypeLabels[request.request_type] || [request.request_type, request.request_type];
            addField(card, text("النوع:", "Type:"), text(typeLabel[0], typeLabel[1]));
            addField(card, text("التاريخ:", "Date:"), formatDate(request.created_at));
            const details = document.createElement("p");
            details.textContent = request.details || "";
            card.appendChild(details);
            if (request.admin_response) {
                const response = document.createElement("p");
                response.className = "service-response";
                response.textContent = `${text("رد الإدارة:", "Administration response:")} ${request.admin_response}`;
                card.appendChild(response);
            }
            if (canManage) {
                const controls = document.createElement("div");
                controls.className = "request-admin-controls";
                const select = document.createElement("select");
                select.setAttribute("aria-label", text("حالة الطلب", "Request status"));
                [["pending", "قيد الانتظار", "Pending"], ["in_review", "قيد المراجعة", "In review"], ["approved", "مقبول", "Approved"], ["rejected", "مرفوض", "Rejected"], ["completed", "مكتمل", "Completed"]].forEach(([value, ar, en]) => {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = text(ar, en);
                    option.selected = request.status === value;
                    select.appendChild(option);
                });
                const textarea = document.createElement("textarea");
                textarea.maxLength = 2000;
                textarea.placeholder = text("رد الإدارة", "Administration response");
                textarea.value = request.admin_response || "";
                const update = document.createElement("button");
                update.className = "btn service-action";
                update.type = "button";
                update.dataset.respondRequest = request.id;
                update.textContent = text("حفظ الرد", "Save response");
                controls.append(select, textarea, update);
                card.appendChild(controls);
            }
            requestsList.appendChild(card);
        });
    }

    function renderPortal() {
        renderCertificates();
        renderTasks();
        renderRequests();
        setStatuses("");
    }

    async function loadPortal(force = false) {
        if (loading) return;
        if (!api()?.isAuthenticated()) {
            setStatuses(text("أعد تسجيل الدخول لاستخدام هذه الخدمة.", "Please sign in again to use this service."));
            certificateForm.hidden = true;
            taskForm.hidden = true;
            requestForm.hidden = true;
            return;
        }
        if (portalData && !force) {
            renderPortal();
            return;
        }
        loading = true;
        setStatuses(text("جاري تحميل الخدمات...", "Loading services..."));
        try {
            const data = await api().call("member_services_portal");
            if (!data || data.success === false) throw new Error("portal_failed");
            portalData = data;
            renderPortal();
        } catch (_) {
            setStatuses(text("تعذر تحميل الخدمات حاليًا، يرجى المحاولة لاحقًا.", "Services are temporarily unavailable. Please try again later."));
        } finally {
            loading = false;
        }
    }

    document.addEventListener("click", (event) => {
        const viewButton = event.target.closest("[data-dashboard-view]");
        if (viewButton && serviceViews.has(viewButton.dataset.dashboardView)) {
            loadPortal();
        }
    });

    document.addEventListener("himma:member-session", (event) => {
        portalData = null;
        if (event.detail?.authenticated) {
            loadPortal(true);
        } else {
            setStatuses("");
            certificateForm.hidden = true;
            taskForm.hidden = true;
            requestForm.hidden = true;
            certificatesList.textContent = "";
            tasksList.textContent = "";
            requestsList.textContent = "";
        }
    });

    taskCommittee?.addEventListener("change", populateAssignees);

    certificateForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        certificateMessage.textContent = text("جاري إصدار الشهادة...", "Issuing certificate...");
        const data = new FormData(certificateForm);
        const hours = String(data.get("volunteer_hours") || "").trim();
        try {
            const result = await api().call("member_issue_certificate", {
                input_target_membership_id: String(data.get("membership_number") || "").trim(),
                input_title: String(data.get("title") || "").trim(),
                input_activity_name: String(data.get("activity_name") || "").trim() || null,
                input_description: String(data.get("description") || "").trim() || null,
                input_volunteer_hours: hours ? Number(hours) : null,
                input_issued_on: String(data.get("issued_on") || "")
            });
            if (!result?.success) throw new Error(result?.message || "issue_failed");
            certificateForm.reset();
            if (certificateDate) certificateDate.value = new Date().toISOString().slice(0, 10);
            certificateMessage.textContent = text(`تم إصدار الشهادة برمز ${result.certificate_code}.`, `Certificate issued with code ${result.certificate_code}.`);
            portalData = null;
            await loadPortal(true);
        } catch (error) {
            certificateMessage.textContent = error.message === "member_not_found"
                ? text("رقم العضوية غير موجود.", "Membership number was not found.")
                : text("تعذر إصدار الشهادة. راجع البيانات وحاول مرة أخرى.", "Could not issue the certificate. Check the data and try again.");
        }
    });

    issuedList?.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-revoke-certificate]");
        if (!button) return;
        button.disabled = true;
        try {
            const result = await api().call("member_revoke_certificate", { input_certificate_id: button.dataset.revokeCertificate });
            if (!result?.success) throw new Error("revoke_failed");
            portalData = null;
            await loadPortal(true);
        } catch (_) {
            button.disabled = false;
            certificateMessage.textContent = text("تعذر إلغاء الشهادة حاليًا.", "Could not revoke the certificate right now.");
        }
    });

    taskForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        taskMessage.textContent = text("جاري إنشاء المهمة...", "Creating task...");
        const data = new FormData(taskForm);
        try {
            const result = await api().call("member_create_committee_task", {
                input_committee: String(data.get("committee") || ""),
                input_title: String(data.get("title") || "").trim(),
                input_description: String(data.get("description") || "").trim(),
                input_assigned_membership_number: String(data.get("assigned_membership_number") || "").trim() || null,
                input_due_date: String(data.get("due_date") || "")
            });
            if (!result?.success) throw new Error(result?.message || "task_failed");
            taskForm.reset();
            taskMessage.textContent = text("تم إنشاء المهمة.", "Task created.");
            portalData = null;
            await loadPortal(true);
        } catch (_) {
            taskMessage.textContent = text("تعذر إنشاء المهمة. تحقق من اللجنة والعضو والبيانات.", "Could not create the task. Check the committee, member, and data.");
        }
    });

    tasksList?.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-update-task]");
        if (!button) return;
        const select = button.parentElement?.querySelector("select");
        if (!select) return;
        button.disabled = true;
        try {
            const result = await api().call("member_update_committee_task_status", {
                input_task_id: button.dataset.updateTask,
                input_status: select.value
            });
            if (!result?.success) throw new Error("update_failed");
            portalData = null;
            await loadPortal(true);
        } catch (_) {
            button.disabled = false;
            tasksStatus.textContent = text("تعذر تحديث حالة المهمة.", "Could not update the task status.");
        }
    });

    requestForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        requestMessage.textContent = text("جاري إرسال الطلب...", "Submitting request...");
        const data = new FormData(requestForm);
        try {
            const result = await api().call("member_submit_request", {
                input_request_type: String(data.get("request_type") || ""),
                input_subject: String(data.get("subject") || "").trim(),
                input_details: String(data.get("details") || "").trim()
            });
            if (!result?.success) throw new Error("request_failed");
            requestForm.reset();
            requestMessage.textContent = text("تم إرسال الطلب ويمكنك متابعة حالته هنا.", "Request submitted. You can track its status here.");
            portalData = null;
            await loadPortal(true);
        } catch (_) {
            requestMessage.textContent = text("تعذر إرسال الطلب. راجع البيانات وحاول مرة أخرى.", "Could not submit the request. Check the data and try again.");
        }
    });

    requestsList?.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-respond-request]");
        if (!button) return;
        const controls = button.closest(".request-admin-controls");
        const select = controls?.querySelector("select");
        const textarea = controls?.querySelector("textarea");
        if (!select || !textarea) return;
        button.disabled = true;
        try {
            const result = await api().call("member_respond_request", {
                input_request_id: button.dataset.respondRequest,
                input_status: select.value,
                input_admin_response: textarea.value.trim() || null
            });
            if (!result?.success) throw new Error("response_failed");
            portalData = null;
            await loadPortal(true);
        } catch (_) {
            button.disabled = false;
            requestsStatus.textContent = text("تعذر حفظ الرد حاليًا.", "Could not save the response right now.");
        }
    });

    const today = new Date().toISOString().slice(0, 10);
    if (certificateDate && !certificateDate.value) certificateDate.value = today;
    if (taskDueDate) taskDueDate.min = today;
})();
