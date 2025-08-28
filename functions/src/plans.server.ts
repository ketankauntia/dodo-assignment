export type Mode = "subscription" | "payment";

export const PLAN_TO_STRIPE: Record<string, { mode: Mode; priceId: string; credits?: number }> = {
  PRO_MONTH:   { mode: "subscription", priceId: process.env.STRIPE_PRICE_PRO_MONTH! },
  PRO_YEAR:    { mode: "subscription", priceId: process.env.STRIPE_PRICE_PRO_YEAR! },
  CREDITS_100: { mode: "payment",      priceId: process.env.STRIPE_PRICE_CREDITS_100!, credits: 100 },
};

export const PRICE_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(PLAN_TO_STRIPE).map(([code, v]) => [v.priceId, code])
);
