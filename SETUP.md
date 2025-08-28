# 🚀 Pricing Implementation Setup Guide

## ✅ Code Implementation Status
All pricing code is complete and ready to test! Here's what's been implemented:

### **Frontend (Next.js)**
- ✅ Pricing page with plan selection UI
- ✅ API route that forwards to Firebase Functions
- ✅ Plan catalog with stable codes (FREE, PRO_MONTH, PRO_YEAR, CREDITS_100)

### **Backend (Firebase Functions)**
- ✅ Checkout session creation function
- ✅ Stripe customer management
- ✅ Plan code to Stripe price ID mapping
- ✅ All dependencies installed

## 🔧 Manual Setup Required

### **1. Firebase Project Setup**
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (select existing project or create new one)
firebase init

# Update .firebaserc with your project ID
```

### **2. Stripe Dashboard Setup**
Create these products in your Stripe Dashboard:

| Product | Type | Price | Get Price ID |
|---------|------|-------|--------------|
| Pro Monthly | Subscription | $9.99/month | `price_xxxxx` |
| Pro Yearly | Subscription | $99.99/year | `price_xxxxx` |
| 100 Credits | One-time | $19.99 | `price_xxxxx` |

### **3. Environment Variables**
```bash
# Copy environment template
cd functions
cp env.example .env
```

Update `functions/.env` with your actual values:
```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_PRICE_PRO_MONTH=price_your_monthly_price_id
STRIPE_PRICE_PRO_YEAR=price_your_yearly_price_id
STRIPE_PRICE_CREDITS_100=price_your_credits_price_id
APP_URL=http://localhost:3000
```

### **4. Update API Route**
In `app/api/create-checkout-session/route.ts`, update the function URL:
```typescript
const functionUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-region-your-project-id.cloudfunctions.net/createCheckoutSession'
  : 'http://localhost:5001/your-project-id/us-central1/createCheckoutSession';
```

## 🧪 Testing

### **Local Development**
```bash
# Terminal 1: Start Firebase Functions
cd functions
npm run serve

# Terminal 2: Start Next.js app
npm run dev
```

### **Test Flow**
1. Go to `http://localhost:3000/pricing`
2. Click "Get Started" on any plan
3. Should redirect to Stripe Checkout
4. Complete test payment
5. Verify success redirect

## 🚀 Deployment
```bash
# Deploy functions
firebase deploy --only functions

# Deploy Next.js (Vercel recommended)
vercel deploy
```

## 📋 Checklist
- [ ] Firebase project created/configured
- [ ] Stripe products created with price IDs
- [ ] Environment variables set in `functions/.env`
- [ ] Function URL updated in API route
- [ ] Local testing completed
- [ ] Functions deployed to Firebase
- [ ] Frontend deployed

## 🔍 Troubleshooting
- **CORS errors**: Check function URL and Firebase project ID
- **Stripe errors**: Verify price IDs and secret key
- **Auth errors**: Ensure Firebase Auth is properly configured
- **Build errors**: Check TypeScript types and imports
