# 💳 Payment Gateway Integration Guide

> **Version:** 1.0.0  
> **Last Updated:** February 8, 2026  
> **Languages:** [English](./PAYMENT_SETUP.md) | [Português](./PAYMENT_SETUP.pt-BR.md) | [Español](./PAYMENT_SETUP.es.md)

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Environment Variables](#environment-variables)
5. [Creating Your Payment Gateway](#creating-your-payment-gateway)
6. [API Endpoints](#api-endpoints)
7. [Webhook Implementation](#webhook-implementation)
8. [Testing](#testing)
9. [Production Checklist](#production-checklist)
10. [Examples](#examples)

---

## Overview

AllflixLive uses a **modular payment architecture** that allows you to integrate any payment gateway (Stripe, MercadoPago, PayPal, etc.) without modifying the core application code.

### How It Works

```
User clicks "Subscribe"
    ↓
POST /api/payment/checkout/create (AllflixLive)
    ↓
POST {YOUR_PAYMENT_GATEWAY} (Your Server)
    ↓
Returns checkoutUrl
    ↓
User redirected to payment page
    ↓
After payment: webhook notification
    ↓
POST /api/webhooks/payment (AllflixLive)
    ↓
User plan updated
```

### Key Features

- ✅ **Zero code changes** - Configure via environment variables only
- ✅ **Secure** - URLs defined on backend, never from client
- ✅ **Simple** - Minimal payload (only `planId`, `successUrl`, `cancelUrl`)
- ✅ **Flexible** - Works with any payment gateway

---

## Architecture

### Payment Flow Diagram

```
┌─────────────┐
│   Frontend  │
│  (AllflixLive) │
└──────┬──────┘
       │ 1. POST /api/payment/checkout/create
       │    Body: { planId: "plan_xxx" }
       ↓
┌──────────────────────────────────────┐
│  Backend API (AllflixLive)              │
│  - Validates authentication          │
│  - Checks plan exists                │
│  - Defines success/cancel URLs       │
└──────┬───────────────────────────────┘
       │ 2. POST {PAYMENT_CHECKOUT_URL}
       │    Body: { planId, successUrl, cancelUrl, webhookUrl }
       ↓
┌──────────────────────────────────────┐
│  Your Payment Gateway Server         │
│  - Receives plan information         │
│  - Creates checkout session          │
│  - Returns checkout URL              │
└──────┬───────────────────────────────┘
       │ 3. Returns { checkoutUrl: "..." }
       ↓
┌─────────────┐
│   Frontend  │
│  Redirects  │
│  to checkout│
└──────┬──────┘
       │ 4. User completes payment
       ↓
┌──────────────────────────────────────┐
│  Payment Gateway                     │
│  - Processes payment                 │
│  - Sends webhook notification        │
└──────┬───────────────────────────────┘
       │ 5. POST /api/webhooks/payment
       │    Body: { type, userId, planId, transactionId }
       ↓
┌──────────────────────────────────────┐
│  Webhook Handler (AllflixLive)          │
│  - Updates user plan in database     │
│  - Returns 200 OK                    │
└──────────────────────────────────────┘
```

---

## Quick Start

### Step 1: Test with Built-in Example

AllflixLive comes with a built-in example checkout for testing.

**`.env.local`:**
```bash
# Leave empty to use example checkout
PAYMENT_CHECKOUT_URL=""
```

Visit: `http://localhost:3000/payment/checkout/example`

### Step 2: Create Your Payment Gateway Server

You need to create a server that:
1. Receives checkout requests from AllflixLive
2. Integrates with your chosen payment gateway (Stripe, MercadoPago, etc.)
3. Returns a checkout URL
4. Sends webhook notifications after payment

### Step 3: Configure Environment Variables

**`.env.local`:**
```bash
PAYMENT_CHECKOUT_URL="https://your-gateway.com/create-checkout"
PAYMENT_API_TOKEN="your_secret_token"
```

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PAYMENT_CHECKOUT_URL` | ✅ Yes | Your payment gateway endpoint | `https://api.example.com/checkout` |
| `PAYMENT_API_TOKEN` | ⚠️ Recommended | Authentication token for checkout requests | `sk_live_abc123...` |
| `PAYMENT_WEBHOOK_SECRET` | ✅ Yes (Production) | Secret for webhook authentication | `openssl rand -hex 32` |
| `PAYMENT_WEBHOOK_RELAY_URL` | ❌ Optional | Forward webhooks to another service | `https://analytics.example.com/events` |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Your app URL (for callbacks) | `https://yourdomain.com` |

> **⚠️ IMPORTANT**: `PAYMENT_WEBHOOK_SECRET` is **REQUIRED** when `PAYMENT_CHECKOUT_URL` is configured. The application will not start without it in production mode.
### Example: Node.js + Stripe

**`your-gateway-server.js`:**
```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());

// Checkout endpoint
app.post('/create-checkout', async (req, res) => {
  try {
    const { planId, successUrl, cancelUrl, webhookUrl } = req.body;

    // Get plan details from your database
    const plan = await getPlanbById(planId);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
          },
          unit_amount: plan.priceMonthly * 100, // cents
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

    // Return checkout URL
    res.json({
      checkoutUrl: session.url
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Send webhook to AllflixLive with authentication
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

app.listen(3001, () => console.log('Gateway running on port 3001'));
```

### Example: Python + MercadoPago

**`gateway.py`:**
```python
from flask import Flask, request, jsonify
import mercadopago

app = Flask(__name__)
mp = mercadopago.SDK(os.getenv("MERCADOPAGO_ACCESS_TOKEN"))

@app.route('/create-checkout', methods=['POST'])
def create_checkout():
    data = request.json
    plan_id = data['planId']
    success_url = data['successUrl']
    cancel_url = data['cancelUrl']
    webhook_url = data['webhookUrl']
    
    # Get plan details
    plan = get_plan_by_id(plan_id)
    
    # Create preference
    preference_data = {
        "items": [{
            "title": plan['name'],
            "quantity": 1,
            "unit_price": plan['priceMonthly']
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
            # Send to AllflixLive
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

## API Endpoints

### POST `/api/payment/checkout/create`

**Request:**
```typescript
POST /api/payment/checkout/create
Headers: {
  Cookie: "session_token=..." // Better Auth session
}
Body: {
  "planId": "plan_individual"
}
```

**Response (Success):**
```typescript
200 OK
{
  "checkoutUrl": "https://stripe.com/checkout/abc123"
}
```

**Response (Error):**
```typescript
400/404/500
{
  "error": "Error message"
}
```

### POST `/api/webhooks/payment`

**Request:**
```typescript
POST /api/webhooks/payment
Body: {
  "type": "payment.succeeded",
  "userId": "user_123",
  "planId": "plan_individual",
  "transactionId": "txn_abc123"
}
```

**Response:**
```typescript
200 OK
{
  "message": "Webhook processed successfully"
}
```

---

## Webhook Implementation

### Required Fields

Your payment gateway MUST send these fields:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Event type: `"payment.succeeded"` |
| `userId` | string | AllflixLive user ID |
| `planId` | string | Plan ID from database |
| `transactionId` | string | Unique transaction ID |

### Event Types

- `payment.succeeded` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.canceled` - User canceled payment
- `payment.refunded` - Payment was refunded

### Security Best Practices

1. **Always validate webhook signatures** (if your gateway supports it)
2. **Use HTTPS** for webhook URLs
3. **Implement idempotency** - AllflixLive handles this automatically
4. **Store transaction IDs** for reconciliation

---

## Testing

### Using the Built-in Example

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Visit settings page:**
   ```
   http://localhost:3000/settings?section=plan
   ```

3. **Click "Change Plan"** and select a plan

4. **You'll be redirected to the example checkout:**
   ```
   http://localhost:3000/payment/checkout/example?plan=plan_individual
   ```

5. **Click "Complete Payment"** to simulate success

6. **Check that your plan was updated** in the database

### Testing Your Gateway

1. **Set your gateway URL:**
   ```bash
   PAYMENT_CHECKOUT_URL="http://localhost:3001/create-checkout"
   ```

2. **Use ngrok for webhooks:**
   ```bash
   ngrok http 3000
   ```

3. **Update NEXT_PUBLIC_APP_URL:**
   ```bash
   NEXT_PUBLIC_APP_URL="https://your-ngrok-url.ngrok.io"
   ```

4. **Test full flow** with real payment gateway

---

## Production Checklist

- [ ] Configure `PAYMENT_CHECKOUT_URL` with production URL
- [ ] Set secure `PAYMENT_API_TOKEN`
- [ ] Use HTTPS for all URLs
- [ ] Test webhook delivery
- [ ] Implement webhook signature validation
- [ ] Set up monitoring/logging
- [ ] Test with real payment gateway (sandbox mode)
- [ ] Configure webhook retry logic (gateway-side)
- [ ] Set up error alerting
- [ ] Document your gateway setup

---

## Examples

### Minimal Gateway (Testing)

```javascript
// minimal-gateway.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/create-checkout', (req, res) => {
  const { planId, successUrl } = req.body;
  
  // Return a fake checkout URL (for testing only)
  res.json({
    checkoutUrl: `http://localhost:3000/payment/checkout/example?plan=${planId}`
  });
});

app.listen(3001);
```

### Stripe Integration

See [Stripe Checkout Documentation](https://stripe.com/docs/checkout)

### MercadoPago Integration

See [MercadoPago API Documentation](https://www.mercadopago.com/developers/en/docs)

### PayPal Integration

See [PayPal Checkout Documentation](https://developer.paypal.com/docs/checkout/)

---

## Troubleshooting

### "Payment system not configured"

**Solution:** Set `PAYMENT_CHECKOUT_URL` in `.env.local`

### "Plan not found or inactive"

**Solution:** Run `npx tsx prisma/seed.ts` to create plans

### Webhook not received

**Solutions:**
1. Check that `webhookUrl` is publicly accessible
2. Verify your gateway is sending webhooks
3. Check webhook logs in your gateway dashboard
4. Use ngrok for local testing

### User plan not updated

**Solutions:**
1. Check webhook payload has all required fields
2. Verify `userId` and `planId` exist in database
3. Check application logs for errors

---

## Support

- **GitHub Issues:** [Report a bug](https://github.com/yourusername/allflix/issues)
- **Discussions:** [Ask questions](https://github.com/yourusername/allflix/discussions)
- **Wiki:** [Browse documentation](https://github.com/yourusername/allflix/wiki)

---

**Made with ❤️ by the AllflixLive Team**
