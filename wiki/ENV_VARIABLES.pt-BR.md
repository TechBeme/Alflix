# Variáveis de Ambiente

Todas as variáveis de ambiente usadas pelo AllflixLive e seus propósitos.

> Copie `.env.example` para `.env.local` e preencha seus valores antes de rodar a aplicação.

## Referência Rápida

| Variável | Obrigatória | Default |
|---|---|---|
| `DATABASE_URL` | ✅ (uma das duas) | — |
| `POSTGRES_PRISMA_URL` | ✅ (uma das duas) | — |
| `NEXT_PUBLIC_SITE_NAME` | Não | `ALLFLIX` |
| `NEXT_PUBLIC_SITE_NAME_SUFFIX` | Não | *(vazio)* |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Não | `live@allflix.dev` |
| `NEXT_PUBLIC_APP_URL` | Não | `https://live.allflix.dev` |
| `BETTER_AUTH_SECRET` | ✅ | — |
| `RESEND_API_KEY` | Produção | — |
| `EMAIL_FROM` | Não | `SITE_NAME <noreply@host>` |
| `TMDB_API_KEY` | ✅ | — |
| `TMDB_API_URL` | Não | `https://api.themoviedb.org/3` |
| `STREAMING_API_URL` | Produção | — |
| `STREAMING_API_TOKEN` | Produção | — |
| `PAYMENT_CHECKOUT_URL` | Produção | — |
| `PAYMENT_API_TOKEN` | Produção | — |
| `PAYMENT_WEBHOOK_SECRET` | Com checkout | — |
| `PAYMENT_WEBHOOK_RELAY_URL` | Não | — |
| `CRON_SECRET` | Produção | — |
| `ADMIN_SECRET` | Produção | — |

---

## Banco de Dados

### `DATABASE_URL`
String de conexão PostgreSQL usada pelo Prisma. Pelo menos uma entre `DATABASE_URL` ou `POSTGRES_PRISMA_URL` deve estar configurada.

```
postgresql://user:password@localhost:5432/database
```

### `POSTGRES_PRISMA_URL`
URL alternativa de banco de dados — tem prioridade sobre `DATABASE_URL`. Fornecida automaticamente pelo Vercel Postgres e provedores similares.

---

## Site

### `NEXT_PUBLIC_SITE_NAME`
Nome da aplicação exibido em metadados, emails e UI. Permite white-labeling.
**Default:** `ALLFLIX`

### `NEXT_PUBLIC_SITE_NAME_SUFFIX`
Sufixo opcional exibido em cor diferente ao lado do nome do site. Exemplo: name=`ALLFLIX` + suffix=`LIVE` → logo bicolor.
**Default:** *(vazio)*

### `NEXT_PUBLIC_CONTACT_EMAIL`
Exibido no footer, formulários de contato e emails do sistema.
**Default:** `live@allflix.dev`

### `NEXT_PUBLIC_APP_URL`
URL base da aplicação. Usada como fallback quando `VERCEL_URL` não está disponível.
**Default:** `https://live.allflix.dev`

---

## Autenticação

### `BETTER_AUTH_SECRET`
Chave secreta para criptografia de sessões do Better Auth. **Obrigatória — a app não inicia sem ela.**

Gerar:
```bash
openssl rand -base64 32
```

---

## Email

### `RESEND_API_KEY`
Chave API do [Resend](https://resend.com/api-keys) para envio de emails de verificação OTP. Em desenvolvimento sem esta chave, os emails são impressos no console.

### `EMAIL_FROM`
Endereço de remetente para emails enviados. Deve corresponder a um domínio verificado no Resend.
**Default:** `SITE_NAME <noreply@APP_HOST>`

```
ALLFLIX <noreply@seudominio.com>
```

---

## TMDB API

### `TMDB_API_KEY`
Chave API server-side para o [The Movie Database](https://www.themoviedb.org/settings/api). **Obrigatória — a app não inicia sem ela.** Nunca é exposta ao cliente.

### `TMDB_API_URL`
URL base para requisições à API do TMDB.
**Default:** `https://api.themoviedb.org/3`

---

## Streaming API

### `STREAMING_API_URL`
URL do backend externo que resolve IDs do TMDB em URLs de vídeo reproduzíveis. Em desenvolvimento, deixe vazio para usar a rota de exemplo embutida em `/api/streaming/example`.

### `STREAMING_API_TOKEN`
Token de autenticação enviado ao backend de streaming. Mantenha em segredo.

---

## Pagamento

> Guia completo: [Configuração de Pagamento](./PAYMENT_SETUP.pt-BR.md)

### `PAYMENT_CHECKOUT_URL`
Endpoint do gateway de pagamento externo que cria sessões de checkout. Deixe vazio em desenvolvimento para usar a página de teste embutida em `/api/payment/checkout/example`.

Exemplos:
```
https://seu-backend.com/create-stripe-checkout
https://seu-backend.com/create-mercadopago-preference
```

### `PAYMENT_API_TOKEN`
Token Bearer enviado ao endpoint de checkout para autenticação.

Gerar:
```bash
openssl rand -base64 32
```

### `PAYMENT_WEBHOOK_SECRET`
Segredo usado para verificar assinaturas de webhooks do gateway de pagamento. **Obrigatório quando `PAYMENT_CHECKOUT_URL` está configurado** (e vice-versa).

Gerar:
```bash
openssl rand -hex 32
```

### `PAYMENT_WEBHOOK_RELAY_URL`
URL opcional para encaminhar eventos de webhook processados para outro serviço (analytics, logging, etc.).

---

## Admin & Cron

### `CRON_SECRET`
Autentica requisições de Vercel Cron Jobs. O Vercel envia `Authorization: Bearer <CRON_SECRET>` automaticamente.

**Protege:** `/api/cron/expire-trials`, `/api/cron/expire-invites`, `/api/cron/warm-cache`

Gerar:
```bash
openssl rand -base64 32
```

### `ADMIN_SECRET`
Autentica requisições às APIs internas de administração.

**Protege:** `/api/health/tmdb`, `/api/metrics/cache`, `/api/revalidate`

Gerar:
```bash
openssl rand -base64 32
```
