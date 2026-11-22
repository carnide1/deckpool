"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f7f1e3",
          color: "#1c1917",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>DeckPool crashed</h1>
          <p style={{ fontSize: 14, color: "#57534e", marginBottom: 16 }}>
            A root-level error stopped the app. Try again, or reload the page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: 8,
              background: "#b91c1c",
              color: "white",
              fontWeight: 600,
              padding: "10px 16px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
