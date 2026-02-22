"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

/* =========================
   Frases aleatórias do login
========================= */
const LOGIN_MESSAGES = [
  "Bom te ver de volta 👊",
  "Seu progresso continua aqui.",
  "Continue de onde parou.",
];

type LoginResponse =
  | { access_token: string }
  | { token: string }
  | { jwt: string }
  | string;

function pickToken(resp: any): string | null {
  if (!resp) return null;
  if (typeof resp === "string") return resp;
  return resp.access_token || resp.token || resp.jwt || null;
}

export default function LoginPage() {
  const router = useRouter();

  /* =========================
     Estado do formulário
  ========================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Mensagem aleatória (1x por sessão)
  ========================= */
  const loginMessage = useMemo(() => {
    return LOGIN_MESSAGES[Math.floor(Math.random() * LOGIN_MESSAGES.length)];
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        timeoutMs: 12000,
      });

      const token = pickToken(resp);
      if (!token) {
        throw new Error("Login não retornou token.");
      }

      localStorage.setItem("token", token);
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="corefit-bg">
      <div className="corefit-container" style={{ paddingTop: 110, paddingBottom: 40 }}>
        <div style={{ width: "min(520px, 96vw)", margin: "0 auto" }}>
          <div className="card-dark glow-green hero-animate hero-delay-1" style={{ overflow: "visible" }}>
            {/* Cabeçalho */}
            <div style={{ display: "grid", placeItems: "center", marginBottom: 14 }}>
              <div
                className="d-inline-flex align-items-center justify-content-center glow"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "#22c55e",
                  color: "#03150a",
                  marginBottom: 10,
                }}
              >
                <Dumbbell size={22} />
              </div>

              {/* 🔥 FRASE ALEATÓRIA */}
              <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, textAlign: "center" }}>
                {loginMessage}
              </h1>

              <div className="text-muted-soft" style={{ fontSize: 13, textAlign: "center" }}>
                Entre para continuar seu progresso.
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-4 grid gap-3">
              {/* Email */}
              <div className="grid gap-1">
                <label className="register-label" style={{ fontSize: 13, marginBottom: 6 }}>
                  Email
                </label>
                <input
                  className="input-dark"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Senha */}
              <div className="grid gap-1">
                <label className="register-label" style={{ fontSize: 13, marginBottom: 6 }}>
                  Senha
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    className="input-dark"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                    className="auth-eye"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button className="btn btn-green w-100" disabled={loading} style={{ padding: "10px 14px" }}>
                {loading ? "Entrando..." : "Entrar"}
              </button>

              {/* Criar conta */}
              <div style={{ textAlign: "center", marginTop: 6, fontSize: 13 }}>
                <span style={{ color: "rgba(229,231,235,0.65)" }}>Não tem uma conta? </span>
                <Link href="/register" style={{ color: "#22c55e", fontWeight: 900, textDecoration: "none" }}>
                  Criar conta
                </Link>
              </div>

              {/* Voltar */}
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <Link
                  href="/"
                  style={{
                    fontSize: 12,
                    color: "rgba(229,231,235,0.55)",
                    textDecoration: "none",
                  }}
                >
                  Voltar para início
                </Link>
              </div>
            </form>
          </div>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "rgba(229,231,235,0.45)" }}>
            © 2026 Corefit • consistência acima de tudo.
          </div>
        </div>
      </div>
    </div>
  );
}
