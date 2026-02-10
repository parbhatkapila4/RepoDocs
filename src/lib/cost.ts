
const MODEL_PRICING: Record<
  string,
  { inputPer1k: number; outputPer1k: number }
> = {
  "google/gemini-2.5-flash": {
    inputPer1k: 0.0003,
    outputPer1k: 0.0025,
  },
  "google/gemini-2.5-flash-lite": {
    inputPer1k: 0.0001,
    outputPer1k: 0.0004,
  },
};

export function getModelPricing(
  model: string
): { inputPer1k: number; outputPer1k: number } | null {
  return MODEL_PRICING[model] ?? null;
}

export function estimateCostUsd(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  const pricing = getModelPricing(model);
  if (!pricing) return 0;
  const cost =
    (promptTokens / 1000) * pricing.inputPer1k +
    (completionTokens / 1000) * pricing.outputPer1k;
  return Math.round(cost * 1e6) / 1e6;
}
