import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env.local");
const credentialsPath = path.join(rootDir, "private", "member-credentials.csv");
const meetingCreatorIds = new Set(["NYIJO0001", "NYIJO0002"]);
const announcementManagerIds = new Set(["NYIJO0001", "NYIJO0002", "NYIJO0003"]);
const committeeManagerIds = new Set(["NYIJO0002"]);
const structureManagerIds = new Set(["NYIJO0002"]);
const legacyPasswordHashPlaceholder = "supabase_auth_managed_no_local_password_000000";

function parseEnv(content) {
    const env = {};
    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const equalsIndex = trimmed.indexOf("=");
        if (equalsIndex === -1) return;
        const key = trimmed.slice(0, equalsIndex).trim();
        let value = trimmed.slice(equalsIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        env[key] = value;
    });
    return env;
}

function parseCsvLine(line) {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const next = line[i + 1];
        if (char === '"' && insideQuotes && next === '"') {
            current += '"';
            i += 1;
            continue;
        }
        if (char === '"') {
            insideQuotes = !insideQuotes;
            continue;
        }
        if (char === "," && !insideQuotes) {
            values.push(current);
            current = "";
            continue;
        }
        current += char;
    }

    values.push(current);
    return values.map((value) => value.trim());
}

function parseCredentialsCsv(content) {
    const normalized = content.replace(/^\uFEFF/, "").trim();
    if (!normalized) return [];

    const lines = normalized.split(/\r?\n/).filter((line) => line.trim());
    const headers = parseCsvLine(lines.shift()).map((header) => header.trim());
    const requiredHeaders = ["name", "committee", "role", "membership_id", "password"];
    requiredHeaders.forEach((header) => {
        if (!headers.includes(header)) {
            throw new Error(`Missing CSV header: ${header}`);
        }
    });

    return lines.map((line, index) => {
        const values = parseCsvLine(line);
        const row = {};
        headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] || "";
        });
        row.rowNumber = index + 2;
        return row;
    });
}

function membershipToEmail(membershipId) {
    return `${membershipId.toLowerCase()}@members.nyi.local`;
}

function isExcludedMember(row) {
    const text = `${row.name} ${row.committee} ${row.role}`.toLowerCase();
    return text.includes("مؤمن") || text.includes("momen") || text.includes("moamen") || text.includes("moumen");
}

function validateMember(row) {
    const membershipId = row.membership_id.trim().toUpperCase();
    if (!/^NYIJO\d{4}$/.test(membershipId)) {
        throw new Error(`Invalid membership_id at CSV row ${row.rowNumber}: ${row.membership_id}`);
    }
    if (!row.password) {
        throw new Error(`Missing password at CSV row ${row.rowNumber}: ${membershipId}`);
    }
    if (!row.name || !row.committee || !row.role) {
        throw new Error(`Missing member data at CSV row ${row.rowNumber}: ${membershipId}`);
    }
    return {
        name: row.name.trim(),
        committee: row.committee.trim(),
        role: row.role.trim(),
        membership_id: membershipId,
        password: row.password
    };
}

