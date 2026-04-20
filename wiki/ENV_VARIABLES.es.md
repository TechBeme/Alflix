# Variables de Entorno

Todas las variables de entorno utilizadas por AllflixLive y su propósito.

> Copia `.env.example` a `.env.local` y completa tus valores antes de ejecutar la aplicación.

## Referencia Rápida

| Variable | Requerida | Default |
|---|---|---|
| `DATABASE_URL` | ✅ (una de dos) | — |
| `POSTGRES_PRISMA_URL` | ✅ (una de dos) | — |
| `NEXT_PUBLIC_SITE_NAME` | No | `ALLFLIX` |
| `NEXT_PUBLIC_SITE_NAME_SUFFIX` | No | *(vacío)* |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | `live@allflix.dev` |
| `NEXT_PUBLIC_APP_URL` | No | `https://live.allflix.dev` |
| `BETTER_AUTH_SECRET` | ✅ | — |
| `RESEND_API_KEY` | Producción | — |
| `EMAIL_FROM` | No | `SITE_NAME <noreply@host>` |
| `TMDB_API_KEY` | ✅ | — |
| `TMDB_API_URL` | No | `https://api.themoviedb.org/3` |
| `STREAMING_API_URL` | Producción | — |
| `STREAMING_API_TOKEN` | Producción | — |
| `PAYMENT_CHECKOUT_URL` | Producción | — |
| `PAYMENT_API_TOKEN` | Producción | — |
| `PAYMENT_WEBHOOK_SECRET` | Con checkout | — |
| `PAYMENT_WEBHOOK_RELAY_URL` | No | — |
| `CRON_SECRET` | Producción | — |
| `ADMIN_SECRET` | Producción | — |

---

## Base de Datos

### `DATABASE_URL`
Cadena de conexión PostgreSQL usada por Prisma. Al menos una de `DATABASE_URL` o `POSTGRES_PRISMA_URL` debe estar configurada.

```
postgresql://user:password@localhost:5432/database
```

### `POSTGRES_PRISMA_URL`
URL alternativa de base de datos — tiene prioridad sobre `DATABASE_URL`. Proporcionada automáticamente por Vercel Postgres y proveedores similares.

---

## Sitio

### `NEXT_PUBLIC_SITE_NAME`
Nombre de la aplicación mostrado en metadatos, emails y UI. Permite personalización de marca (white-labeling).
**Default:** `ALLFLIX`

### `NEXT_PUBLIC_SITE_NAME_SUFFIX`
Sufijo opcional mostrado en un color diferente junto al nombre del sitio. Ejemplo: name=`ALLFLIX` + suffix=`LIVE` → logo bicolor.
**Default:** *(vacío)*

### `NEXT_PUBLIC_CONTACT_EMAIL`
Mostrado en el footer, formularios de contacto y emails del sistema.
**Default:** `live@allflix.dev`

### `NEXT_PUBLIC_APP_URL`
URL base de la aplicación. Usada como fallback cuando `VERCEL_URL` no está disponible.
**Default:** `https://live.allflix.dev`

---

## Autenticación

### `BETTER_AUTH_SECRET`
Clave secreta para encriptación de sesiones de Better Auth. **Requerida — la app no inicia sin ella.**

Generar:
```bash
openssl rand -base64 32
```

---

## Email

### `RESEND_API_KEY`
Clave API de [Resend](https://resend.com/api-keys) para enviar emails de verificación OTP. En desarrollo sin esta clave, los emails se imprimen en consola.

### `EMAIL_FROM`
Dirección de remitente para emails salientes. Debe corresponder a un dominio verificado en Resend.
**Default:** `SITE_NAME <noreply@APP_HOST>`

```
ALLFLIX <noreply@tudominio.com>
```

---

## TMDB API

### `TMDB_API_KEY`
Clave API server-side para [The Movie Database](https://www.themoviedb.org/settings/api). **Requerida — la app no inicia sin ella.** Nunca se expone al cliente.

### `TMDB_API_URL`
URL base para solicitudes a la API de TMDB.
**Default:** `https://api.themoviedb.org/3`

---

## Streaming API

### `STREAMING_API_URL`
URL del backend externo que resuelve IDs de TMDB en URLs de video reproducibles. En desarrollo, dejar vacío para usar la ruta de ejemplo integrada en `/api/streaming/example`.

### `STREAMING_API_TOKEN`
Token de autenticación enviado al backend de streaming. Mantener en secreto.

---

## Pagos

> Guía completa: [Configuración de Pagos](./PAYMENT_SETUP.es.md)

### `PAYMENT_CHECKOUT_URL`
Endpoint del gateway de pago externo que crea sesiones de checkout. Dejar vacío en desarrollo para usar la página de prueba integrada en `/api/payment/checkout/example`.

Ejemplos:
```
https://tu-backend.com/create-stripe-checkout
https://tu-backend.com/create-mercadopago-preference
```

### `PAYMENT_API_TOKEN`
Token Bearer enviado al endpoint de checkout para autenticación.

Generar:
```bash
openssl rand -base64 32
```

### `PAYMENT_WEBHOOK_SECRET`
Secreto usado para verificar firmas de webhooks del gateway de pago. **Requerido cuando `PAYMENT_CHECKOUT_URL` está configurado** (y viceversa).

Generar:
```bash
openssl rand -hex 32
```

### `PAYMENT_WEBHOOK_RELAY_URL`
URL opcional para reenviar eventos de webhook procesados a otro servicio (analytics, logging, etc.).

---

## Admin & Cron

### `CRON_SECRET`
Autentica solicitudes de Vercel Cron Jobs. Vercel envía `Authorization: Bearer <CRON_SECRET>` automáticamente.

**Protege:** `/api/cron/expire-trials`, `/api/cron/expire-invites`, `/api/cron/warm-cache`

Generar:
```bash
openssl rand -base64 32
```

### `ADMIN_SECRET`
Autentica solicitudes a APIs internas de administración.

**Protege:** `/api/health/tmdb`, `/api/metrics/cache`, `/api/revalidate`

Generar:
```bash
openssl rand -base64 32
```
