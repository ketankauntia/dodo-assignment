export type PlanType = "free" | "subscription" | "one_time";

export const PLAN_CATALOG = [
  { code: "FREE", type: "free" as PlanType, label: "Free" },
  {
    code: "PRO_MONTH",
    type: "subscription" as PlanType,
    label: "Pro (Monthly)",
  },
  { 
    code: "PRO_YEAR",
    type: "subscription" as PlanType,
    label: "Pro (Yearly)" 
    },
  { 
    code: "CREDITS_100",
    type: "one_time" as PlanType,
    label: "100 Credits" 
    },
] as const;

export type PlanCode = (typeof PLAN_CATALOG)[number]["code"];
