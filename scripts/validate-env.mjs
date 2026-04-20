#!/usr/bin/env node

/**
 * Pre-build environment validation. Runs once before `next build`.
 * Exit 1 = critical vars missing (build breaks). Exit 0 = ok or warnings only.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env files in order of precedence
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const has = (k) => (process.env[k]?.trim() || '').length > 0;
const isProduction = process.env.NODE_ENV === 'production';
let failed = false;

// ── Critical (build fails without these) ───────────────────────────────────

for (const k of ['BETTER_AUTH_SECRET', 'TMDB_API_KEY']) {
  if (!has(k)) {
    console.error(`❌ ERROR: ${k} is not configured. Build cannot continue.`);
    failed = true;
  }
}

if (!has('POSTGRES_PRISMA_URL') && !has('DATABASE_URL')) {
  console.error('❌ ERROR: POSTGRES_PRISMA_URL or DATABASE_URL is not configured. Build cannot continue.');
  failed = true;
}

// Payment consistency: if one is set, the other must be too
if (has('PAYMENT_CHECKOUT_URL') && !has('PAYMENT_WEBHOOK_SECRET')) {
  console.error('❌ ERROR: PAYMENT_WEBHOOK_SECRET is required when PAYMENT_CHECKOUT_URL is set.');
  failed = true;
}
if (has('PAYMENT_WEBHOOK_SECRET') && !has('PAYMENT_CHECKOUT_URL')) {
  console.error('❌ ERROR: PAYMENT_CHECKOUT_URL is required when PAYMENT_WEBHOOK_SECRET is set.');
  failed = true;
}

// ── Important (app works without, but features are degraded) ───────────────

for (const k of ['RESEND_API_KEY', 'STREAMING_API_URL', 'STREAMING_API_TOKEN', 'PAYMENT_CHECKOUT_URL', 'PAYMENT_API_TOKEN', 'PAYMENT_WEBHOOK_SECRET']) {
  if (!has(k)) console.warn(`⚠️  WARN: ${k} is not configured.`);
}

if (isProduction) {
  for (const k of ['CRON_SECRET', 'ADMIN_SECRET']) {
    if (!has(k)) console.warn(`⚠️  WARN: ${k} is not configured.`);
  }
}

// ── Cosmetic / have defaults (just FYI) ────────────────────────────────────

for (const k of ['NEXT_PUBLIC_SITE_NAME', 'NEXT_PUBLIC_CONTACT_EMAIL', 'NEXT_PUBLIC_APP_URL', 'EMAIL_FROM', 'TMDB_API_URL']) {
  if (!has(k)) console.info(`ℹ️  INFO: ${k} is not configured, using default.`);
}

// ── Exit ───────────────────────────────────────────────────────────────────

if (failed) process.exit(1);
