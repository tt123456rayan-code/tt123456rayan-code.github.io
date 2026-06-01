import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const credentialsPath = path.join(root, "private", "member-credentials.csv");

function arg(name) {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? String(process.argv[index + 1] || "").trim() : "";
}

function csvEscape(value) {
    const text = String(value || "");
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];
        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            index += 1;
            continue;
        }
        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (char === "," && !inQuotes) {
            values.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    values.push(current);
    return values;
}

function readRows() {
    if (!fs.existsSync(credentialsPath)) {
        return [];
    }
    const lines = fs.readFileSync(credentialsPath, "utf8").split(/\r?\n/).filter(Boolean);
    const [header, ...rows] = lines;
    if (!header || !header.includes("membership_id")) {
        throw new Error("private/member-credentials.csv has an unexpected header.");
    }
    return rows.map(parseCsvLine);
}

function nextMembershipId(rows) {
    const highest = rows.reduce((max, row) => {
        const match = String(row[3] || "").match(/^NYIJO(\d{4})$/i);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `NYIJO${String(highest + 1).padStart(4, "0")}`;
}

function randomPassword() {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const tail = "0123456789!@#$%^&*";
    const first = Array.from({ length: 6 }, () => letters[crypto.randomInt(letters.length)]).join("");
    const second = Array.from({ length: 5 }, () => tail[crypto.randomInt(tail.length)]).join("");
    return first + second;
}

function main() {
    const name = arg("name");
    const committee = arg("committee");
    const role = arg("role");

    if (!name || !committee || !role) {
        console.error("Usage: node scripts/add-member.mjs --name \"اسم العضو\" --committee \"اللجنة\" --role \"المنصب\"");
        process.exit(1);
    }

    if (/مؤمن|moamen|momen|moumen/i.test(name)) {
        console.error("Refused: مؤمن is excluded from members by project requirement.");
        process.exit(1);
    }

    fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
    const rows = readRows();
    const membershipId = nextMembershipId(rows);
    const password = randomPassword();
    const header = "name,committee,role,membership_id,password";
    const newLine = [name, committee, role, membershipId, password].map(csvEscape).join(",");

    if (!fs.existsSync(credentialsPath) || fs.readFileSync(credentialsPath, "utf8").trim() === "") {
        fs.writeFileSync(credentialsPath, `${header}\n${newLine}\n`, "utf8");
    } else {
        fs.appendFileSync(credentialsPath, `${newLine}\n`, "utf8");
    }

    console.log(`Created local credential row for ${name}`);
    console.log(`membership_id: ${membershipId}`);
    console.log(`password: ${password}`);
    console.log("Run: node scripts/bulk-create-auth-users.mjs");
}

main();
