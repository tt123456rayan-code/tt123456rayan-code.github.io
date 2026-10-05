(() => {
  const config = window.HIMMA_SUPABASE_CONFIG || {};
  const baseUrl = String(config.url || "").replace(/\/$/, "");
  const anonKey = String(config.anonKey || "");
  const token = new URLSearchParams(location.search).get("token");
  const message = document.querySelector("#certificate-message");
  const formatDate = value => new Intl.DateTimeFormat("ar-JO", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
  async function load() {
    if (!baseUrl || !anonKey || !token) throw new Error("رابط التحقق غير صالح.");
    const response = await fetch(`${baseUrl}/rest/v1/rpc/academy_certificate_verify`, { method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ input_token: token }) });
    const rows = await response.json().catch(() => []); const certificate = Array.isArray(rows) ? rows[0] : null;
    if (!response.ok || !certificate) throw new Error("لم يتم العثور على شهادة مطابقة.");
    document.querySelector("#certificate-name").textContent = certificate.recipient_name;
    document.querySelector("#certificate-course").textContent = certificate.course_title;
    document.querySelector("#certificate-date").textContent = formatDate(certificate.issued_at);
    document.querySelector("#certificate-serial").textContent = certificate.serial_number;
    document.querySelector("#certificate-card").hidden = false;
    document.querySelector("#certificate-actions").hidden = false;
    message.textContent = certificate.is_valid ? "الشهادة صالحة ويمكن التحقق منها." : "هذه الشهادة ملغاة.";
    message.style.color = certificate.is_valid ? "" : "#b32232";
    if (window.QRCode) new window.QRCode(document.querySelector("#certificate-qr"), { text: location.href, width: 108, height: 108, colorDark: "#043d28", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
  }
  document.querySelector("#print-certificate").addEventListener("click", () => window.print());
  load().catch(error => { message.textContent = error.message || "تعذر التحقق من الشهادة."; message.style.color = "#b32232"; });
})();
