"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarChart3, Dumbbell, Eye, EyeOff, Flame, LoaderCircle } from "lucide-react";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { apiFetch } from "@/lib/apiFetch";
import { getAuthenticatedHomePath } from "@/lib/auth-session";

type LoginResponse =
  | { token?: string; access_token?: string; jwt?: string }
  | string;

type HeroCopy = {
  title: string;
  accent: string;
  description: string;
};

type GoogleCodeResponse = {
  code?: string;
};

type GoogleCodeClient = {
  requestCode: () => void;
};

const LOGIN_HEADLINES: HeroCopy[] = [
  {
    title: "Seu treino continua aqui.",
    accent: "Sua evolucao tambem.",
    description:
      "Seus treinos, suas cargas e sua evolucao ja estao salvos. Faca login, retome o ritmo e continue construindo resultado com constancia.",
  },
  {
    title: "O historico ja existe.",
    accent: "Agora entra o proximo avanco.",
    description:
      "O Corefit guarda o que voce fez para deixar claro o que precisa superar. Entre e continue evoluindo com direcao, nao no improviso.",
  },
  {
    title: "Constancia vira resultado.",
    accent: "O proximo treino comeca aqui.",
    description:
      "Carga, volume e consistencia nao podem depender da memoria. Volte, registre e transforme disciplina em progresso visivel.",
  },
  {
    title: "Cada treino conta.",
    accent: "O proximo pode ser o melhor.",
    description:
      "Seu historico esta pronto para mostrar o que ja mudou. Entre e continue acumulando resultado do jeito certo.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const googleClientRef = useRef<GoogleCodeClient | null>(null);
  const googleScriptPromiseRef = useRef<Promise<void> | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroCopy, setHeroCopy] = useState<HeroCopy>(LOGIN_HEADLINES[0]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    setHeroCopy(
      LOGIN_HEADLINES[Math.floor(Math.random() * LOGIN_HEADLINES.length)] ?? LOGIN_HEADLINES[0],
    );
  }, []);

  useEffect(() => {
    const selectors = [
      "#credential_picker_container",
      "#credential_picker_iframe",
      "iframe[title='Sign in with Google Button']",
      "iframe[title='Sign in with Google']",
      "iframe[src*='accounts.google.com']",
      "div[data-iframe-loaded='true']",
    ];

    function hideUnexpectedGoogleUi() {
      for (const selector of selectors) {
        document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
          node.style.display = "none";
          node.style.visibility = "hidden";
          node.setAttribute("aria-hidden", "true");
        });
      }
    }

    hideUnexpectedGoogleUi();
    const observer = new MutationObserver(() => hideUnexpectedGoogleUi());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  function ensureGoogleClient() {
    if (!googleClientId) {
      return Promise.reject(new Error("Login com Google ainda nao esta configurado neste ambiente."));
    }

    if (window.google?.accounts?.oauth2?.initCodeClient && googleClientRef.current) {
      return Promise.resolve();
    }

    const initClient = () => {
      if (!window.google?.accounts?.oauth2?.initCodeClient) {
        throw new Error("O Google nao ficou disponivel para login.");
      }

      googleClientRef.current = window.google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response: GoogleCodeResponse) => {
          if (!response?.code) {
            setGoogleLoading(false);
            setError("Nao foi possivel concluir o login com Google.");
            return;
          }

          try {
            const resp = await apiFetch<LoginResponse>("/auth/google/exchange", {
              method: "POST",
              body: { code: response.code },
            });

            const token =
              typeof resp === "string"
                ? resp
                : resp?.access_token || resp?.token || resp?.jwt;

            if (!token) {
              throw new Error("Token nao retornado no login Google.");
            }

            localStorage.setItem("token", token);
            router.push(getAuthenticatedHomePath(token));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao entrar com Google";
            setError(message);
          } finally {
            setGoogleLoading(false);
          }
        },
        error_callback: () => {
          setGoogleLoading(false);
          setError("Login com Google cancelado ou nao autorizado.");
        },
      });
    };

    if (window.google?.accounts?.oauth2?.initCodeClient) {
      initClient();
      return Promise.resolve();
    }

    if (!googleScriptPromiseRef.current) {
      googleScriptPromiseRef.current = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');

        const onLoad = () => {
          try {
            initClient();
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        const onError = () => reject(new Error("Falha ao carregar o login do Google."));

        if (existing) {
          existing.addEventListener("load", onLoad, { once: true });
          existing.addEventListener("error", onError, { once: true });

          if (window.google?.accounts?.oauth2?.initCodeClient) {
            onLoad();
          }

          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        script.addEventListener("load", onLoad, { once: true });
        script.addEventListener("error", onError, { once: true });
        document.head.appendChild(script);
      });
    }

    return googleScriptPromiseRef.current;
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const submittedEmail = email.trim();
      const submittedPassword = password;

      setEmail(submittedEmail);
      setPassword(submittedPassword);

      const resp = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: submittedEmail, password: submittedPassword },
      });

      const token =
        typeof resp === "string"
          ? resp
          : resp?.access_token || resp?.token || resp?.jwt;

      if (!token) {
        throw new Error("Token nao retornado.");
      }

      localStorage.setItem("token", token);
      router.push(getAuthenticatedHomePath(token));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);

    if (!googleClientId) {
      setError("Login com Google ainda nao esta configurado neste ambiente.");
      return;
    }

    setGoogleLoading(true);

    try {
      await ensureGoogleClient();

      if (!googleClientRef.current) {
        throw new Error("O carregamento do Google ainda nao terminou. Tente novamente.");
      }

      googleClientRef.current.requestCode();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao preparar login com Google";
      setGoogleLoading(false);
      setError(message);
    }
  }

  const googleDisabled = !googleClientId || loading || googleLoading;

  return (
    <AuthSplitLayout
      backgroundImage="/images/auth/hero-login.webp"
      backgroundPosition="center 20%"
      heroEyebrow="Historico, clareza, consistencia"
      heroTitle={heroCopy.title}
      heroAccent={heroCopy.accent}
      heroDescription={heroCopy.description}
      heroMetrics={[
        { value: "128", label: "sessoes registradas no ultimo ciclo" },
        { value: "+16,2 kg", label: "ganho medio na carga principal" },
        { value: "92%", label: "ritmo mantido entre uma sessao e outra" },
      ]}
      heroHighlights={[
        {
          icon: BarChart3,
          title: "Progresso real",
          description: "Acompanhe suas cargas e performance com historico claro.",
        },
        {
          icon: Dumbbell,
          title: "Treino pronto",
          description: "Entre sabendo exatamente o que fazer e o que superar.",
        },
        {
          icon: Flame,
          title: "Constancia",
          description: "Menos treino perdido, mais continuidade entre sessoes.",
        },
      ]}
      heroNote="Seu treino nao precisa recomecar no improviso toda vez que voce volta. O Corefit retoma de onde sua evolucao parou."
      panelBadge="Acesso Corefit"
      panelTitle="Bem-vindo de volta"
      panelDescription="Entre para continuar seu historico com o mesmo padrao visual, a mesma clareza e o mesmo contexto do treino anterior."
    >
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300"
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
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
            htmlFor="login-password"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300"
          >
            Senha
          </label>
          <div className="relative mt-2">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
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
        </div>

        <div className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-400">
          <label className="flex items-center gap-2.5 text-[0.86rem] text-zinc-300">
            <input type="checkbox" className="accent-green-500" />
            Lembrar de mim
          </label>

          <Link
            href="/forgot-password"
            className="text-[0.86rem] text-green-400/85 transition hover:text-green-300 hover:underline"
          >
            Esqueci a senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="inline-flex w-full items-center justify-center rounded-[1.35rem] bg-green-500 px-6 py-4 text-lg font-semibold text-black shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 hover:shadow-green-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-sm text-white/40">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleDisabled}
        className="flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-[1.35rem] border border-white/14 bg-white/[0.08] px-4 py-3.5 text-sm font-semibold text-white/95 shadow-[0_12px_34px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.12] hover:text-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleLoading ? (
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-zinc-950 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            G
          </span>
        )}
        <span>
          {googleLoading
            ? "Conectando com Google..."
            : !googleClientId
            ? "Login com Google indisponivel neste ambiente"
            : "Entrar com Google"}
        </span>
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-white/40">
        Seu historico continua salvo e pronto para retomar de onde voce parou.
      </p>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Nao tem uma conta?{" "}
        <Link href="/register" className="font-medium text-green-400 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
