#!/usr/bin/env node

/**
 * Multi-locale Screenshot Optimizer
 * Otimiza screenshots grandes para todos os idiomas
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');
const MAX_SIZE_KB = 1500;

async function optimizeScreenshots() {
    console.log('⚡ Otimizando screenshots multilíngues...\n');

    let sharp;
    try {
        sharp = require('sharp');
    } catch (error) {
        console.error('❌ Sharp não instalado: npm install -D sharp');
        process.exit(1);
    }

    const locales = ['en', 'pt-BR', 'es'];
    const devices = ['desktop', 'mobile'];

    let totalOptimized = 0;
    let totalSizeBefore = 0;
    let totalSizeAfter = 0;

    for (const locale of locales) {
        console.log(`\n🌍 ${locale}`);
        console.log('─'.repeat(60));

        for (const device of devices) {
            const dirPath = path.join(SCREENSHOTS_DIR, locale, device);

            if (!fs.existsSync(dirPath)) continue;

            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const statsBefore = fs.statSync(filePath);
                const sizeBeforeKB = (statsBefore.size / 1024).toFixed(2);
                totalSizeBefore += statsBefore.size;

                if (statsBefore.size < MAX_SIZE_KB * 1024) {
                    console.log(`  ✓ ${device}/${file}: ${sizeBeforeKB}KB (OK)`);
                    totalSizeAfter += statsBefore.size;
                    continue;
                }

                try {
                    console.log(`  🔧 ${device}/${file}: ${sizeBeforeKB}KB...`);

                    await sharp(filePath)
                        .png({
                            quality: 70,
                            compressionLevel: 9,
                            effort: 10,
                        })
                        .toFile(filePath + '.tmp');

                    fs.renameSync(filePath + '.tmp', filePath);

                    const statsAfter = fs.statSync(filePath);
                    const sizeAfterKB = (statsAfter.size / 1024).toFixed(2);
                    const reduction = (((statsBefore.size - statsAfter.size) / statsBefore.size) * 100).toFixed(1);

                    totalSizeAfter += statsAfter.size;
                    totalOptimized++;

                    console.log(`     ✅ ${sizeBeforeKB}KB → ${sizeAfterKB}KB (-${reduction}%)`);

                } catch (error) {
                    console.error(`     ❌ Erro: ${error.message}`);
                    totalSizeAfter += statsBefore.size;
                    if (fs.existsSync(filePath + '.tmp')) {
                        fs.unlinkSync(filePath + '.tmp');
                    }
                }
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Resumo');
    console.log('='.repeat(60));
    const sizeBefore = (totalSizeBefore / 1024 / 1024).toFixed(2);
    const sizeAfter = (totalSizeAfter / 1024 / 1024).toFixed(2);
    const totalReduction = (((totalSizeBefore - totalSizeAfter) / totalSizeBefore) * 100).toFixed(1);

    console.log(`Tamanho antes:  ${sizeBefore}MB`);
    console.log(`Tamanho depois: ${sizeAfter}MB`);
    console.log(`Redução total:  ${totalReduction}%`);
    console.log(`Arquivos otimizados: ${totalOptimized}/24`);
    console.log('\n✅ Otimização concluída!\n');
}

optimizeScreenshots().catch(console.error);
