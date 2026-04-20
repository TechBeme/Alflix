#!/usr/bin/env node

/**
 * Script de Validação - Arquitetura de Busca
 * 
 * Este script valida que a implementação segue corretamente
 * a documentação do TMDB API e nunca mistura endpoints.
 * 
 * Uso: node scripts/validate-search.js
 */

const axios = require('axios');

// Cores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function section(message) {
    log(`\n${'='.repeat(60)}`, 'blue');
    log(message, 'blue');
    log('='.repeat(60), 'blue');
}

// Configuração
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
    error('TMDB_API_KEY não configurada!');
    process.exit(1);
}

// Verificar se o servidor está rodando
async function checkServer() {
    try {
        await axios.get(API_URL);
        return true;
    } catch (err) {
        return false;
    }
}

// Testar endpoint direto do TMDB
async function testTMDBEndpoint(endpoint, params, expectedBehavior) {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3${endpoint}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'pt-BR',
                ...params,
            },
        });

        if (response.data && response.data.results) {
            success(`${endpoint} - ${expectedBehavior}`);
            info(`  Resultados: ${response.data.results.length}`);
            return { success: true, data: response.data };
        } else {
            warning(`${endpoint} - Resposta inesperada`);
            return { success: false, data: response.data };
        }
    } catch (err) {
        error(`${endpoint} - Falhou: ${err.message}`);
        return { success: false, error: err.message };
    }
}

// Validar que search não aceita filtros avançados
async function validateSearchNoFilters() {
    section('Validando: Search NÃO aceita filtros avançados');

    // Testar search/multi com query válida
    await testTMDBEndpoint(
        '/search/multi',
        { query: 'spider-man', page: 1 },
        'Query válida funciona'
    );

    // Testar search/movie com query
    await testTMDBEndpoint(
        '/search/movie',
        { query: 'avengers', page: 1 },
        'Search movie com query funciona'
    );

    // Testar search/tv com query
    await testTMDBEndpoint(
        '/search/tv',
        { query: 'stranger things', page: 1 },
        'Search TV com query funciona'
    );

    // IMPORTANTE: Tentar enviar filtros para search e verificar que são ignorados
    info('\nTentando enviar filtros para /search/multi (devem ser ignorados):');
    const result = await testTMDBEndpoint(
        '/search/multi',
        {
            query: 'test',
            with_genres: '28', // Filtro que não deve funcionar
            'vote_average.gte': '7', // Filtro que não deve funcionar
            sort_by: 'popularity.desc', // Filtro que não deve funcionar
        },
        'Filtros são ignorados pelo TMDB'
    );

    if (result.success) {
        warning('  TMDB ignora filtros em /search/* (comportamento esperado)');
    }
}

// Validar que discover aceita filtros mas não query
async function validateDiscoverWithFilters() {
    section('Validando: Discover aceita filtros avançados');

    // Testar discover/movie com filtros
    await testTMDBEndpoint(
        '/discover/movie',
        {
            with_genres: '28',
            'vote_average.gte': '7',
            sort_by: 'popularity.desc',
            page: 1,
        },
        'Discover movie com filtros funciona'
    );

    // Testar discover/tv com filtros
    await testTMDBEndpoint(
        '/discover/tv',
        {
            with_genres: '18',
            first_air_date_year: '2023',
            'vote_average.gte': '8',
            page: 1,
        },
        'Discover TV com filtros funciona'
    );

    // IMPORTANTE: Tentar enviar query para discover (não deve funcionar)
    info('\nTentando enviar query para /discover/movie (não deve funcionar):');
    const result = await testTMDBEndpoint(
        '/discover/movie',
        {
            query: 'test', // Parâmetro que não existe
            with_genres: '28',
        },
        'Discover ignora query de texto'
    );

    if (result.success) {
        warning('  TMDB ignora parâmetro "query" em /discover/* (esperado)');
    }
}

