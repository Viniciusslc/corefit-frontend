"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Compass, Eye, EyeOff, LineChart, Zap } from "lucide-react";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { apiFetch } from "@/lib/apiFetch";

type RegisterResponse =
  | { token?: string; access_token?: string; jwt?: string }
  | string;

const registerHighlights = [
  {
    icon: Zap,
    title: "Entrada rapida",
    description:
      "Cadastro enxuto, direto e sem atrito logo no primeiro acesso.",
  },
  {
    icon: LineChart,
    title: "Evolucao visivel",
    description:
      "Carga, volume e consistencia viram leitura util desde o inicio.",
  },
  {
    icon: Compass,
    title: "Treino com contexto",
    description:
      "Voce entra com uma base pronta para treinar com mais direcao.",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      setError("Informe seu email.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const resp = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          weeklyGoalDays: days,
        },
      });

      const token =
        typeof resp === "string"
          ? resp
          : resp?.access_token || resp?.token || resp?.jwt;

      if (!token) {
        throw new Error("Token nao retornado no cadastro.");
      }

      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      backgroundImage="/images/hero-register.png"
      backgroundPosition="center 14%"
      heroEyebrow="Registro, leitura, evolucao"
      heroTitle="Treinar melhor"
      heroAccent="comeca com um sistema claro."
      heroDescription="O Corefit foi feito para quem quer mais do que marcar treino como concluido. Aqui voce entra com estrutura, registra o que fez e comeca a construir evolucao com direcao."
      heroMetrics={[
        { value: "Cadastro limpo", label: "entrada objetiva para comecar sem friccao." },
        { value: "Meta semanal", label: "voce ja entra com uma rotina inicial definida." },
        { value: "Base pronta", label: "historico e organizacao desde o primeiro treino." },
      ]}
      heroMetricsColumns={3}
      heroHighlightsColumns={3}
      heroHighlights={registerHighlights}
      panelBadge="Nova conta"
      panelTitle="Crie sua conta"
      panelDescription="Comece com um setup enxuto e profissional para registrar treinos com contexto desde o primeiro dia."
    >
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label
            htmlFor="register-name"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300"
          >
            Nome
          </label>
          <input
            id="register-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-5 py-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300"
          >
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-5 py-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300"
          >
            Senha
          </label>
          <div className="relative mt-2">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo de 6 caracteres"
              autoComplete="new-password"
              className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-5 py-4 pr-14 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-2 inline-flex h-full items-center justify-center rounded-xl px-3 text-zinc-500 transition hover:text-zinc-200"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Use pelo menos 6 caracteres para comecar com seguranca.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-4 shadow-xl shadow-black/40 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
          <div className="mb-1 text-sm font-semibold text-zinc-200">
            Quantos dias por semana voce quer manter como meta?
          </div>
          <p className="mb-4 text-xs leading-5 text-zinc-500">
            Isso ajuda a comecar o app com uma meta simples e realista para sua rotina.
            Depois voce pode ajustar no perfil.
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[3, 4, 5, 6].map((d) => {
              const selected = days === d;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`inline-flex items-center justify-center rounded-[1rem] border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    selected
                      ? "border-green-400 bg-green-500 text-black shadow-[0_10px_30px_rgba(34,197,94,0.28)]"
                      : "border-white/10 bg-black/26 text-zinc-300 hover:scale-[1.02] hover:border-white/18 hover:bg-white/[0.05]"
                  }`}
                  aria-pressed={selected}
                >
                  {d}x
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-[1.35rem] bg-green-500 px-6 py-4 text-lg font-semibold text-black shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 hover:shadow-green-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Criando conta..." : "Comecar minha evolucao"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Ja tem uma conta?{" "}
        <Link href="/login" className="font-medium text-green-400 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
