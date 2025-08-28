# Dodo Payments Boilerplate (Next.js + Firebase + Stripe)

## Quickstart
1) Install deps
   ```bash
   pnpm i   # or npm/yarn
   ```

2) Copy envs
   ```bash
   cp .env.local.example .env.local
   cp functions/.env.example functions/.env
   # Fill Firebase client keys and Stripe test keys + price IDs
   ```

3) Start local dev (3 terminals)
   ```bash
   pnpm emulators
   pnpm dev
   pnpm stripe:listen
   ```

4) Try the flow
   - Visit /login → sign up
   - Go to /pricing → choose Pro Monthly
   - Pay with 4242 4242 4242 4242
   - Redirect to /dashboard → see plan & dates
   - Firestore users/<uid> updated; Stripe CLI shows webhooks

## Configuration
- Change Firebase project once in package.json → config.project
- Prices: set STRIPE_PRICE_* in functions/.env
- Add a new plan: 
  - functions/src/plans.server.ts → add key
  - lib/planCatalog.ts → add label

## Functions
- health: GET /asia-south1/health → { ok: true, stripe: boolean }
- stripeWebhook: signature-verified
- createCheckoutSession: uses plan code → env price id
- billingPortal: manage subscription

## Firestore Rules
The `firestore.rules` file ensures users can only access their own documents in `/users/{userId}`. Deploy with:
```bash
firebase deploy --only firestore:rules
```

## Test webhooks
- Uses `pnpm stripe:listen` forwarding to /stripeWebhook
- Note on replacing STRIPE_WEBHOOK_SECRET when using "stripe listen"

## Assumptions & Trade-offs
- Minimal UI by design
- App Router, client SDK only for Auth/Firestore
- Subscription + one-time supported via env prices

## Troubleshooting
- 403 on Firestore: deploy rules or sign in
- 400 on checkout: missing STRIPE_PRICE_* env
- No webhook events: stripe listen not running / wrong secret
- CORS/URL issues: check NEXT_PUBLIC_FUNCTIONS_URL and APP_URL

## Scripts
- `pnpm emulators`
- `pnpm dev`
- `pnpm stripe:listen`
- `pnpm build:functions`
- `pnpm deploy:functions`
