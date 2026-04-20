#!/usr/bin/env node

/**
 * Screenshot Optimizer
 * 
 * Otimiza screenshots PNG para reduzir tamanho mantendo qualidade
 * usando sharp (biblioteca de processamento de imagens)
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');
const MAX_SIZE_KB = 500; // Target: <500KB per screenshot

async function optimizeScreenshots() {
    console.log('🔧 Otimizando screenshots...\n');

    // Check if sharp is available
    let sharp;
    try {
        sharp = require('sharp');
    } catch (error) {
        console.log('📦 Sharp não encontrado. Instalando...');
        require('child_process').execSync('npm install -D sharp', { stdio: 'inherit' });
        sharp = require('sharp');
    }

    const dirs = ['desktop', 'mobile'];
    let totalBefore = 0;
    let totalAfter = 0;
    let optimizedCount = 0;

    for (const dir of dirs) {
        const dirPath = path.join(SCREENSHOTS_DIR, dir);

        if (!fs.existsSync(dirPath)) {
            console.log(`⚠️  Diretório não encontrado: ${dirPath}`);
            continue;
        }

        console.log(`\n📁 Otimizando: ${dir}/`);
        console.log('─'.repeat(60));

        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            const sizeBeforeKB = (stats.size / 1024).toFixed(2);
            totalBefore += stats.size;

            // Skip if already optimized
            if (stats.size < MAX_SIZE_KB * 1024) {
                console.log(`  ✓ ${file}: ${sizeBeforeKB}KB (já otimizado)`);
                totalAfter += stats.size;
                continue;
            }

            try {
                // Read original
                const image = sharp(filePath);
                const metadata = await image.metadata();

                // Optimize with progressive quality reduction until under target
                let quality = 85;
                let optimizedBuffer;
                let outputSize;

                do {
                    optimizedBuffer = await sharp(filePath)
                        .png({
                            quality,
                            compressionLevel: 9,
                            adaptiveFiltering: true,
                            palette: true, // Use palette-based PNG for better compression
                        })
                        .toBuffer();

                    outputSize = optimizedBuffer.length;
                    quality -= 5;

                } while (outputSize > MAX_SIZE_KB * 1024 && quality > 50);

                // Write optimized
                fs.writeFileSync(filePath, optimizedBuffer);

                const sizeAfterKB = (outputSize / 1024).toFixed(2);
                const reduction = (((stats.size - outputSize) / stats.size) * 100).toFixed(1);

                console.log(`  ✅ ${file}: ${sizeBeforeKB}KB → ${sizeAfterKB}KB (-${reduction}%)`);

                totalAfter += outputSize;
                optimizedCount++;

            } catch (error) {
                console.error(`  ❌ Erro ao otimizar ${file}:`, error.message);
                totalAfter += stats.size;
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Resumo');
    console.log('='.repeat(60));

    const totalBeforeMB = (totalBefore / 1024 / 1024).toFixed(2);
    const totalAfterMB = (totalAfter / 1024 / 1024).toFixed(2);
    const totalReduction = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);

    console.log(`Tamanho antes:  ${totalBeforeMB}MB`);
    console.log(`Tamanho depois: ${totalAfterMB}MB`);
    console.log(`Redução total:  ${totalReduction}%`);
    console.log(`Arquivos otimizados: ${optimizedCount}`);

    console.log('\n✅ Otimização concluída!\n');
}

// Run
if (require.main === module) {
    optimizeScreenshots().catch(error => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { optimizeScreenshots };
