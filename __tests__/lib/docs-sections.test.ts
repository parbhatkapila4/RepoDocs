import {
  DOC_SECTION_COUNT,
  DOC_SECTION_SPECS,
  assembleDocContent,
  findMissingDocSections,
  hasUnclosedCodeFence,
  parseDocSections,
} from "@/lib/docs-sections";

describe("DOC_SECTION_SPECS", () => {
  it("defines all 17 sections with sequential numbering", () => {
    expect(DOC_SECTION_SPECS).toHaveLength(DOC_SECTION_COUNT);
    DOC_SECTION_SPECS.forEach((spec, i) => {
      expect(spec.num).toBe(i + 1);
      expect(spec.header).toMatch(new RegExp(`^## ${i + 1}\\. `));
      expect(spec.instructions.length).toBeGreaterThan(20);
    });
  });
});

describe("parseDocSections", () => {
  it("splits preamble and numbered sections", () => {
    const doc = [
      "# 📘 Acme: Ledger - Technical Documentation",
      "",
      "badges here",
      "",
      "## 1. 📘 Product Understanding",
      "It is a ledger.",
      "",
      "## 2. 🧩 Core Value Proposition",
      "| a | b |",
    ].join("\n");

    const parsed = parseDocSections(doc);
    expect(parsed.preamble).toContain("# 📘 Acme");
    expect(parsed.sections.size).toBe(2);
    expect(parsed.sections.get(1)).toContain("It is a ledger.");
    expect(parsed.sections.get(2)).toContain("| a | b |");
  });

  it("ignores section-like headers inside code fences", () => {
    const doc = [
      "## 16. ⚡ TL;DR: Founder Summary",
      "Summary text.",
      "",
      "## 17. 🗺️ Complete System Flow Diagram",
      "```",
      "## 3. this is ASCII art, not a header",
      "┌────┐ → └────┘",
      "```",
      "Walkthrough.",
    ].join("\n");

    const parsed = parseDocSections(doc);
    expect([...parsed.sections.keys()].sort((a, b) => a - b)).toEqual([16, 17]);
    expect(parsed.sections.get(17)).toContain("ASCII art");
    expect(parsed.sections.has(3)).toBe(false);
  });

  it("keeps the longer body when a section number repeats", () => {
    const doc = [
      "## 5. 🔌 Integration Potential",
      "short",
      "## 5. 🔌 Integration Potential",
      "this is the much longer regenerated body of section five",
    ].join("\n");

    const parsed = parseDocSections(doc);
    expect(parsed.sections.get(5)).toContain("much longer");
  });

  it("ignores numbers outside 1-17", () => {
    const parsed = parseDocSections("## 42. Nope\ncontent");
    expect(parsed.sections.size).toBe(0);
    expect(parsed.preamble).toContain("## 42. Nope");
  });
});

describe("findMissingDocSections", () => {
  it("reports every absent section number", () => {
    const sections = new Map<number, string>([
      [1, "a"],
      [2, "b"],
      [17, "z"],
    ]);
    expect(findMissingDocSections(sections)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ]);
  });

  it("returns empty when all 17 are present", () => {
    const sections = new Map<number, string>();
    for (let n = 1; n <= DOC_SECTION_COUNT; n++) sections.set(n, `s${n}`);
    expect(findMissingDocSections(sections)).toEqual([]);
  });
});

describe("hasUnclosedCodeFence", () => {
  it("detects a dangling fence (truncated diagram)", () => {
    expect(hasUnclosedCodeFence("## 17. x\n```\n┌──┐\n│")).toBe(true);
    expect(hasUnclosedCodeFence("## 17. x\n```\n┌──┐\n```\ndone")).toBe(false);
    expect(hasUnclosedCodeFence("plain prose only")).toBe(false);
  });
});

describe("assembleDocContent", () => {
  it("orders sections numerically, not lexically", () => {
    const sections = new Map<number, string>([
      [10, "## 10. ten"],
      [2, "## 2. two"],
      [1, "## 1. one"],
    ]);
    const doc = assembleDocContent("# Title", sections);
    const i1 = doc.indexOf("## 1. one");
    const i2 = doc.indexOf("## 2. two");
    const i10 = doc.indexOf("## 10. ten");
    expect(doc.startsWith("# Title")).toBe(true);
    expect(i1).toBeLessThan(i2);
    expect(i2).toBeLessThan(i10);
  });

  it("round-trips through parseDocSections", () => {
    const sections = new Map<number, string>();
    for (let n = 1; n <= DOC_SECTION_COUNT; n++) {
      sections.set(n, `${DOC_SECTION_SPECS[n - 1].header}\nBody ${n}.`);
    }
    const doc = assembleDocContent("# 📘 T - Technical Documentation", sections);
    const reparsed = parseDocSections(doc);
    expect(findMissingDocSections(reparsed.sections)).toEqual([]);
    expect(reparsed.preamble).toBe("# 📘 T - Technical Documentation");
  });
});
