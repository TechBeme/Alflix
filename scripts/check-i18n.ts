/**
 * i18n Key Comparison Script
 *
 * Compares all language JSON files in /messages to ensure:
 * 1. All files have the exact same set of keys (no missing keys)
 * 2. No values are empty strings, null, or undefined
 * 3. Reports differences per language pair
 *
 * Usage: npx tsx scripts/check-i18n.ts
 */

import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.resolve(__dirname, "../messages");

// ── Helpers ──────────────────────────────────────────────────────────────────

type NestedObject = { [key: string]: string | NestedObject };

/** Recursively collect all dot-notation keys from a nested object */
function collectKeys(obj: NestedObject, prefix = ""): string[] {
    const keys: string[] = [];
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            keys.push(...collectKeys(value as NestedObject, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

/** Get the value at a dot-notation path */
function getNestedValue(obj: NestedObject, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== "object") {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }
    return current;
}

/** Check if a value is considered "empty" */
function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) return true;
    return false;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
    // Load all language files
    const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
        console.error("❌ No JSON files found in", MESSAGES_DIR);
        process.exit(1);
    }

    console.log("🌐 i18n Key Comparison");
    console.log("=".repeat(70));
    console.log(`📁 Directory: ${MESSAGES_DIR}`);
    console.log(`📄 Files found: ${files.join(", ")}`);
    console.log();

    const languages: Record<string, { data: NestedObject; keys: Set<string> }> = {};

    for (const file of files) {
        const filePath = path.join(MESSAGES_DIR, file);
        const lang = file.replace(".json", "");
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as NestedObject;
        const keys = new Set(collectKeys(data));
        languages[lang] = { data, keys };
        console.log(`  ✅ ${lang}: ${keys.size} keys loaded`);
    }

    console.log();

    // Build the union of all keys
    const allKeys = new Set<string>();
    for (const { keys } of Object.values(languages)) {
        for (const k of keys) allKeys.add(k);
    }

    console.log(`📊 Total unique keys across all languages: ${allKeys.size}`);
    console.log();

    let hasErrors = false;

    // ── 1. Check missing keys per language ─────────────────────────────────────
    console.log("─".repeat(70));
    console.log("🔍 MISSING KEYS CHECK");
    console.log("─".repeat(70));

    const missingByLang: Record<string, string[]> = {};

    for (const [lang, { keys }] of Object.entries(languages)) {
        const missing = [...allKeys].filter((k) => !keys.has(k)).sort();
        missingByLang[lang] = missing;

        if (missing.length > 0) {
            hasErrors = true;
            console.log(`\n  ❌ ${lang} is missing ${missing.length} key(s):`);
            for (const k of missing) {
                // Show which languages DO have this key
                const presentIn = Object.entries(languages)
                    .filter(([l, { keys: lk }]) => l !== lang && lk.has(k))
                    .map(([l]) => l);
                console.log(`     • ${k}  (present in: ${presentIn.join(", ")})`);
            }
        } else {
            console.log(`\n  ✅ ${lang}: No missing keys`);
        }
    }

    // ── 2. Check empty values ──────────────────────────────────────────────────
    console.log();
    console.log("─".repeat(70));
    console.log("🔍 EMPTY VALUES CHECK");
    console.log("─".repeat(70));

    const emptyByLang: Record<string, string[]> = {};

    for (const [lang, { data, keys }] of Object.entries(languages)) {
        const emptyKeys: string[] = [];
        for (const key of keys) {
            const value = getNestedValue(data, key);
            if (isEmpty(value)) {
                emptyKeys.push(key);
            }
        }
        emptyByLang[lang] = emptyKeys;

        if (emptyKeys.length > 0) {
            hasErrors = true;
            console.log(`\n  ⚠️  ${lang} has ${emptyKeys.length} empty value(s):`);
            for (const k of emptyKeys.sort()) {
                const value = getNestedValue(data, k);
                const display =
                    value === null ? "null" :
                        value === undefined ? "undefined" :
                            typeof value === "string" && value.trim() === "" ? '""' :
                                typeof value === "object" ? "{}" : String(value);
                console.log(`     • ${k} = ${display}`);
            }
        } else {
            console.log(`\n  ✅ ${lang}: No empty values`);
        }
    }

    // ── 3. Pairwise comparison ─────────────────────────────────────────────────
    const langNames = Object.keys(languages);
    if (langNames.length > 2) {
        console.log();
        console.log("─".repeat(70));
        console.log("🔍 PAIRWISE KEY DIFF");
        console.log("─".repeat(70));

        for (let i = 0; i < langNames.length; i++) {
            for (let j = i + 1; j < langNames.length; j++) {
                const a = langNames[i];
                const b = langNames[j];
                const keysA = languages[a].keys;
                const keysB = languages[b].keys;

                const onlyInA = [...keysA].filter((k) => !keysB.has(k)).sort();
                const onlyInB = [...keysB].filter((k) => !keysA.has(k)).sort();

                if (onlyInA.length === 0 && onlyInB.length === 0) {
                    console.log(`\n  ✅ ${a} ↔ ${b}: Identical key sets`);
                } else {
                    hasErrors = true;
                    if (onlyInA.length > 0) {
                        console.log(`\n  ❌ Only in ${a} (missing from ${b}): ${onlyInA.length}`);
                        for (const k of onlyInA) console.log(`     • ${k}`);
                    }
                    if (onlyInB.length > 0) {
                        console.log(`\n  ❌ Only in ${b} (missing from ${a}): ${onlyInB.length}`);
                        for (const k of onlyInB) console.log(`     • ${k}`);
                    }
                }
            }
        }
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log();
    console.log("═".repeat(70));
    console.log("📋 SUMMARY");
    console.log("═".repeat(70));

    const totalMissing = Object.values(missingByLang).reduce((s, a) => s + a.length, 0);
    const totalEmpty = Object.values(emptyByLang).reduce((s, a) => s + a.length, 0);

    console.log(`  Total unique keys:   ${allKeys.size}`);
    console.log(`  Languages checked:   ${langNames.join(", ")}`);
    console.log(`  Missing keys total:  ${totalMissing}`);
    console.log(`  Empty values total:  ${totalEmpty}`);
    console.log();

    if (hasErrors) {
        console.log("❌ i18n check FAILED — issues found above.\n");
        process.exit(1);
    } else {
        console.log("✅ i18n check PASSED — all languages are in sync!\n");
        process.exit(0);
    }
}

main();
