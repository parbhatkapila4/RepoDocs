import { fetchJson } from "@/lib/fetch-json";

const fetchMock = jest.fn();
const realFetch = global.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = realFetch;
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function htmlResponse(status = 200) {
  return new Response("<!DOCTYPE html><html><body>oops</body></html>", {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

describe("fetchJson", () => {
  it("parses a JSON success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ answer: "hi" }));
    const res = await fetchJson<{ answer: string }>("/api/query");
    expect(res).toEqual({
      ok: true,
      status: 200,
      data: { answer: "hi" },
      nonJson: false,
    });
  });

  it("passes JSON error bodies through with ok:false", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Budget exceeded" }, 402),
    );
    const res = await fetchJson<{ message: string }>("/api/query");
    expect(res.ok).toBe(false);
    expect(res.status).toBe(402);
    expect(res.data?.message).toBe("Budget exceeded");
  });

  it("flags an HTML body instead of throwing SyntaxError", async () => {
    fetchMock.mockResolvedValue(htmlResponse());
    const res = await fetchJson("/api/query");
    expect(res.nonJson).toBe(true);
    expect(res.data).toBeNull();
  });

  it("retries once when the first body is HTML and returns the JSON retry", async () => {
    fetchMock
      .mockResolvedValueOnce(htmlResponse())
      .mockResolvedValueOnce(jsonResponse({ answer: "second try" }));

    const res = await fetchJson<{ answer: string }>("/api/query", undefined, {
      retryOnceOnNonJson: true,
      retryDelayMs: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.nonJson).toBe(false);
    expect(res.data?.answer).toBe("second try");
  });

  it("gives up after the single retry", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(htmlResponse(500)));
    const res = await fetchJson("/api/query", undefined, {
      retryOnceOnNonJson: true,
      retryDelayMs: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.nonJson).toBe(true);
    expect(res.status).toBe(500);
  });

  it("does not retry when retry is not requested", async () => {
    fetchMock.mockResolvedValue(htmlResponse());
    await fetchJson("/api/query");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
