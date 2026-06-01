import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(__dirname, "knowledge-base.json");

const allowedExtensions = new Set([
    ".html",
    ".js",
    ".json",
    ".md",
    ".txt",
    ".csv"
]);

const excludedDirs = new Set([
    ".git",
    ".netlify",
    "node_modules",
    "backups",
    "private",
    "backup-before-ai-himma",
    "ai-knowledge",
    "assets/js",
    "assets/images",
    "assets/optimized",
    "assets/images/optimized",
    "docs",
    "netlify",
    "scripts",
    "supabase"
]);

const excludedFiles = new Set([
    ".env",
    ".env.local",
    ".env.example",
    "assets/js/env.js",
    "assets/images-manifest.json",
    "BULK_CREATE_USERS.md",
    "AI_HIMMA_IMPLEMENTATION_REPORT.md",
    "SECURITY_CHECK.md",
    "SETUP_AUTH.md",
    "private/member-credentials.csv",
    "ai-knowledge/knowledge-base.json"
]);

function toPosix(value) {
    return value.split(path.sep).join("/");
}

function shouldSkip(relativePath) {
    const posix = toPosix(relativePath);
    if (excludedFiles.has(posix)) return true;
    if (posix.startsWith("backup-before-ai-himma")) return true;
    for (const dir of excludedDirs) {
        if (posix === dir || posix.startsWith(`${dir}/`)) return true;
    }
    return false;
}

async function collectFiles(dir = rootDir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);
        if (shouldSkip(relativePath)) continue;
        if (entry.isDirectory()) {
            files.push(...await collectFiles(fullPath));
            continue;
        }
        if (!entry.isFile()) continue;
        if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
            files.push(fullPath);
        }
    }
    return files;
}

function redactSensitive(text) {
    return text
        .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[REDACTED_SECRET_KEY]")
        .replace(/sb_publishable_[A-Za-z0-9_-]+/g, "[REDACTED_PUBLISHABLE_KEY]")
        .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN]")
        .replace(/^.*(password|SUPABASE_SERVICE_ROLE_KEY|GROQ_API_KEY|GEMINI_API_KEY|OPENAI_API_KEY|secret|private\/member-credentials).*$/gim, "");
}

function stripBase64(text) {
    return text.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, "[INLINE_IMAGE]");
}

function normalizeText(text) {
    return redactSensitive(stripBase64(text))
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function tagsForSource(relativePath, text) {
    const posix = toPosix(relativePath).toLowerCase();
    const tags = new Set();
    if (posix.includes("knowledge") || /الأردن|الثقافة الوطنية|التاريخ|الاستقلال/.test(text)) tags.add("national-culture");
    if (/همّة|مبادرة|اللجان|الأعضاء/.test(text)) tags.add("himma");
    if (/committee|لجنة|اللجان/.test(text)) tags.add("committees");
    if (/member|عضو|الأعضاء|رئيس|نائب/.test(text)) tags.add("members");
    if (/supabase|rls|storage|auth/i.test(text)) tags.add("technical");
    if (posix.includes("outreach")) tags.add("outreach");
    return Array.from(tags);
}

function chunkText(text, size = 1100, overlap = 120) {
    const chunks = [];
    for (let start = 0; start < text.length; start += size - overlap) {
        const part = text.slice(start, start + size).trim();
        if (part.length >= 80) chunks.push(part);
    }
    return chunks;
}

function entityFromText(text) {
    const committeeMatch = text.match(/(?:لجنة|اللجنة)\s+([^\s،.]{2,}(?:\s+[^\s،.]{2,}){0,4})/);
    const memberMatch = text.match(/(?:رئيس|نائب|عضو|الأمين العام)\s+([^،.]{3,80})/);
    return {
        committee_name: committeeMatch ? committeeMatch[0].trim() : null,
        member_name: memberMatch ? memberMatch[1].trim() : null
    };
}

async function main() {
    const files = await collectFiles();
    const chunks = [];
    let counter = 1;

    for (const filePath of files) {
        const relativePath = toPosix(path.relative(rootDir, filePath));
        const raw = await fs.readFile(filePath, "utf8").catch(() => "");
        const text = normalizeText(raw);
        if (!text) continue;
        const type = path.extname(filePath).slice(1).toLowerCase() || "text";
        const title = path.basename(filePath);
        const tags = tagsForSource(relativePath, text);
        chunkText(text).forEach((part, index) => {
            const entity = entityFromText(part);
            chunks.push({
                id: `kb-${String(counter).padStart(5, "0")}`,
                title: `${title} #${index + 1}`,
                source: relativePath,
                type,
                text: part,
                tags,
                entity_type: entity.member_name ? "member" : entity.committee_name ? "committee" : null,
                entity_name: entity.member_name || entity.committee_name || null,
                committee_name: entity.committee_name,
                member_name: entity.member_name,
                updated_at: new Date().toISOString()
            });
            counter += 1;
        });
    }

    await fs.writeFile(outputPath, `${JSON.stringify({ generated_at: new Date().toISOString(), chunks }, null, 2)}\n`, "utf8");
    console.log(`Knowledge chunks: ${chunks.length}`);
}

main().catch((error) => {
    console.warn(`Knowledge build skipped: ${error.message}`);
    process.exitCode = 0;
});
