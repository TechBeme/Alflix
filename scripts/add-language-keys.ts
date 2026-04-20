/**
 * Add new locale keys to the "language" section of all i18n files
 * 
 * Usage: npx tsx scripts/add-language-keys.ts
 */

import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.resolve(__dirname, "../messages");

// The language display names for each locale (shown in the language switcher)
// Each language's name is written in its OWN language (native name)
const LOCALE_NATIVE_NAMES: Record<string, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
};

function main() {
  const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!data.language) {
      data.language = {};
    }

    // Add all locale keys with their native names
    for (const [locale, nativeName] of Object.entries(LOCALE_NATIVE_NAMES)) {
      if (!data.language[locale]) {
        data.language[locale] = nativeName;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`✅ ${file}: language keys updated`);
  }

  console.log("\n✅ All language keys added!");
}

main();
