import "dotenv/config"
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// Valida variável de ambiente de banco de dados
let connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!connectionString || connectionString.trim() === '') {
  throw new Error(
    `❌ ERRO CRÍTICO: Variável de banco de dados não está configurada.\n` +
    `É necessário configurar POSTGRES_PRISMA_URL ou DATABASE_URL no arquivo .env.local.\n` +
    `O sistema não pode funcionar sem uma conexão com o banco de dados.`
  );
}

// 🔒 ENTERPRISE SECURITY: Força sslmode=verify-full independente da configuração do Neon
// Neon/Vercel podem configurar sslmode=require, mas queremos o modo mais seguro
// verify-full valida tanto o certificado quanto o hostname do servidor
// Ref: https://www.postgresql.org/docs/current/libpq-ssl.html
connectionString = connectionString.replace(/sslmode=(require|prefer|verify-ca)/g, 'sslmode=verify-full')
if (!connectionString.includes('sslmode=')) {
  connectionString += connectionString.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full'
}

const pool = new Pool({
  connectionString,
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: true, // Força validação SSL do lado do cliente
  }
})
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