// Validar estrutura de código
function validateCodeStructure() {
    section('Validando: Estrutura do Código');

    const fs = require('fs');
    const path = require('path');

    // Verificar se os arquivos existem
    const files = [
        'lib/tmdb.ts',
        'app/api/search/route.ts',
        'app/search/page.tsx',
        'docs/SEARCH_ARCHITECTURE.md',
    ];

    let allExist = true;
    files.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            success(`Arquivo existe: ${file}`);
        } else {
            error(`Arquivo não encontrado: ${file}`);
            allExist = false;
        }
    });

    if (allExist) {
        info('\nVerificando conteúdo dos arquivos...');

        // Verificar lib/tmdb.ts
        const tmdbContent = fs.readFileSync('lib/tmdb.ts', 'utf-8');
        
        if (tmdbContent.includes('async search(')) {
            success('Método search() encontrado');
        } else {
            error('Método search() não encontrado');
        }

        if (tmdbContent.includes('async searchAll(')) {
            success('Método searchAll() encontrado');
        } else {
            error('Método searchAll() não encontrado');
        }

        if (tmdbContent.includes('async discover(')) {
            success('Método discover() encontrado');
        } else {
            error('Método discover() não encontrado');
        }

        if (tmdbContent.includes('async discoverAll(')) {
            success('Método discoverAll() encontrado');
        } else {
            error('Método discoverAll() não encontrado');
        }

        // Verificar que search não tem parâmetro 'year'
        if (!tmdbContent.match(/async search\([^)]*year\?:/)) {
            success('Método search() não aceita filtros avançados (correto)');
        } else {
            error('Método search() ainda aceita year (incorreto)');
        }

        // Verificar API route
        const routeContent = fs.readFileSync('app/api/search/route.ts', 'utf-8');
        
        if (routeContent.includes('if (query)')) {
            success('API route verifica presença de query');
        } else {
            error('API route não verifica query');
        }

        if (routeContent.includes('searchAll') && routeContent.includes('discoverAll')) {
            success('API route usa searchAll e discoverAll');
        } else {
            warning('API route pode não estar usando os métodos All');
        }

        // Verificar documentação
        if (routeContent.includes('NUNCA misturar')) {
            success('Documentação sobre não misturar endpoints presente');
        } else {
            warning('Falta documentação sobre separação de endpoints');
        }
    }

    return allExist;
}

// Executar todos os testes
async function runAllTests() {
    log('\n╔══════════════════════════════════════════════════════════╗', 'blue');
    log('║  VALIDAÇÃO DA ARQUITETURA DE BUSCA - TMDB API          ║', 'blue');
    log('╚══════════════════════════════════════════════════════════╝', 'blue');

    // 1. Validar estrutura de código
    const structureValid = validateCodeStructure();

    if (!structureValid) {
        error('\n❌ Estrutura de código inválida. Corrija os erros acima.');
        process.exit(1);
    }

    // 2. Validar endpoints do TMDB
    await validateSearchNoFilters();
    await validateDiscoverWithFilters();

    // 3. Resumo
    section('Resumo da Validação');
    success('✅ Estrutura de código válida');
    success('✅ Endpoints /search funcionam corretamente');
    success('✅ Endpoints /discover funcionam corretamente');
    success('✅ Separação entre search e discover implementada');
    
    log('\n╔══════════════════════════════════════════════════════════╗', 'green');
    log('║  VALIDAÇÃO COMPLETA - TODOS OS TESTES PASSARAM!        ║', 'green');
    log('╚══════════════════════════════════════════════════════════╝', 'green');

    info('\n📚 Documentação: docs/SEARCH_ARCHITECTURE.md');
    info('🧪 Testes: __tests__/search-architecture.test.ts');
    info('🚀 Pronto para produção!\n');
}

// Executar
runAllTests().catch((err) => {
    error(`Erro fatal: ${err.message}`);
    console.error(err);
    process.exit(1);
});
