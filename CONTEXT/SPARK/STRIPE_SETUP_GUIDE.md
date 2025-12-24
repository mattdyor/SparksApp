# Stripe Integration Setup Guide

To fully enable real payments for the **Tripod Spark**, you need to bridge the gap between our current "Mock Mode" and Stripe's actual infrastructure.

## 1. Stripe Dashboard Setup
1.  **Create Account**: Go to [dashboard.stripe.com](https://dashboard.stripe.com/register) and sign up.
2.  **Get API Keys**:
    *   Navigate to **Developers > API keys**.
    *   Copy the **Publishable Key** (starts with `pk_test_...`).
    *   Copy the **Secret Key** (starts with `sk_test_...`). **Keep this secret!** Never put it in the React Native app code.

## 2. Environment Configuration
Update your `.env` file (or creating one if needed) in the project root:
```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```
*Note: The `StripeProvider` in `App.tsx` is already set up to read this variable.*

## 3. The Backend Requirement (Critical)
Stripe requires a secure backend to generate a **PaymentIntent**. The mobile app cannot securely do this alone.

### Option A: Firebase Cloud Functions (Recommended)
If you are using Firebase, add a function:

```typescript
// functions/index.ts
const stripe = require('stripe')('sk_test_your_secret_key');

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 500, // $5.00 in cents
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  });

  return {
    clientSecret: paymentIntent.client_secret,
  };
});
```

### Option B: Simple Node/Express Server
For testing, you can run a local server:

```javascript
// server.js
const express = require('express');
const stripe = require('stripe')('sk_test_your_secret_key');
const app = express();

app.post('/create-payment-intent', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 500,
    currency: 'usd',
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## 4. Frontend Updates (`CheckoutPayment.tsx`)
We need to update `handlePay` to fetch the key from your backend instead of mocking success.

**Current (Mock):**
```typescript
// SIMULATION MODE
await new Promise(resolve => setTimeout(resolve, 2000));
const success = true;
```

**Required Change (Real):**
```typescript
// 1. Fetch Client Secret from your backend
const response = await fetch('YOUR_BACKEND_URL/createPaymentIntent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
const { clientSecret } = await response.json();

// 2. Confirm Payment with Stripe SDK
const { error } = await confirmPlatformPayPayment(clientSecret, {
  applePay: {
    cartItems: [{ label: 'Wolverine Tripod', amount: '5.00', paymentType: PlatformPay.PaymentType.Immediate }],
    merchantCountryCode: 'US',
    currencyCode: 'USD',
  },
  // ... googlePay config
});

if (error) {
  Alert.alert('Payment Failed', error.message);
} else {
  onSuccess(); // Payment confirmed!
}
```

## 5. Apple Pay Specifics
For Apple Pay to work on a physical device:
1.  **Apple Developer Account**: You need a paid account.
2.  **Merchant ID**: Create a Merchant ID (e.g., `merchant.com.sparksapp`) in Apple Developer Portal.
3.  **Certificates**: Generate a Payment Processing Certificate in Stripe Dashboard using the CSR from Apple.
4.  **Xcode Capability**: Add "Apple Pay" capability in Xcode and check the Merchant ID.

---
**Ready to proceed?**
If you have your API Keys ready, we can:
1.  Update the code to attempt a fetch (we can point it to localhost for now).
2.  I can write a small `server.js` script for you to run locally to test the full flow.
