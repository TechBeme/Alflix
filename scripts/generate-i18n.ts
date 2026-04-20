/**
 * Generate empty i18n files for new languages
 * 
 * Reads the structure from en.json and creates new language files
 * with all keys set to empty strings, ready to be translated.
 *
 * Usage: npx tsx scripts/generate-i18n.ts
 */

import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.resolve(__dirname, "../messages");
const SOURCE_FILE = path.join(MESSAGES_DIR, "en.json");

// ISO 639-1 codes for the new languages
const NEW_LANGUAGES: Record<string, string> = {
  ru: "Russo",
  hi: "Hindi",
  zh: "Chinês",
  ja: "Japonês",
  ko: "Coreano",
  ar: "Árabe",
  fr: "Francês",
  de: "Alemão",
  it: "Italiano",
};

type NestedObject = { [key: string]: string | NestedObject };

/** Recursively clone structure, replacing all leaf string values with "" */
function emptyClone(obj: NestedObject): NestedObject {
  const result: NestedObject = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = emptyClone(value as NestedObject);
    } else {
      result[key] = "";
    }
  }
  return result;
}

function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8")) as NestedObject;
  const emptyStructure = emptyClone(source);

  console.log(`📖 Source: en.json`);
  console.log(`🌐 Generating ${Object.keys(NEW_LANGUAGES).length} new language files...\n`);

  for (const [code, name] of Object.entries(NEW_LANGUAGES)) {
    const filePath = path.join(MESSAGES_DIR, `${code}.json`);

    if (fs.existsSync(filePath)) {
      console.log(`  ⚠️  Overwriting existing file: ${code}.json (${name})`);
    }

    fs.writeFileSync(filePath, JSON.stringify(emptyStructure, null, 2) + "\n", "utf-8");
    console.log(`  ✅ ${code}.json created (${name})`);
  }

  console.log("\n✅ Done!");
}

main();
