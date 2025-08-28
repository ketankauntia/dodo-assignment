"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.billingPortal = exports.createCheckoutSession = exports.onUserCreate = void 0;
// functions/src/index.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const stripe_1 = __importDefault(require("stripe"));
const plans_server_1 = require("./plans.server");
admin.initializeApp();
const REGION = "asia-south1"; // your Firebase region (Mumbai)
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});
// ---------- Helpers ----------
const db = (0, firestore_1.getFirestore)();
const ts = (unixSeconds) => firestore_1.Timestamp.fromMillis(unixSeconds * 1000);
async function uidFromCustomer(customerId) {
    var _a;
    try {
        const customer = await stripe.customers.retrieve(customerId);
        if (typeof customer === "object" && "metadata" in customer) {
            return ((_a = customer.metadata) === null || _a === void 0 ? void 0 : _a.firebaseUID) || null;
        }
    }
    catch (e) {
        console.error("uidFromCustomer error:", e);
    }
    return null;
}
function allowCors(req, res) {
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
exports.onUserCreate = functions
    .region(REGION)
    .auth.user()
    .onCreate(async (user) => {
    var _a;
    // Create Stripe customer
    const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { firebaseUID: user.uid },
    });
    // Ensure baseline "free" plan in Firestore
    const ref = db.collection("users").doc(user.uid);
    await ref.set({
        uid: user.uid,
        email: (_a = user.email) !== null && _a !== void 0 ? _a : null,
        stripeCustomerId: customer.id,
        plan: "free",
        plan_code: "FREE",
        plan_status: "active",
        plan_start_date: firestore_1.FieldValue.serverTimestamp(),
        plan_end_date: null,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
});
// ---------- 2) Create Checkout Session (subscription or one-time) ----------
exports.createCheckoutSession = functions
    .region(REGION)
    .https.onRequest(async (req, res) => {
    if (allowCors(req, res))
        return;
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
        const { planCode } = req.body;
        const plan = plans_server_1.PLAN_TO_STRIPE[planCode];
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
        let customerId = userSnap.get("stripeCustomerId");
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
            subscription_data: plan.mode === "subscription"
                ? { metadata: { firebaseUID: uid, planCode } }
                : undefined,
        });
        res.json({ url: session.url });
    }
    catch (error) {
        console.error("createCheckoutSession error:", error);
        res.status(500).json({ error: error.message || "Internal error" });
    }
});
// ---------- 3) Billing Portal ----------
exports.billingPortal = functions
    .region(REGION)
    .https.onRequest(async (req, res) => {
    if (allowCors(req, res))
        return;
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
    }
    catch (error) {
        console.error("billingPortal error:", error);
        res.status(500).json({ error: error.message || "Internal error" });
    }
});
// ---------- 4) Stripe Webhook (signature verified) ----------
exports.stripeWebhook = functions
    .region(REGION)
    .https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // NOTE: In Firebase Functions, req.rawBody is available for signature verification
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
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
                const sub = event.data.object;
                // Prefer metadata (we set it when creating the session/sub)
                const uid = ((_a = sub.metadata) === null || _a === void 0 ? void 0 : _a.firebaseUID) ||
                    (await uidFromCustomer(sub.customer));
                if (!uid) {
                    console.warn("No firebaseUID on subscription event");
                    break;
                }
                const userRef = db.collection("users").doc(uid);
                if (event.type === "customer.subscription.deleted") {
                    await userRef.set({
                        plan: "free",
                        plan_code: "FREE",
                        plan_status: "active",
                        plan_start_date: firestore_1.FieldValue.serverTimestamp(),
                        plan_end_date: null,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
                else {
                    const item = sub.items.data[0];
                    const priceId = item.price.id;
                    const planCode = ((_b = sub.metadata) === null || _b === void 0 ? void 0 : _b.planCode) || plans_server_1.PRICE_TO_CODE[priceId] || "UNKNOWN";
                    await userRef.set({
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
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
                break;
            }
            // One-time success → add credits (e.g., CREDITS_100)
            case "checkout.session.completed": {
                const session = event.data.object;
                if (session.mode === "payment" && session.payment_status === "paid") {
                    const uid = ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.firebaseUID) ||
                        (session.customer
                            ? await uidFromCustomer(session.customer)
                            : null);
                    if (!uid) {
                        console.warn("No firebaseUID on one-time payment");
                        break;
                    }
                    // Decide how many credits to add
                    // Prefer metadata.planCode; otherwise map from the first line item's price
                    let add = 0;
                    const planCode = ((_d = session.metadata) === null || _d === void 0 ? void 0 : _d.planCode) ||
                        ((_h = (_g = (_f = (_e = session.line_items) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.price) === null || _h === void 0 ? void 0 : _h.id)
                        ? plans_server_1.PRICE_TO_CODE[session.line_items.data[0].price.id]
                        : undefined;
                    if (planCode && ((_j = plans_server_1.PLAN_TO_STRIPE[planCode]) === null || _j === void 0 ? void 0 : _j.credits)) {
                        add = plans_server_1.PLAN_TO_STRIPE[planCode].credits;
                    }
                    if (add > 0) {
                        await db.runTransaction(async (tx) => {
                            const ref = db.collection("users").doc(uid);
                            const snap = await tx.get(ref);
                            const current = snap.get("credits") || 0;
                            tx.set(ref, {
                                credits: current + add,
                                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                            }, { merge: true });
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
    }
    catch (e) {
        console.error("stripeWebhook handler error:", e);
        res.status(500).send("Webhook handler error");
    }
});
//# sourceMappingURL=index.js.map