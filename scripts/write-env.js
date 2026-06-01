const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "assets", "js", "env.js");

function readExistingConfig() {
    if (!fs.existsSync(target)) {
        return {};
    }
    const existing = fs.readFileSync(target, "utf8");
    const match = existing.match(/window\.HIMMA_SUPABASE_CONFIG\s*=\s*(\{[\s\S]*?\});/);
    if (!match) {
        return {};
    }
    try {
        return JSON.parse(match[1]);
    } catch (_) {
        return {};
    }
}

const existingConfig = readExistingConfig();

function validSupabaseUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
    } catch (_) {
        return false;
    }
}

function validPublishableKey(value) {
    return /^sb_publishable_[A-Za-z0-9_-]+$/.test(value || "") || /^sb_anon_[A-Za-z0-9_-]+$/.test(value || "");
}

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const rawAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const envUrl = validSupabaseUrl(rawUrl) ? rawUrl : "";
const envAnonKey = validPublishableKey(rawAnonKey) ? rawAnonKey : "";
const config = {
    url: envUrl || existingConfig.url || "",
    anonKey: envAnonKey || existingConfig.anonKey || ""
};

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `window.HIMMA_SUPABASE_CONFIG = ${JSON.stringify(config, null, 4)};\n`);
