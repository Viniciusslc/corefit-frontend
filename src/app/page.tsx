"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="corefit-bg">
      {/* Hero */}
      <main
        className="corefit-container"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 120, // navbar fixa
          paddingBottom: 60,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: "rgba(229,231,235,0.55)",
              marginBottom: 12,
            }}
          >
            CONSISTÊNCIA ACIMA DE TUDO
          </div>

          <h1
            style={{
              fontSize: 48,
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: 16,
            }}
          >
            Treinos simples. <span style={{ color: "#22c55e" }}>Evolução</span>{" "}
            clara.
          </h1>

          <p
            className="text-muted-soft"
            style={{
              fontSize: 15,
              maxWidth: 520,
              margin: "0 auto 28px",
            }}
          >
            Acompanhe seus treinos, registre execuções e evolua com consistência —
            do jeito mais simples possível.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link
              href="/login"
              className="btn btn-green"
              style={{
                padding: "12px 22px",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Entrar
            </Link>

            <Link
              href="/register"
              className="btn btn-soft"
              style={{
                padding: "12px 22px",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          paddingBottom: 16,
          fontSize: 12,
          color: "rgba(229,231,235,0.45)",
        }}
      >
        © 2026 Corefit • consistência acima de tudo.
      </footer>
    </div>
  );
}
