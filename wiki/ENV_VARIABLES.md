# Environment Variables

All environment variables used by AllflixLive and their purpose.

> Copy `.env.example` to `.env.local` and fill in your values before running the app.

## Quick Reference

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | ✅ (one of two) | — |
| `POSTGRES_PRISMA_URL` | ✅ (one of two) | — |
| `NEXT_PUBLIC_SITE_NAME` | No | `ALLFLIX` |
| `NEXT_PUBLIC_SITE_NAME_SUFFIX` | No | *(empty)* |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | `live@allflix.dev` |
| `NEXT_PUBLIC_APP_URL` | No | `https://live.allflix.dev` |
| `BETTER_AUTH_SECRET` | ✅ | — |
| `RESEND_API_KEY` | Production | — |
| `EMAIL_FROM` | No | `SITE_NAME <noreply@host>` |
| `TMDB_API_KEY` | ✅ | — |
| `TMDB_API_URL` | No | `https://api.themoviedb.org/3` |
| `STREAMING_API_URL` | Production | — |
| `STREAMING_API_TOKEN` | Production | — |
| `PAYMENT_CHECKOUT_URL` | Production | — |
| `PAYMENT_API_TOKEN` | Production | — |
| `PAYMENT_WEBHOOK_SECRET` | With checkout | — |
| `PAYMENT_WEBHOOK_RELAY_URL` | No | — |
| `CRON_SECRET` | Production | — |
| `ADMIN_SECRET` | Production | — |

---

## Database

### `DATABASE_URL`
PostgreSQL connection string used by Prisma. At least one of `DATABASE_URL` or `POSTGRES_PRISMA_URL` must be set.

```
postgresql://user:password@localhost:5432/database
```

### `POSTGRES_PRISMA_URL`
Alternative database URL — takes priority over `DATABASE_URL`. Automatically provided by Vercel Postgres and similar providers.

---

## Site

### `NEXT_PUBLIC_SITE_NAME`
Application name shown in metadata, emails, and UI. Enables white-labeling.
**Default:** `ALLFLIX`

### `NEXT_PUBLIC_SITE_NAME_SUFFIX`
Optional suffix displayed in a different color next to the site name. Example: name=`ALLFLIX` + suffix=`LIVE` → bicolor logo.
**Default:** *(empty)*

### `NEXT_PUBLIC_CONTACT_EMAIL`
Shown in footer, contact forms, and system emails.
**Default:** `live@allflix.dev`

### `NEXT_PUBLIC_APP_URL`
Base URL of the application. Used as fallback when `VERCEL_URL` is not available.
**Default:** `https://live.allflix.dev`

---

## Authentication

### `BETTER_AUTH_SECRET`
Secret key for Better Auth session encryption. **Required — app won't start without it.**

Generate:
```bash
openssl rand -base64 32
```

---

## Email

### `RESEND_API_KEY`
API key from [Resend](https://resend.com/api-keys) for sending OTP verification emails. In development without this key, emails are logged to console instead.

### `EMAIL_FROM`
Sender address for outgoing emails. Must match a verified domain in Resend.
**Default:** `SITE_NAME <noreply@APP_HOST>`

```
ALLFLIX <noreply@yourdomain.com>
```

---

## TMDB API

### `TMDB_API_KEY`
Server-side API key for [The Movie Database](https://www.themoviedb.org/settings/api). **Required — app won't start without it.** Never exposed to the client.

### `TMDB_API_URL`
Base URL for TMDB API requests.
**Default:** `https://api.themoviedb.org/3`

---

## Streaming API

### `STREAMING_API_URL`
URL of the external backend that resolves TMDB media IDs into playable video URLs. In development, leave empty to use the built-in example route at `/api/streaming/example`.

### `STREAMING_API_TOKEN`
Authentication token sent to the streaming backend. Keep secret.

---

## Payment

> Full setup guide: [Payment Setup](./PAYMENT_SETUP.md)

### `PAYMENT_CHECKOUT_URL`
External payment gateway endpoint that creates checkout sessions. Leave empty in development to use the built-in test page at `/api/payment/checkout/example`.

Examples:
```
https://your-backend.com/create-stripe-checkout
https://your-backend.com/create-mercadopago-preference
```

### `PAYMENT_API_TOKEN`
Bearer token sent to the checkout endpoint for authentication.

Generate:
```bash
openssl rand -base64 32
```

### `PAYMENT_WEBHOOK_SECRET`
Secret used to verify webhook signatures from the payment gateway. **Required when `PAYMENT_CHECKOUT_URL` is set** (and vice-versa).

Generate:
```bash
openssl rand -hex 32
```

### `PAYMENT_WEBHOOK_RELAY_URL`
Optional URL to forward processed webhook events to another service (analytics, logging, etc.).

---

## Admin & Cron

### `CRON_SECRET`
Authenticates Vercel Cron Job requests. Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

**Protects:** `/api/cron/expire-trials`, `/api/cron/expire-invites`, `/api/cron/warm-cache`

Generate:
```bash
openssl rand -base64 32
```

### `ADMIN_SECRET`
Authenticates internal admin API requests.

**Protects:** `/api/health/tmdb`, `/api/metrics/cache`, `/api/revalidate`

Generate:
```bash
openssl rand -base64 32
```
