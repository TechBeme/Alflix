# 💳 Guia de Integração de Gateway de Pagamento

> **Versão:** 1.0.0  
> **Última Atualização:** 8 de Fevereiro, 2026  
> **Idiomas:** [English](./PAYMENT_SETUP.md) | [Português](./PAYMENT_SETUP.pt-BR.md) | [Español](./PAYMENT_SETUP.es.md)

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Início Rápido](#início-rápido)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Criando Seu Gateway de Pagamento](#criando-seu-gateway-de-pagamento)
6. [Endpoints da API](#endpoints-da-api)
7. [Implementação de Webhook](#implementação-de-webhook)
8. [Testes](#testes)
9. [Checklist de Produção](#checklist-de-produção)
10. [Exemplos](#exemplos)

---

## Visão Geral

AllflixLive usa uma **arquitetura de pagamento modular** que permite integrar qualquer gateway de pagamento (Stripe, MercadoPago, PayPal, etc.) sem modificar o código principal da aplicação.

### Como Funciona

```
Usuário clica em "Assinar"
    ↓
POST /api/payment/checkout/create (AllflixLive)
    ↓
POST {SEU_GATEWAY_DE_PAGAMENTO} (Seu Servidor)
    ↓
Retorna checkoutUrl
    ↓
Usuário redirecionado para página de pagamento
    ↓
Após pagamento: notificação via webhook
    ↓
POST /api/webhooks/payment (AllflixLive)
    ↓
Plano do usuário atualizado
```

### Recursos Principais

- ✅ **Zero alterações no código** - Configure apenas via variáveis de ambiente
- ✅ **Seguro** - URLs definidas no backend, nunca do cliente
- ✅ **Simples** - Payload mínimo (apenas `planId`, `successUrl`, `cancelUrl`)
- ✅ **Flexível** - Funciona com qualquer gateway de pagamento

---

## Arquitetura

### Diagrama de Fluxo de Pagamento

```
┌─────────────┐
│   Frontend  │
│  (AllflixLive) │
└──────┬──────┘
       │ 1. POST /api/payment/checkout/create
       │    Body: { planId: "plan_xxx" }
       ↓
┌──────────────────────────────────────┐
│  API Backend (AllflixLive)              │
│  - Valida autenticação               │
│  - Verifica se plano existe          │
│  - Define URLs de sucesso/cancelar   │
└──────┬───────────────────────────────┘
       │ 2. POST {PAYMENT_CHECKOUT_URL}
       │    Body: { planId, successUrl, cancelUrl, webhookUrl }
       ↓
┌──────────────────────────────────────┐
│  Servidor do Seu Gateway             │
│  - Recebe informações do plano       │
│  - Cria sessão de checkout           │
│  - Retorna URL de checkout           │
└──────┬───────────────────────────────┘
       │ 3. Retorna { checkoutUrl: "..." }
       ↓
┌─────────────┐
│   Frontend  │
│  Redireciona│
│  ao checkout│
└──────┬──────┘
       │ 4. Usuário completa pagamento
       ↓
┌──────────────────────────────────────┐
│  Gateway de Pagamento                │
│  - Processa pagamento                │
│  - Envia notificação webhook         │
└──────┬───────────────────────────────┘
       │ 5. POST /api/webhooks/payment
       │    Body: { type, userId, planId, transactionId }
       ↓
┌──────────────────────────────────────┐
│  Manipulador de Webhook (AllflixLive)   │
│  - Atualiza plano do usuário no BD   │
│  - Retorna 200 OK                    │
└──────────────────────────────────────┘
```

---

## Início Rápido

### Passo 1: Teste com o Exemplo Integrado

AllflixLive vem com um checkout de exemplo integrado para testes.

**`.env.local`:**
```bash
# Deixe vazio para usar o checkout de exemplo
PAYMENT_CHECKOUT_URL=""
```

Visite: `http://localhost:3000/payment/checkout/example`

### Passo 2: Crie Seu Servidor de Gateway de Pagamento

Você precisa criar um servidor que:
1. Recebe requisições de checkout do AllflixLive
2. Integra com seu gateway de pagamento escolhido (Stripe, MercadoPago, etc.)
3. Retorna uma URL de checkout
4. Envia notificações webhook após o pagamento

### Passo 3: Configure as Variáveis de Ambiente

**`.env.local`:**
```bash
PAYMENT_CHECKOUT_URL="https://seu-gateway.com/criar-checkout"
PAYMENT_API_TOKEN="seu_token_secreto"
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `PAYMENT_CHECKOUT_URL` | ✅ Sim | Endpoint do seu gateway de pagamento | `https://api.exemplo.com/checkout` |
| `PAYMENT_API_TOKEN` | ⚠️ Recomendado | Token de autenticação para requisições de checkout | `sk_live_abc123...` |
| `PAYMENT_WEBHOOK_SECRET` | ✅ Sim (Produção) | Segredo para autenticação de webhook | `openssl rand -hex 32` |
| `PAYMENT_WEBHOOK_RELAY_URL` | ❌ Opcional | Encaminhar webhooks para outro serviço | `https://analytics.exemplo.com/eventos` |
| `NEXT_PUBLIC_APP_URL` | ✅ Sim | URL da sua aplicação (para callbacks) | `https://seudominio.com` |

> **⚠️ IMPORTANTE**: `PAYMENT_WEBHOOK_SECRET` é **OBRIGATÓRIO** quando `PAYMENT_CHECKOUT_URL` está configurado. A aplicação não iniciará sem ele em modo de produção.
### Exemplo: Node.js + Stripe

**`seu-servidor-gateway.js`:**
```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());

// Endpoint de checkout
app.post('/criar-checkout', async (req, res) => {
  try {
    const { planId, successUrl, cancelUrl, webhookUrl } = req.body;

    // Buscar detalhes do plano no seu banco de dados
    const plano = await buscarPlanoPorId(planId);

    // Criar sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: plano.name,
          },
          unit_amount: plano.priceMonthly * 100, // centavos
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planId: planId,
        webhookUrl: webhookUrl,
      },
    });

    // Retornar URL de checkout
    res.json({
      checkoutUrl: session.url
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manipulador de webhook do Stripe
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Erro no Webhook: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Enviar webhook para AllflixLive com autenticação
    await fetch(session.metadata.webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.PAYMENT_WEBHOOK_SECRET
      },
      body: JSON.stringify({
        type: 'payment.succeeded',
        userId: session.client_reference_id,
        planId: session.metadata.planId,
        transactionId: session.payment_intent,
      }),
    });
  }

  res.json({ received: true });
});

app.listen(3001, () => console.log('Gateway rodando na porta 3001'));
```

### Exemplo: Python + MercadoPago

**`gateway.py`:**
```python
from flask import Flask, request, jsonify
import mercadopago
import os

app = Flask(__name__)
mp = mercadopago.SDK(os.getenv("MERCADOPAGO_ACCESS_TOKEN"))

@app.route('/criar-checkout', methods=['POST'])
def criar_checkout():
    data = request.json
    plan_id = data['planId']
    success_url = data['successUrl']
    cancel_url = data['cancelUrl']
    webhook_url = data['webhookUrl']
    
    # Buscar detalhes do plano
    plano = buscar_plano_por_id(plan_id)
    
    # Criar preferência
    preference_data = {
        "items": [{
            "title": plano['name'],
            "quantity": 1,
            "unit_price": plano['priceMonthly']
        }],
        "back_urls": {
            "success": success_url,
            "failure": cancel_url,
            "pending": cancel_url
        },
        "auto_return": "approved",
        "metadata": {
            "plan_id": plan_id,
            "webhook_url": webhook_url
        }
    }
    
    preference = mp.preference().create(preference_data)
    
    return jsonify({
        "checkoutUrl": preference['response']['init_point']
    })

@app.route('/mercadopago-webhook', methods=['POST'])
def webhook():
    data = request.json
    
    if data['type'] == 'payment':
        payment_id = data['data']['id']
        payment_info = mp.payment().get(payment_id)
        
        if payment_info['status'] == 'approved':
            # Enviar para AllflixLive
            requests.post(
                payment_info['metadata']['webhook_url'],
                json={
                    'type': 'payment.succeeded',
                    'userId': payment_info['payer']['id'],
                    'planId': payment_info['metadata']['plan_id'],
                    'transactionId': payment_id
                }
            )
    
    return jsonify({'ok': True})

if __name__ == '__main__':
    app.run(port=3001)
```

---

## Endpoints da API

### POST `/api/payment/checkout/create`

**Requisição:**
```typescript
POST /api/payment/checkout/create
Headers: {
  Cookie: "session_token=..." // Sessão Better Auth
}
Body: {
  "planId": "plan_individual"
}
```

**Resposta (Sucesso):**
```typescript
200 OK
{
  "checkoutUrl": "https://stripe.com/checkout/abc123"
}
```

**Resposta (Erro):**
```typescript
400/404/500
{
  "error": "Mensagem de erro"
}
```

### POST `/api/webhooks/payment`

**Requisição:**
```typescript
POST /api/webhooks/payment
Body: {
  "type": "payment.succeeded",
  "userId": "user_123",
  "planId": "plan_individual",
  "transactionId": "txn_abc123"
}
```

**Resposta:**
```typescript
200 OK
{
  "message": "Webhook processado com sucesso"
}
```

---

## Implementação de Webhook

### Campos Obrigatórios

Seu gateway de pagamento DEVE enviar estes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | string | Tipo de evento: `"payment.succeeded"` |
| `userId` | string | ID do usuário AllflixLive |
| `planId` | string | ID do plano do banco de dados |
| `transactionId` | string | ID único da transação |

### Tipos de Evento

- `payment.succeeded` - Pagamento concluído com sucesso
- `payment.failed` - Pagamento falhou
- `payment.canceled` - Usuário cancelou o pagamento
- `payment.refunded` - Pagamento foi reembolsado

### Melhores Práticas de Segurança

1. **Sempre valide assinaturas de webhook** (se seu gateway suportar)
2. **Use HTTPS** para URLs de webhook
3. **Implemente idempotência** - AllflixLive trata isso automaticamente
4. **Armazene IDs de transação** para reconciliação

---

## Testes

### Usando o Exemplo Integrado

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Visite a página de configurações:**
   ```
   http://localhost:3000/settings?section=plan
   ```

3. **Clique em "Alterar Plano"** e selecione um plano

4. **Você será redirecionado para o checkout de exemplo:**
   ```
   http://localhost:3000/payment/checkout/example?plan=plan_individual
   ```

5. **Clique em "Concluir Pagamento"** para simular sucesso

6. **Verifique se seu plano foi atualizado** no banco de dados

### Testando Seu Gateway

1. **Defina a URL do seu gateway:**
   ```bash
   PAYMENT_CHECKOUT_URL="http://localhost:3001/criar-checkout"
   ```

2. **Use ngrok para webhooks:**
   ```bash
   ngrok http 3000
   ```

3. **Atualize NEXT_PUBLIC_APP_URL:**
   ```bash
   NEXT_PUBLIC_APP_URL="https://sua-url-ngrok.ngrok.io"
   ```

4. **Teste o fluxo completo** com gateway de pagamento real

---

## Checklist de Produção

- [ ] Configurar `PAYMENT_CHECKOUT_URL` com URL de produção
- [ ] Definir `PAYMENT_API_TOKEN` seguro
- [ ] Usar HTTPS para todas as URLs
- [ ] Testar entrega de webhook
- [ ] Implementar validação de assinatura de webhook
- [ ] Configurar monitoramento/logging
- [ ] Testar com gateway de pagamento real (modo sandbox)
- [ ] Configurar lógica de retry de webhook (lado do gateway)
- [ ] Configurar alertas de erro
- [ ] Documentar configuração do seu gateway

---

## Exemplos

### Gateway Mínimo (Teste)

```javascript
// gateway-minimo.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/criar-checkout', (req, res) => {
  const { planId, successUrl } = req.body;
  
  // Retorna URL de checkout falsa (apenas para teste)
  res.json({
    checkoutUrl: `http://localhost:3000/payment/checkout/example?plan=${planId}`
  });
});

app.listen(3001);
```

### Integração Stripe

Veja [Documentação Stripe Checkout](https://stripe.com/docs/checkout)

### Integração MercadoPago

Veja [Documentação API MercadoPago](https://www.mercadopago.com.br/developers/pt/docs)

### Integração PayPal

Veja [Documentação PayPal Checkout](https://developer.paypal.com/docs/checkout/)

---

## Solução de Problemas

### "Sistema de pagamento não configurado"

**Solução:** Defina `PAYMENT_CHECKOUT_URL` no `.env.local`

### "Plano não encontrado ou inativo"

**Solução:** Execute `npx tsx prisma/seed.ts` para criar os planos

### Webhook não recebido

**Soluções:**
1. Verifique se `webhookUrl` está publicamente acessível
2. Verifique se seu gateway está enviando webhooks
3. Verifique logs de webhook no painel do seu gateway
4. Use ngrok para teste local

### Plano do usuário não atualizado

**Soluções:**
1. Verifique se o payload do webhook tem todos os campos obrigatórios
2. Verifique se `userId` e `planId` existem no banco de dados
3. Verifique logs da aplicação para erros

---

## Suporte

- **GitHub Issues:** [Reportar um bug](https://github.com/seuusuario/allflix/issues)
- **Discussões:** [Fazer perguntas](https://github.com/seuusuario/allflix/discussions)
- **Wiki:** [Navegar documentação](https://github.com/seuusuario/allflix/wiki)

---

**Feito com ❤️ pelo Time AllflixLive**