async function readConfig() {
    const envContent = await fs.readFile(envPath, "utf8").catch(() => {
        throw new Error("Missing .env.local. Create it with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    });
    const env = parseEnv(envContent);
    const supabaseUrl = (env.SUPABASE_URL || "").replace(/\/+$/, "");
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local.");
    }
    if (env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY) {
        console.warn("Ignoring frontend publishable/anon keys in .env.local. This script only uses the service role key locally.");
    }

    return { supabaseUrl, serviceRoleKey };
}

function createSupabaseRequester({ supabaseUrl, serviceRoleKey }) {
    const baseHeaders = {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
    };

    return async function request(endpoint, options = {}) {
        const response = await fetch(`${supabaseUrl}${endpoint}`, {
            method: options.method || "GET",
            headers: { ...baseHeaders, ...(options.headers || {}) },
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        const raw = await response.text();
        let data = null;
        if (raw) {
            try {
                data = JSON.parse(raw);
            } catch (_) {
                data = raw;
            }
        }
        if (!response.ok) {
            const message = typeof data === "string"
                ? data
                : data?.msg || data?.message || data?.error_description || data?.error || response.statusText;
            const error = new Error(`${options.method || "GET"} ${endpoint} failed (${response.status}): ${message}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    };
}

async function listAuthUsers(request) {
    const users = [];
    const perPage = 1000;
    for (let page = 1; page < 1000; page += 1) {
        const data = await request(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`);
        const pageUsers = Array.isArray(data) ? data : data?.users || [];
        users.push(...pageUsers);
        if (pageUsers.length < perPage) break;
    }
    return users;
}

function unwrapUser(data) {
    return data?.user || data;
}

async function updateAuthUser(request, userId, payload) {
    try {
        return unwrapUser(await request(`/auth/v1/admin/users/${userId}`, {
            method: "PUT",
            body: payload
        }));
    } catch (error) {
        const message = String(error.message || "");
        if (!message.includes("email_confirm")) throw error;
        const { email_confirm: _emailConfirm, ...fallbackPayload } = payload;
        return unwrapUser(await request(`/auth/v1/admin/users/${userId}`, {
            method: "PUT",
            body: fallbackPayload
        }));
    }
}

async function upsertMember(request, member, authUserId) {
    const row = {
        auth_user_id: authUserId,
        membership_id: member.membership_id,
        name: member.name,
        committee: member.committee,
        role: member.role,
        password_hash: legacyPasswordHashPlaceholder,
        can_create_meetings: meetingCreatorIds.has(member.membership_id),
        can_manage_announcements: announcementManagerIds.has(member.membership_id),
        can_manage_committees: committeeManagerIds.has(member.membership_id),
        can_manage_structure: structureManagerIds.has(member.membership_id),
        can_manage_members: structureManagerIds.has(member.membership_id),
        full_name: member.name,
        membership_number: member.membership_id,
        position_title: member.role,
        is_active: true
    };

    const postMember = (body) => request("/rest/v1/members?on_conflict=membership_id", {
        method: "POST",
        headers: {
            Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: [body]
    });

    try {
        await postMember(row);
    } catch (error) {
        const message = String(error.message || "").toLowerCase();
        const isNewColumnMissing = [
            "can_manage_committees",
            "can_manage_structure",
            "can_manage_members",
            "full_name",
            "membership_number",
            "position_title",
            "is_active"
        ].some((column) => message.includes(column));
        const isLegacyPasswordHashRequired =
            message.includes("password_hash") &&
            (message.includes("not-null") || message.includes("null value"));
        if (isNewColumnMissing) {
            const {
                can_manage_committees: _canManageCommittees,
                can_manage_structure: _canManageStructure,
                can_manage_members: _canManageMembers,
                full_name: _fullName,
                membership_number: _membershipNumber,
                position_title: _positionTitle,
                is_active: _isActive,
                ...fallbackRow
            } = row;
            await postMember(isLegacyPasswordHashRequired
                ? { ...fallbackRow, password_hash: legacyPasswordHashPlaceholder }
                : fallbackRow);
            console.warn("Some Himma admin columns are not applied yet. Apply supabase_himma_full_schema.sql so Rayan can manage committees, members, and structure.");
            return;
        }
        if (!isLegacyPasswordHashRequired) {
            throw error;
        }
        await postMember({ ...row, password_hash: legacyPasswordHashPlaceholder });
    }
}

async function main() {
    const config = await readConfig();
    const request = createSupabaseRequester(config);
    const csvContent = await fs.readFile(credentialsPath, "utf8");
    const rows = parseCredentialsCsv(csvContent);
    const skippedRows = rows.filter(isExcludedMember);
    const members = rows.filter((row) => !isExcludedMember(row)).map(validateMember);

    if (!members.length) {
        throw new Error("No members found in private/member-credentials.csv.");
    }

    const existingUsers = await listAuthUsers(request);
    const usersByEmail = new Map(
        existingUsers
            .filter((user) => user.email)
            .map((user) => [user.email.toLowerCase(), user])
    );

    const summary = { created: 0, updated: 0, linked: 0, skippedExcluded: skippedRows.length };

    for (const member of members) {
        const email = membershipToEmail(member.membership_id);
        const payload = {
            email,
            password: member.password,
            email_confirm: true,
            user_metadata: {
                membership_id: member.membership_id,
                name: member.name,
                committee: member.committee,
                role: member.role
            }
        };

        let authUser = usersByEmail.get(email);
        if (authUser) {
            authUser = await updateAuthUser(request, authUser.id, payload);
            summary.updated += 1;
            console.log(`UPDATED ${member.membership_id} ${email}`);
        } else {
            try {
                authUser = unwrapUser(await request("/auth/v1/admin/users", {
                    method: "POST",
                    body: payload
                }));
                summary.created += 1;
                console.log(`CREATED ${member.membership_id} ${email}`);
            } catch (error) {
                const message = String(error.message || "").toLowerCase();
                if (!message.includes("already") && !message.includes("registered") && error.status !== 422) {
                    throw error;
                }
                const refreshedUsers = await listAuthUsers(request);
                authUser = refreshedUsers.find((user) => user.email?.toLowerCase() === email);
                if (!authUser) throw error;
                authUser = await updateAuthUser(request, authUser.id, payload);
                summary.updated += 1;
                console.log(`UPDATED ${member.membership_id} ${email}`);
            }
        }

        if (!authUser?.id) {
            throw new Error(`Supabase did not return auth user id for ${member.membership_id}.`);
        }

        await upsertMember(request, member, authUser.id);
        summary.linked += 1;
    }

    if (skippedRows.length) {
        console.log(`SKIPPED_EXCLUDED ${skippedRows.length}`);
    }
    console.log(`DONE created=${summary.created} updated=${summary.updated} linked=${summary.linked} skippedExcluded=${summary.skippedExcluded}`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
