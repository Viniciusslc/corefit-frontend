"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

const GOALS = [3, 4, 5, 6];

type RegisterResponse =
  | { access_token: string }
  | { token: string }
  | { jwt: string }
  | string;

function pickToken(resp: any): string | null {
  if (!resp) return null;
  if (typeof resp === "string") return resp;
  return resp.access_token || resp.token || resp.jwt || null;
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weeklyGoalDays, setWeeklyGoalDays] = useState<number>(5);

  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalLabel = useMemo(() => `${weeklyGoalDays} dias/semana`, [weeklyGoalDays]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: { name, email, password, weeklyGoalDays },
        timeoutMs: 12000,
      });

      const token = pickToken(resp);
      if (!token) {
        throw new Error("Cadastro não retornou token. Verifique o backend (/auth/register).");
      }

      localStorage.setItem("token", token);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(String(err?.message ?? "Erro ao cadastrar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="corefit-bg">
      <div className="corefit-container" style={{ paddingTop: 110, paddingBottom: 40 }}>
        <div style={{ width: "min(520px, 96vw)", margin: "0 auto" }}>
          <div className="card-dark glow-green hero-animate hero-delay-1" style={{ overflow: "visible" }}>
            {/* Cabeçalho estilo print 1 */}
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

              <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, textAlign: "center" }}>
                Bem-vindo ao Corefit 💪
              </h1>

              <div className="text-muted-soft" style={{ fontSize: 13, textAlign: "center" }}>
                Vamos configurar seu treino em menos de 1 minuto.
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.10)",
                  color: "#fecaca",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                  Nome
                </label>
                <input
                  className="input-dark"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome aqui"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
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

              <div>
                <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                  Senha
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    className="input-dark"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="mínimo 6 caracteres"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    style={{ paddingRight: 44 }}
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

              {/* Meta semanal (print 1) */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>
                  Quantos dias você quer treinar por semana?
                </div>
                <div className="text-muted-soft" style={{ fontSize: 12, marginBottom: 10, opacity: 0.85 }}>
                  Isso ajuda a acompanhar seu progresso. <span style={{ opacity: 0.9 }}>({goalLabel})</span>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setWeeklyGoalDays(g)}
                      className={`btn ${weeklyGoalDays === g ? "btn-green" : "btn-soft"}`}
                      style={{ padding: "8px 12px", fontSize: 13, minWidth: 54 }}
                      aria-pressed={weeklyGoalDays === g}
                      disabled={loading}
                    >
                      {g}x
                    </button>
                  ))}
                </div>

                <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 10, opacity: 0.75 }}>
                  Você poderá acompanhar sua evolução semana a semana. (Dá pra mudar depois no <b>Perfil</b>.)
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-green w-100"
                disabled={loading}
                style={{ padding: "10px 14px" }}
              >
                {loading ? "Criando..." : "Criar minha conta"}
              </button>

              <Link
                href="/login"
                className="btn btn-soft w-100"
                style={{ padding: "10px 14px", textDecoration: "none" }}
              >
                Já tenho conta
              </Link>

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
    </main>
  );
}
