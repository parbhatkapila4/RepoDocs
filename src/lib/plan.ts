export type PlanName = "starter" | "professional" | "enterprise";

export const PLAN_LIMITS: Record<PlanName, { maxProjects: number }> = {
  starter: { maxProjects: 3 },
  professional: { maxProjects: 10 },
  enterprise: { maxProjects: Infinity },
};

export function normalizePlanName(plan: string | null | undefined): PlanName {
  const p = (plan ?? "").toLowerCase().trim();
  if (p === "pro" || p === "professional") return "professional";
  if (p === "enterprise" || p === "ent") return "enterprise";
  return "starter";
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return normalizePlanName(plan) !== "starter";
}
export type PaidFeature = "indexing" | "chat" | "architecture" | "sharing";

export const PAID_FEATURES: readonly PaidFeature[] = [
  "indexing",
  "chat",
  "architecture",
  "sharing",
];

export function planAllows(
  plan: string | null | undefined,
  feature: PaidFeature,
): boolean {
  return PAID_FEATURES.includes(feature) ? isPaidPlan(plan) : true;
}

export const FEATURE_LOCK: Record<
  PaidFeature,
  { title: string; body: string }
> = {
  indexing: {
    title: "Codebase indexing is a paid feature",
    body: "Indexing reads every file in your repository, summarizes it, and stores it so answers can be grounded in your actual code. It's available on Professional and Enterprise.",
  },
  chat: {
    title: "Chat with your code is a paid feature",
    body: "Chat answers questions from your indexed source and lists the files each answer came from. It's available on Professional and Enterprise.",
  },
  architecture: {
    title: "The architecture map is a paid feature",
    body: "The map shows every indexed file and the imports between them, read straight out of your source. It's available on Professional and Enterprise.",
  },
  sharing: {
    title: "Public share links are a paid feature",
    body: "Share links publish a doc or README to a tokenized URL you can revoke at any time. They're available on Professional and Enterprise.",
  },
};
export function upgradeMessage(feature: PaidFeature): string {
  return `${FEATURE_LOCK[feature].title.replace(" is a paid feature", "")} requires a Professional or Enterprise plan.`;
}
