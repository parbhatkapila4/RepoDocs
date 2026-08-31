jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));

import { deriveThreadTitle } from "@/lib/chat-threads";

describe("deriveThreadTitle", () => {
  it("uses a short question verbatim", () => {
    expect(deriveThreadTitle("How does auth work?")).toBe(
      "How does auth work?",
    );
  });

  it("collapses whitespace so a pasted question stays one line", () => {
    expect(deriveThreadTitle("  How   does\n auth\twork? ")).toBe(
      "How does auth work?",
    );
  });

  it("falls back to a placeholder for an empty question", () => {
    expect(deriveThreadTitle("   ")).toBe("New conversation");
  });

  it("truncates a long question at a word boundary", () => {
    const question =
      "Walk me through the authentication flow and explain how sessions are refreshed across requests";
    const title = deriveThreadTitle(question);

    expect(title.length).toBeLessThanOrEqual(65);
    expect(title.endsWith("…")).toBe(true);
    const kept = title.slice(0, -1);
    expect(question.startsWith(kept)).toBe(true);
    expect(question[kept.length]).toBe(" ");
  });

  it("hard-cuts a single unbroken token rather than collapsing the title", () => {
    expect(deriveThreadTitle("a".repeat(200))).toBe(`${"a".repeat(64)}…`);
  });
});
