import {
  formatThreadTimestamp,
  formatDayDivider,
  isSameDay,
} from "@/lib/relative-time";

const local = (y: number, m: number, d: number, h = 0, min = 0): Date =>
  new Date(y, m - 1, d, h, min);

const NOW = local(2026, 8, 23, 15, 0);

describe("formatThreadTimestamp", () => {
  it("shows a clock time for conversations from today", () => {
    expect(formatThreadTimestamp(local(2026, 8, 23, 9, 14), NOW)).toMatch(
      /\d{1,2}:\d{2}/,
    );
  });

  it("names yesterday rather than counting hours", () => {
    expect(formatThreadTimestamp(local(2026, 8, 22, 9, 0), NOW)).toBe(
      "Yesterday",
    );
  });

  it("counts days inside the first week", () => {
    expect(formatThreadTimestamp(local(2026, 8, 20, 15, 0), NOW)).toBe(
      "3 days ago",
    );
  });

  it("switches to weeks, then months, then years", () => {
    expect(formatThreadTimestamp(local(2026, 8, 9, 15, 0), NOW)).toBe(
      "2 weeks ago",
    );
    expect(formatThreadTimestamp(local(2026, 5, 23, 15, 0), NOW)).toBe(
      "3 months ago",
    );
    expect(formatThreadTimestamp(local(2024, 8, 23, 15, 0), NOW)).toBe(
      "2 years ago",
    );
  });

  it("singularises a one-unit gap", () => {
    expect(formatThreadTimestamp(local(2026, 8, 14, 15, 0), NOW)).toBe(
      "1 week ago",
    );
  });

  it("returns an empty string for an unparseable value", () => {
    expect(formatThreadTimestamp("not-a-date", NOW)).toBe("");
  });
});

describe("formatDayDivider", () => {
  it("labels today and yesterday by name", () => {
    expect(formatDayDivider(local(2026, 8, 23, 1, 0), NOW)).toBe("Today");
    expect(formatDayDivider(local(2026, 8, 22, 1, 0), NOW)).toBe("Yesterday");
  });

  it("omits the year for dates in the current year", () => {
    expect(formatDayDivider(local(2026, 3, 4, 12, 0), NOW)).not.toMatch(/2026/);
  });

  it("includes the year once the date is in another year", () => {
    expect(formatDayDivider(local(2025, 3, 4, 12, 0), NOW)).toMatch(/2025/);
  });
});

describe("isSameDay", () => {
  it("compares calendar days, not elapsed time", () => {
    expect(
      isSameDay(local(2026, 8, 23, 0, 5), local(2026, 8, 23, 23, 55)),
    ).toBe(true);
    expect(
      isSameDay(local(2026, 8, 23, 23, 55), local(2026, 8, 24, 0, 5)),
    ).toBe(false);
  });
});
