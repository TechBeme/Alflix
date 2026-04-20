// Carrega variáveis de ambiente do .env.local antes dos testes
require('dotenv').config({ path: '.env.local' });

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!(better-auth|@better-auth)/)',
    ],
};
