(() => {
    const status = document.getElementById("certificate-status");
    const sheet = document.getElementById("certificate-sheet");
    const printButton = document.getElementById("print-certificate");
    const code = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase() || "";

    async function verifyCertificate() {
        if (!/^HIMMA-[A-Z0-9]{8,20}$/.test(code)) {
            status.textContent = "رمز الشهادة غير صحيح أو غير مكتمل.";
            return;
        }
        const config = window.HIMMA_SUPABASE_CONFIG;
        if (!config?.url || !config?.anonKey) {
            status.textContent = "خدمة التحقق غير متاحة مؤقتًا.";
            return;
        }
        try {
            const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/rpc/member_certificate_verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: config.anonKey,
                    Authorization: `Bearer ${config.anonKey}`
                },
                body: JSON.stringify({ input_code: code })
            });
            if (!response.ok) throw new Error("verify_failed");
            const certificate = await response.json();
            if (!certificate?.success) {
                status.textContent = "لم يتم العثور على شهادة فعالة بهذا الرمز.";
                return;
            }
            document.getElementById("certificate-member-name").textContent = certificate.member_name || "-";
            document.getElementById("certificate-membership").textContent = certificate.membership_number || "-";
            document.getElementById("certificate-title").textContent = certificate.title || "-";
            document.getElementById("certificate-description").textContent = certificate.description || "";
            document.getElementById("certificate-date").textContent = certificate.issued_on || "-";
            document.getElementById("certificate-issuer").textContent = certificate.issued_by_name || "مبادرة همّة";
            document.getElementById("certificate-code").textContent = certificate.certificate_code || code;
            if (certificate.activity_name) {
                document.getElementById("certificate-activity").textContent = certificate.activity_name;
                document.getElementById("certificate-activity-wrap").hidden = false;
            }
            if (certificate.volunteer_hours !== null && certificate.volunteer_hours !== undefined) {
                document.getElementById("certificate-hours").textContent = certificate.volunteer_hours;
                document.getElementById("certificate-hours-wrap").hidden = false;
            }
            const qrRoot = document.getElementById("certificate-qr");
            qrRoot.textContent = "";
            if (window.QRCode) {
                new window.QRCode(qrRoot, {
                    text: window.location.href,
                    width: 112,
                    height: 112,
                    colorDark: "#111713",
                    colorLight: "#ffffff",
                    correctLevel: window.QRCode.CorrectLevel.M
                });
            }
            status.hidden = true;
            sheet.hidden = false;
            printButton.hidden = false;
        } catch (_) {
            status.textContent = "تعذر التحقق من الشهادة حاليًا، يرجى المحاولة لاحقًا.";
        }
    }

    printButton.addEventListener("click", () => window.print());
    verifyCertificate();
})();
