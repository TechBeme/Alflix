#!/usr/bin/env node

/**
 * Multi-Language Screenshot Generator for PWA
 * 
 * Automatically generates professional screenshots for PWA manifest
 * in multiple languages using Playwright.
 * 
 * Usage:
 *   npm install -D playwright
 *   npx playwright install chromium
 *   node scripts/generate-screenshots.js
 */

const fs = require('fs');
const path = require('path');

// Config
const BASE_URL = process.env.SITE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'screenshots');

const VIEWPORTS = {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 1080, height: 1920 },
};

const LOCALES = {
    en: {
        pages: [
            { path: '/', name: 'home', label: 'ALLFLIX Home Page' },
            { path: '/movies', name: 'browse-movies', label: 'Browse Movies' },
            { path: '/tv', name: 'browse-tv', label: 'Browse TV Shows' },
            { path: '/search', name: 'search', label: 'Search' },
        ]
    },
    'pt-BR': {
        pages: [
            { path: '/', name: 'home', label: 'Página Inicial ALLFLIX' },
            { path: '/movies', name: 'browse-movies', label: 'Navegar Filmes' },
            { path: '/tv', name: 'browse-tv', label: 'Navegar Séries' },
            { path: '/search', name: 'search', label: 'Buscar' },
        ]
    },
    es: {
        pages: [
            { path: '/', name: 'home', label: 'Página de Inicio ALLFLIX' },
            { path: '/movies', name: 'browse-movies', label: 'Explorar Películas' },
            { path: '/tv', name: 'browse-tv', label: 'Explorar Series' },
            { path: '/search', name: 'search', label: 'Buscar' },
        ]
    },
};

// Ensure screenshot directories exist
function ensureDirectories(locale) {
    const dirs = [
        OUTPUT_DIR,
        path.join(OUTPUT_DIR, locale),
        path.join(OUTPUT_DIR, locale, 'desktop'),
        path.join(OUTPUT_DIR, locale, 'mobile'),
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}

async function generateScreenshotsForLocale(playwright, locale, localeConfig) {
    console.log(`\n🌍 Generating screenshots for: ${locale}`);
    console.log('═'.repeat(60));

    ensureDirectories(locale);

    const browser = await playwright.chromium.launch({
        headless: true,
    });

    let successCount = 0;
    let errorCount = 0;

    // Generate for each viewport
    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        console.log(`\n📱 ${device} (${viewport.width}x${viewport.height})`);
        console.log('─'.repeat(60));

        const context = await browser.newContext({
            viewport,
            deviceScaleFactor: 2,
            hasTouch: device === 'mobile',
            isMobile: device === 'mobile',
            locale: locale,
            extraHTTPHeaders: {
                'Accept-Language': locale,
            },
        });

        const page = await context.newPage();
        page.setDefaultTimeout(30000);

        // Set locale cookie for Next.js i18n
        await context.addCookies([{
            name: 'NEXT_LOCALE',
            value: locale,
            domain: 'localhost',
            path: '/',
        }]);

        // Generate for each page
        for (const { path: pagePath, name, label } of localeConfig.pages) {
            const url = `${BASE_URL}${pagePath}`;
            const filename = `${name}.png`;
            const outputPath = path.join(OUTPUT_DIR, locale, device, filename);

            try {
                console.log(`  📸 ${pagePath}`);

                await page.goto(url, {
                    waitUntil: 'networkidle',
                    timeout: 30000,
                });

                await page.waitForTimeout(2000);

                await page.evaluate(() => {
                    const selectors = [
                        '[role="dialog"]',
                        '.cookie-banner',
                        '.notification-banner',
                    ];
                    selectors.forEach(selector => {
                        document.querySelectorAll(selector).forEach(el => {
                            if (el.textContent?.toLowerCase().includes('cookie') ||
                                el.textContent?.toLowerCase().includes('accept') ||
                                el.textContent?.toLowerCase().includes('aceitar') ||
                                el.textContent?.toLowerCase().includes('aceptar')) {
                                el.remove();
                            }
                        });
                    });
                    window.scrollTo(0, 0);
                });

                await page.waitForTimeout(500);

                await page.screenshot({
                    path: outputPath,
                    fullPage: false,
                    type: 'png',
                });

                const stats = fs.statSync(outputPath);
                const sizeKB = (stats.size / 1024).toFixed(2);

                console.log(`  ✅ ${filename} (${sizeKB}KB)`);
                successCount++;

            } catch (error) {
                console.error(`  ❌ Failed: ${filename}`);
                console.error(`     ${error.message}`);
                errorCount++;
            }
        }

        await context.close();
    }

    await browser.close();

    return { successCount, errorCount };
}

async function generateScreenshots() {
    console.log('🚀 Starting multi-language screenshot generation...\n');

    // Check if Playwright is installed
    let playwright;
    try {
        playwright = require('playwright');
    } catch (error) {
        console.error('❌ Playwright not found. Install it with:');
        console.error('   npm install -D playwright');
        console.error('   npx playwright install chromium');
        process.exit(1);
    }

    let totalSuccess = 0;
    let totalErrors = 0;

    // Generate for each locale
    for (const [locale, config] of Object.entries(LOCALES)) {
        const { successCount, errorCount } = await generateScreenshotsForLocale(
            playwright,
            locale,
            config
        );
        totalSuccess += successCount;
        totalErrors += errorCount;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${totalSuccess} screenshots`);
    if (totalErrors > 0) {
        console.log(`❌ Errors: ${totalErrors} screenshots`);
    }
    console.log(`📁 Output: ${OUTPUT_DIR}\n`);
    console.log(`🌍 Locales: ${Object.keys(LOCALES).join(', ')}`);

    // Manifest info
    console.log('\n📝 Manifest configuration:');
    console.log('─'.repeat(60));
    console.log('Screenshots organized by locale in:');
    console.log('  public/screenshots/en/');
    console.log('  public/screenshots/pt-BR/');
    console.log('  public/screenshots/es/');
    console.log('\n💡 Next steps:');
    console.log('   1. Update app/manifest.ts to use locale-specific screenshots');
    console.log('   2. Run: npm run pwa:optimize (if files are too large)');
    console.log('   3. Verify: npm run pwa:check');
    console.log('   4. Deploy and test\n');
}

// Run
if (require.main === module) {
    generateScreenshots().catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { generateScreenshots };
