# 💳 Guía de Integración de Pasarela de Pago

> **Versión:** 1.0.0  
> **Última Actualización:** 8 de Febrero, 2026  
> **Idiomas:** [English](./PAYMENT_SETUP.md) | [Português](./PAYMENT_SETUP.pt-BR.md) | [Español](./PAYMENT_SETUP.es.md)

## 📋 Tabla de Contenidos

1. [Resumen](#resumen)
2. [Arquitectura](#arquitectura)
3. [Inicio Rápido](#inicio-rápido)
4. [Variables de Entorno](#variables-de-entorno)
5. [Creando Tu Pasarela de Pago](#creando-tu-pasarela-de-pago)
6. [Endpoints de API](#endpoints-de-api)
7. [Implementación de Webhook](#implementación-de-webhook)
8. [Pruebas](#pruebas)
9. [Lista de Verificación de Producción](#lista-de-verificación-de-producción)
10. [Ejemplos](#ejemplos)

---

## Resumen

AllflixLive utiliza una **arquitectura de pago modular** que permite integrar cualquier pasarela de pago (Stripe, MercadoPago, PayPal, etc.) sin modificar el código principal de la aplicación.

### Cómo Funciona

```
Usuario hace clic en "Suscribirse"
    ↓
POST /api/payment/checkout/create (AllflixLive)
    ↓
POST {TU_PASARELA_DE_PAGO} (Tu Servidor)
    ↓
Devuelve checkoutUrl
    ↓
Usuario redirigido a página de pago
    ↓
Después del pago: notificación via webhook
    ↓
POST /api/webhooks/payment (AllflixLive)
    ↓
Plan del usuario actualizado
```

### Características Principales

- ✅ **Cero cambios en el código** - Configura solo mediante variables de entorno
- ✅ **Seguro** - URLs definidas en el backend, nunca desde el cliente
- ✅ **Simple** - Payload mínimo (solo `planId`, `successUrl`, `cancelUrl`)
- ✅ **Flexible** - Funciona con cualquier pasarela de pago

---

## Arquitectura

### Diagrama de Flujo de Pago

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
│  - Valida autenticación              │
│  - Verifica si el plan existe        │
│  - Define URLs de éxito/cancelar     │
└──────┬───────────────────────────────┘
       │ 2. POST {PAYMENT_CHECKOUT_URL}
       │    Body: { planId, successUrl, cancelUrl, webhookUrl }
       ↓
┌──────────────────────────────────────┐
│  Servidor de Tu Pasarela             │
│  - Recibe información del plan       │
│  - Crea sesión de checkout           │
│  - Devuelve URL de checkout          │
└──────┬───────────────────────────────┘
       │ 3. Devuelve { checkoutUrl: "..." }
       ↓
┌─────────────┐
│   Frontend  │
│  Redirige al│
│   checkout  │
└──────┬──────┘
       │ 4. Usuario completa el pago
       ↓
┌──────────────────────────────────────┐
│  Pasarela de Pago                    │
│  - Procesa el pago                   │
│  - Envía notificación webhook        │
└──────┬───────────────────────────────┘
       │ 5. POST /api/webhooks/payment
       │    Body: { type, userId, planId, transactionId }
       ↓
┌──────────────────────────────────────┐
│  Manejador de Webhook (AllflixLive)     │
│  - Actualiza plan del usuario en BD  │
│  - Devuelve 200 OK                   │
└──────────────────────────────────────┘
```

---

## Inicio Rápido

### Paso 1: Prueba con el Ejemplo Integrado

AllflixLive viene con un checkout de ejemplo integrado para pruebas.

**`.env.local`:**
```bash
# Dejar vacío para usar el checkout de ejemplo
PAYMENT_CHECKOUT_URL=""
```

Visita: `http://localhost:3000/payment/checkout/example`

### Paso 2: Crea Tu Servidor de Pasarela de Pago

Necesitas crear un servidor que:
1. Reciba solicitudes de checkout de AllflixLive
2. Integre con tu pasarela de pago elegida (Stripe, MercadoPago, etc.)
3. Devuelva una URL de checkout
4. Envíe notificaciones webhook después del pago

### Paso 3: Configura las Variables de Entorno

**`.env.local`:**
```bash
PAYMENT_CHECKOUT_URL="https://tu-pasarela.com/crear-checkout"
PAYMENT_API_TOKEN="tu_token_secreto"
```

---

## Variables de Entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|----------|-------------|-------------|---------|
| `PAYMENT_CHECKOUT_URL` | ✅ Sí | Endpoint de tu pasarela de pago | `https://api.ejemplo.com/checkout` |
| `PAYMENT_API_TOKEN` | ⚠️ Recomendado | Token de autenticación para solicitudes de checkout | `sk_live_abc123...` |
| `PAYMENT_WEBHOOK_SECRET` | ✅ Sí (Producción) | Secreto para autenticación de webhook | `openssl rand -hex 32` |
| `PAYMENT_WEBHOOK_RELAY_URL` | ❌ Opcional | Reenviar webhooks a otro servicio | `https://analytics.ejemplo.com/eventos` |
| `NEXT_PUBLIC_APP_URL` | ✅ Sí | URL de tu aplicación (para callbacks) | `https://tudominio.com` |

> **⚠️ IMPORTANTE**: `PAYMENT_WEBHOOK_SECRET` es **OBLIGATORIO** cuando `PAYMENT_CHECKOUT_URL` está configurado. La aplicación no iniciará sin él en modo de producción.
### Ejemplo: Node.js + Stripe

**`tu-servidor-pasarela.js`:**
```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());

// Endpoint de checkout
app.post('/crear-checkout', async (req, res) => {
  try {
    const { planId, successUrl, cancelUrl, webhookUrl } = req.body;

    // Obtener detalles del plan de tu base de datos
    const plan = await obtenerPlanPorId(planId);

    // Crear sesión de checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
          },
          unit_amount: plan.priceMonthly * 100, // centavos
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

    // Devolver URL de checkout
    res.json({
      checkoutUrl: session.url
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manejador de webhook de Stripe
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Error en Webhook: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Enviar webhook a AllflixLive con autenticación
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

app.listen(3001, () => console.log('Pasarela ejecutándose en puerto 3001'));
```

### Ejemplo: Python + MercadoPago

**`pasarela.py`:**
```python
from flask import Flask, request, jsonify
import mercadopago
import os

app = Flask(__name__)
mp = mercadopago.SDK(os.getenv("MERCADOPAGO_ACCESS_TOKEN"))

@app.route('/crear-checkout', methods=['POST'])
def crear_checkout():
    data = request.json
    plan_id = data['planId']
    success_url = data['successUrl']
    cancel_url = data['cancelUrl']
    webhook_url = data['webhookUrl']
    
    # Obtener detalles del plan
    plan = obtener_plan_por_id(plan_id)
    
    # Crear preferencia
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
            # Enviar a AllflixLive
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

## Endpoints de API

### POST `/api/payment/checkout/create`

**Solicitud:**
```typescript
POST /api/payment/checkout/create
Headers: {
  Cookie: "session_token=..." // Sesión Better Auth
}
Body: {
  "planId": "plan_individual"
}
```

**Respuesta (Éxito):**
```typescript
200 OK
{
  "checkoutUrl": "https://stripe.com/checkout/abc123"
}
```

**Respuesta (Error):**
```typescript
400/404/500
{
  "error": "Mensaje de error"
}
```

### POST `/api/webhooks/payment`

**Solicitud:**
```typescript
POST /api/webhooks/payment
Body: {
  "type": "payment.succeeded",
  "userId": "user_123",
  "planId": "plan_individual",
  "transactionId": "txn_abc123"
}
```

**Respuesta:**
```typescript
200 OK
{
  "message": "Webhook procesado exitosamente"
}
```

---

## Implementación de Webhook

### Campos Obligatorios

Tu pasarela de pago DEBE enviar estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `type` | string | Tipo de evento: `"payment.succeeded"` |
| `userId` | string | ID del usuario AllflixLive |
| `planId` | string | ID del plan de la base de datos |
| `transactionId` | string | ID único de la transacción |

### Tipos de Evento

- `payment.succeeded` - Pago completado exitosamente
- `payment.failed` - Pago falló
- `payment.canceled` - Usuario canceló el pago
- `payment.refunded` - Pago fue reembolsado

### Mejores Prácticas de Seguridad

1. **Siempre valida firmas de webhook** (si tu pasarela lo soporta)
2. **Usa HTTPS** para URLs de webhook
3. **Implementa idempotencia** - AllflixLive lo maneja automáticamente
4. **Almacena IDs de transacción** para reconciliación

---

## Pruebas

### Usando el Ejemplo Integrado

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Visita la página de configuración:**
   ```
   http://localhost:3000/settings?section=plan
   ```

3. **Haz clic en "Cambiar Plan"** y selecciona un plan

4. **Serás redirigido al checkout de ejemplo:**
   ```
   http://localhost:3000/payment/checkout/example?plan=plan_individual
   ```

5. **Haz clic en "Completar Pago"** para simular éxito

6. **Verifica que tu plan fue actualizado** en la base de datos

### Probando Tu Pasarela

1. **Define la URL de tu pasarela:**
   ```bash
   PAYMENT_CHECKOUT_URL="http://localhost:3001/crear-checkout"
   ```

2. **Usa ngrok para webhooks:**
   ```bash
   ngrok http 3000
   ```

3. **Actualiza NEXT_PUBLIC_APP_URL:**
   ```bash
   NEXT_PUBLIC_APP_URL="https://tu-url-ngrok.ngrok.io"
   ```

4. **Prueba el flujo completo** con pasarela de pago real

---

## Lista de Verificación de Producción

- [ ] Configurar `PAYMENT_CHECKOUT_URL` con URL de producción
- [ ] Definir `PAYMENT_API_TOKEN` seguro
- [ ] Usar HTTPS para todas las URLs
- [ ] Probar entrega de webhook
- [ ] Implementar validación de firma de webhook
- [ ] Configurar monitoreo/logging
- [ ] Probar con pasarela de pago real (modo sandbox)
- [ ] Configurar lógica de reintento de webhook (lado de la pasarela)
- [ ] Configurar alertas de error
- [ ] Documentar configuración de tu pasarela

---

## Ejemplos

### Pasarela Mínima (Prueba)

```javascript
// pasarela-minima.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/crear-checkout', (req, res) => {
  const { planId, successUrl } = req.body;
  
  // Devuelve URL de checkout falsa (solo para prueba)
  res.json({
    checkoutUrl: `http://localhost:3000/payment/checkout/example?plan=${planId}`
  });
});

app.listen(3001);
```

### Integración Stripe

Ver [Documentación Stripe Checkout](https://stripe.com/docs/checkout)

### Integración MercadoPago

Ver [Documentación API MercadoPago](https://www.mercadopago.com/developers/es/docs)

### Integración PayPal

Ver [Documentación PayPal Checkout](https://developer.paypal.com/docs/checkout/)

---

## Solución de Problemas

### "Sistema de pago no configurado"

**Solución:** Define `PAYMENT_CHECKOUT_URL` en `.env.local`

### "Plan no encontrado o inactivo"

**Solución:** Ejecuta `npx tsx prisma/seed.ts` para crear los planes

### Webhook no recibido

**Soluciones:**
1. Verifica que `webhookUrl` sea públicamente accesible
2. Verifica que tu pasarela esté enviando webhooks
3. Verifica logs de webhook en el panel de tu pasarela
4. Usa ngrok para prueba local

### Plan del usuario no actualizado

**Soluciones:**
1. Verifica que el payload del webhook tenga todos los campos obligatorios
2. Verifica que `userId` y `planId` existan en la base de datos
3. Verifica logs de la aplicación para errores

---

## Soporte

- **GitHub Issues:** [Reportar un error](https://github.com/tuusuario/allflix/issues)
- **Discusiones:** [Hacer preguntas](https://github.com/tuusuario/allflix/discussions)
- **Wiki:** [Navegar documentación](https://github.com/tuusuario/allflix/wiki)

---

**Hecho con ❤️ por el Equipo AllflixLive**
