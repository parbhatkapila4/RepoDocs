import { PAID_PLAN_VALUES, isPaidPlan, normalizePlanName } from "@/lib/plan";

describe("PAID_PLAN_VALUES", () => {
  it("holds only values isPaidPlan accepts, and none it rejects", () => {
    for (const value of PAID_PLAN_VALUES) {
      expect(isPaidPlan(value)).toBe(true);
    }
    for (const value of ["starter", "free", "trial", "", null, undefined]) {
      expect(isPaidPlan(value)).toBe(false);
      expect(PAID_PLAN_VALUES).not.toContain(value);
    }
  });

  it("matches isPaidPlan case-insensitively, as the SQL filter does", () => {
    for (const value of PAID_PLAN_VALUES) {
      expect(isPaidPlan(value.toUpperCase())).toBe(true);
    }
  });

  it("keeps the plan mapping unchanged", () => {
    expect(normalizePlanName("pro")).toBe("professional");
    expect(normalizePlanName("Professional")).toBe("professional");
    expect(normalizePlanName("ent")).toBe("enterprise");
    expect(normalizePlanName(" Enterprise ")).toBe("enterprise");
    expect(normalizePlanName("starter")).toBe("starter");
    expect(normalizePlanName(null)).toBe("starter");
  });
});
