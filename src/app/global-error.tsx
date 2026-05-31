"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#040406",
          color: "rgba(255,255,255,0.85)",
          fontFamily:
            'Outfit, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 560, width: "100%" }}>
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(248, 113, 113, 0.85)",
              marginBottom: 18,
            }}
          >
            ◆ application crash
          </div>
          <h1
            style={{
              fontSize: "clamp(1.7rem, 3.4vw, 2.2rem)",
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              color: "white",
              margin: 0,
            }}
          >
            Something went very wrong.
          </h1>
          <p
            style={{
              marginTop: 18,
              fontSize: 14.5,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            The application failed to render. Refresh the page, or try again
            in a minute.
          </p>
          {error.digest && (
            <div
              style={{
                marginTop: 18,
                padding: "8px 14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 6,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 11.5,
                color: "rgba(255,255,255,0.55)",
                width: "fit-content",
              }}
            >
              digest:{" "}
              <span style={{ color: "rgba(255,255,255,0.85)" }}>
                {error.digest}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              padding: "8px 16px",
              borderRadius: 6,
              border: 0,
              background: "white",
              color: "black",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
