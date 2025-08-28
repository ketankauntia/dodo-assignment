"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRICE_TO_CODE = exports.PLAN_TO_STRIPE = void 0;
exports.PLAN_TO_STRIPE = {
    PRO_MONTH: { mode: "subscription", priceId: process.env.STRIPE_PRICE_PRO_MONTH },
    PRO_YEAR: { mode: "subscription", priceId: process.env.STRIPE_PRICE_PRO_YEAR },
    CREDITS_100: { mode: "payment", priceId: process.env.STRIPE_PRICE_CREDITS_100, credits: 100 },
};
exports.PRICE_TO_CODE = Object.fromEntries(Object.entries(exports.PLAN_TO_STRIPE).map(([code, v]) => [v.priceId, code]));
//# sourceMappingURL=plans.server.js.map