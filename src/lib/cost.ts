const PRICING_PER_MILLION: Record<
  string,
  { input: number; output: number }
> = {
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
};

const DEFAULT_PRICING = PRICING_PER_MILLION["gemini-2.5-flash"];

function normalizeModelKey(model: string): string {
  return model
    .toLowerCase()
    .trim()
    .replace(/^[a-z-]+\//, "")
    .replace(/[:@].*$/, "") 
    .replace(/-(?:preview|exp|latest|\d{3,})$/, ""); 
}

export function getModelPricing(
  model: string
): { input: number; output: number } {
  if (!model) return DEFAULT_PRICING;
  const key = normalizeModelKey(model);
  if (PRICING_PER_MILLION[key]) return PRICING_PER_MILLION[key];
  if (key.includes("flash-lite")) return PRICING_PER_MILLION["gemini-2.5-flash-lite"];
  if (key.includes("flash")) return PRICING_PER_MILLION["gemini-2.5-flash"];
  return DEFAULT_PRICING;
}

export function estimateCostUsd(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  if (
    !Number.isFinite(promptTokens) ||
    !Number.isFinite(completionTokens) ||
    (promptTokens <= 0 && completionTokens <= 0)
  ) {
    return 0;
  }
  const pricing = getModelPricing(model);
  const cost =
    (promptTokens / 1_000_000) * pricing.input +
    (completionTokens / 1_000_000) * pricing.output;
  return Math.round(cost * 1e6) / 1e6;
}
