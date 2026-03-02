"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

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

function pickRandomMessage() {
  return LOGIN_MESSAGES[Math.floor(Math.random() * LOGIN_MESSAGES.length)];
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Evita hydration mismatch: começa neutro e define no client
  const [loginMessage, setLoginMessage] = useState<string>(""); 
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    // seta 1x ao montar
    setLoginMessage(pickRandomMessage());
  }, []);

  // opcional: trocar frase ao recarregar page client-side (sem SSR)
  function rotateMessage() {
    setSwitching(true);
    window.setTimeout(() => {
      setLoginMessage(pickRandomMessage());
      setSwitching(false);
    }, 220);
  }

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
      if (!token) throw new Error("Login não retornou token.");

      localStorage.setItem("token", token);
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  const titleClass = useMemo(() => {
    return `auth-title${switching ? " is-switching" : ""}`;
  }, [switching]);

  return (
    <div className="corefit-bg auth-page">
      <div className="corefit-container auth-container" style={{ paddingTop: 110, paddingBottom: 40 }}>
        <div
          className="auth-card card-dark glow-green"
          style={{
            width: "min(520px, 96vw)",
            margin: "0 auto",
            overflow: "visible",
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
            <div
              className="d-inline-flex align-items-center justify-content-center glow"
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "#22c55e",
                color: "#03150a",
              }}
              title="Corefit"
            >
              <Dumbbell size={22} />
            </div>
          </div>

          <h1
            className={titleClass}
            style={{
              fontSize: 24,
              fontWeight: 900,
              marginBottom: 6,
              textAlign: "center",
            }}
            // clique opcional pra “trocar frase” sem recarregar (ficou legal)
            onClick={rotateMessage}
            role="button"
            aria-label="Trocar frase"
          >
            {loginMessage || "Bem-vindo de volta."}
          </h1>

          <div className="text-muted-soft" style={{ fontSize: 13, textAlign: "center" }}>
            Entre para continuar seu progresso.
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4" style={{ display: "grid", gap: 12 }}>
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
                  style={{ paddingRight: 46 }}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  className="auth-eye"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(229,231,235,0.85)",
                    transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1.03)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1)";
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              className="btn btn-green"
              disabled={loading}
              style={{
                width: "100%",
                height: 46,
                borderRadius: 14,
                padding: "10px 14px",
                marginTop: 2,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {/* Links */}
            <div style={{ textAlign: "center", marginTop: 2 }}>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "rgba(229,231,235,0.65)" }}>Não tem uma conta? </span>
                <Link href="/register" style={{ color: "#22c55e", fontWeight: 900, textDecoration: "none" }}>
                  Criar conta
                </Link>
              </div>

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

            {/* Footer dentro do card */}
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "rgba(229,231,235,0.45)" }}>
              © 2026 Corefit • consistência acima de tudo.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}