// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import Stripe from "stripe";
import { PLAN_TO_STRIPE, PRICE_TO_CODE } from "./plans.server";

admin.initializeApp();

const REGION = "asia-south1"; // your Firebase region (Mumbai)
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// ---------- Helpers ----------
const db = getFirestore();
const ts = (unixSeconds: number) => Timestamp.fromMillis(unixSeconds * 1000);

async function uidFromCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (typeof customer === "object" && "metadata" in customer) {
      return (customer as any).metadata?.firebaseUID || null;
    }
  } catch (e) {
    console.error("uidFromCustomer error:", e);
  }
  return null;
}

function allowCors(req: functions.Request, res: functions.Response) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

// ---------- 1) Create Stripe customer on Firebase Auth user creation ----------
export const onUserCreate = functions
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { firebaseUID: user.uid },
    });

    // Ensure baseline "free" plan in Firestore
    const ref = db.collection("users").doc(user.uid);
    await ref.set(
      {
        uid: user.uid,
        email: user.email ?? null,
        stripeCustomerId: customer.id,
        plan: "free",
        plan_code: "FREE",
        plan_status: "active",
        plan_start_date: FieldValue.serverTimestamp(),
        plan_end_date: null,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

// ---------- 2) Create Checkout Session (subscription or one-time) ----------
export const createCheckoutSession = functions
  .region(REGION)
  .https.onRequest(async (req, res) => {
    if (allowCors(req, res)) return;

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing authorization header" });
        return;
      }
      const idToken = authHeader.slice("Bearer ".length);
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      // Validate planCode
      const { planCode } = req.body as { planCode: string };
      const plan = PLAN_TO_STRIPE[planCode];
      if (!plan) {
        res.status(400).json({ error: "Invalid planCode" });
        return;
      }

      // Get or create Stripe customer
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        res.status(404).json({ error: "User not found in Firestore" });
        return;
      }
      let customerId = userSnap.get("stripeCustomerId") as string | null;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userSnap.get("email") || decoded.email || undefined,
          metadata: { firebaseUID: uid },
        });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customerId }, { merge: true });
      }

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: plan.mode, // "subscription" | "payment"
        line_items: [{ price: plan.priceId, quantity: 1 }],
        success_url: `${APP_URL}/pricing?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/pricing?status=cancel`,
        metadata: { firebaseUID: uid, planCode },
        subscription_data:
          plan.mode === "subscription"
            ? { metadata: { firebaseUID: uid, planCode } }
            : undefined,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("createCheckoutSession error:", error);
      res.status(500).json({ error: error.message || "Internal error" });
    }
  });

// ---------- 3) Billing Portal ----------
export const billingPortal = functions
  .region(REGION)
  .https.onRequest(async (req, res) => {
    if (allowCors(req, res)) return;

    try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing authorization header" });
        return;
      }
      const idToken = authHeader.slice("Bearer ".length);
      const { uid } = await admin.auth().verifyIdToken(idToken);

      const userSnap = await db.collection("users").doc(uid).get();
      const customerId = userSnap.get("stripeCustomerId");
      if (!customerId) {
        res.status(400).json({ error: "No Stripe customer found" });
        return;
      }

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${APP_URL}/pricing`,
      });

      // 303 redirect to portal
      res.redirect(303, portal.url);
    } catch (error: any) {
      console.error("billingPortal error:", error);
      res.status(500).json({ error: error.message || "Internal error" });
    }
  });

// ---------- 4) Stripe Webhook (signature verified) ----------
export const stripeWebhook = functions
  .region(REGION)
  .https.onRequest(async (req, res) => {
    // NOTE: In Firebase Functions, req.rawBody is available for signature verification
    const sig = req.headers["stripe-signature"] as string | undefined;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        // Subscriptions lifecycle
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;

          // Prefer metadata (we set it when creating the session/sub)
          const uid =
            sub.metadata?.firebaseUID ||
            (await uidFromCustomer(sub.customer as string));

          if (!uid) {
            console.warn("No firebaseUID on subscription event");
            break;
          }

          const userRef = db.collection("users").doc(uid);

          if (event.type === "customer.subscription.deleted") {
            await userRef.set(
              {
                plan: "free",
                plan_code: "FREE",
                plan_status: "active",
                plan_start_date: FieldValue.serverTimestamp(),
                plan_end_date: null,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          } else {
            const item = sub.items.data[0];
            const priceId = item.price.id;
            const planCode =
              sub.metadata?.planCode || PRICE_TO_CODE[priceId] || "UNKNOWN";

            await userRef.set(
              {
                plan: "pro",
                plan_code: planCode,
                plan_status: sub.status, // active, trialing, past_due, canceled
                plan_start_date: ts(sub.current_period_start),
                plan_end_date: ts(sub.current_period_end),
                payment_channel: "stripe",
                subscriptions: [
                  {
                    subscription_id: sub.id,
                    customer_id: sub.customer,
                    status: sub.status,
                    product_id: item.price.product,
                    price_id: priceId,
                    current_period_start: ts(sub.current_period_start),
                    current_period_end: ts(sub.current_period_end),
                    cancel_at_period_end: sub.cancel_at_period_end,
                  },
                ],
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          break;
        }

        // One-time success → add credits (e.g., CREDITS_100)
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.mode === "payment" && session.payment_status === "paid") {
            const uid =
              session.metadata?.firebaseUID ||
              (session.customer
                ? await uidFromCustomer(session.customer as string)
                : null);

            if (!uid) {
              console.warn("No firebaseUID on one-time payment");
              break;
            }

            // Decide how many credits to add
            // Prefer metadata.planCode; otherwise map from the first line item's price
            let add = 0;
            const planCode =
              session.metadata?.planCode ||
              (session as any).line_items?.data?.[0]?.price?.id
                ? PRICE_TO_CODE[(session as any).line_items.data[0].price.id]
                : undefined;

            if (planCode && PLAN_TO_STRIPE[planCode]?.credits) {
              add = PLAN_TO_STRIPE[planCode].credits!;
            }

            if (add > 0) {
              await db.runTransaction(async (tx) => {
                const ref = db.collection("users").doc(uid);
                const snap = await tx.get(ref);
                const current = (snap.get("credits") as number) || 0;
                tx.set(
                  ref,
                  {
                    credits: current + add,
                    updatedAt: FieldValue.serverTimestamp(),
                  },
                  { merge: true }
                );
              });
            }
          }
          break;
        }

        default:
          // ignore other events for now
          break;
      }

      res.json({ received: true });
    } catch (e) {
      console.error("stripeWebhook handler error:", e);
      res.status(500).send("Webhook handler error");
    }
  });
