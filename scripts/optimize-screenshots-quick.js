#!/usr/bin/env node

/**
 * Quick Screenshot Optimizer
 * 
 * Comprime rapidamente screenshots grandes usando sharp
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');
const MAX_SIZE_KB = 1500; // 1.5MB max

async function optimizeQuick() {
    console.log('⚡ Otimização rápida de screenshots...\n');

    let sharp;
    try {
        sharp = require('sharp');
    } catch (error) {
        console.error('❌ Sharp não instalado: npm install -D sharp');
        process.exit(1);
    }

    const files = [
        'desktop/browse-tv.png',
        'mobile/browse-movies.png',
        'mobile/browse-tv.png',
    ];

    for (const file of files) {
        const filePath = path.join(SCREENSHOTS_DIR, file);

        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Ignorando: ${file}`);
            continue;
        }

        const statsBefore = fs.statSync(filePath);
        const sizeBeforeKB = (statsBefore.size / 1024).toFixed(2);

        if (statsBefore.size < MAX_SIZE_KB * 1024) {
            console.log(`✓ ${file}: ${sizeBeforeKB}KB (OK)`);
            continue;
        }

        console.log(`🔧 Otimizando: ${file} (${sizeBeforeKB}KB)...`);

        try {
            // Compress aggressively
            await sharp(filePath)
                .png({
                    quality: 70,
                    compressionLevel: 9,
                    effort: 10,
                })
                .toFile(filePath + '.tmp');

            // Replace original
            fs.renameSync(filePath + '.tmp', filePath);

            const statsAfter = fs.statSync(filePath);
            const sizeAfterKB = (statsAfter.size / 1024).toFixed(2);
            const reduction = (((statsBefore.size - statsAfter.size) / statsBefore.size) * 100).toFixed(1);

            console.log(`✅ ${file}: ${sizeBeforeKB}KB → ${sizeAfterKB}KB (-${reduction}%)\n`);

        } catch (error) {
            console.error(`❌ Erro: ${error.message}\n`);
            if (fs.existsSync(filePath + '.tmp')) {
                fs.unlinkSync(filePath + '.tmp');
            }
        }
    }

    console.log('✅ Otimização concluída!\n');
}

optimizeQuick().catch(console.error);
