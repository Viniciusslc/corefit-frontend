"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Crown, Dumbbell, Sparkles, Zap } from "lucide-react";

import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { apiFetch } from "@/lib/apiFetch";

type BillingStatus = {
  plan: string;
  hasPremiumAccess: boolean;
  isInternal: boolean;
  subscriptionStatus: string;
  billingProvider: string;
  billingCurrentPeriodEnd: string | null;
  billingCanceledAt: string | null;
  billingStartedAt?: string | null;
  billingCustomerId?: string;
  billingSubscriptionId?: string;
  planSource: string;
  stripeConfigured: boolean;
  checkoutReady: boolean;
  monthlyReady?: boolean;
  annualReady?: boolean;
  portalReady?: boolean;
  webhookReady?: boolean;
  canManageBilling: boolean;
  pricing?: {
    monthly: number;
    annual: number;
  };
};

const freeFeatures = [
  "Criacao e edicao manual de treinos",
  "Registro de execucao, cargas e repeticoes",
  "Historico basico de sessoes",
  "Meta semanal e acompanhamento principal",
  "Dashboard free com leitura essencial",
];

const premiumFeatures = [
  "Geracao de treino com IA",
  "IA Coach e camada de inteligencia aplicada",
  "Comparacoes mais avancadas de evolucao",
  "Leitura premium de progresso e contexto",
  "Base ideal para insights, PRs e automacoes futuras",
];

const comparisonRows = [
  {
    label: "Criar e organizar treinos",
    free: "Sim",
    premium: "Sim",
  },
  {
    label: "Registrar cargas e repeticoes",
    free: "Sim",
    premium: "Sim",
  },
  {
    label: "Historico basico",
    free: "Sim",
    premium: "Sim",
  },
  {
    label: "Gerar treino com IA",
    free: "Nao",
    premium: "Sim",
  },
  {
    label: "Insights avancados",
    free: "Nao",
    premium: "Sim",
  },
  {
    label: "Camada premium de inteligencia",
    free: "Nao",
    premium: "Sim",
  },
];

function readPlanSourceMessage(source: string | null) {
  switch (source) {
    case "dashboard-membership":
      return {
        title: "Voce veio do dashboard.",
        body: "Faz sentido: quando a rotina ja esta encaixada, o proximo passo e adicionar mais leitura e contexto.",
      };
    case "dashboard-quick-actions":
      return {
        title: "Voce veio das acoes rapidas.",
        body: "Esse e o momento classico de upgrade: o usuario quer agir rapido e quer IA sem quebrar o fluxo.",
      };
    case "profile-membership":
      return {
        title: "Voce veio da area de assinatura.",
        body: "Perfeito para decidir com calma entre ficar no free ou subir de nivel com billing real.",
      };
    case "ai-gate":
      return {
        title: "Voce veio do bloqueio da IA.",
        body: "Aqui o valor precisa estar obvio: premium nao e enfeite, e o que libera a camada inteligente do Corefit.",
      };
    default:
      return {
        title: "Escolha o ritmo certo para o seu momento.",
        body: "O free continua util. O premium entra quando voce quer mais clareza, mais contexto e menos achismo.",
      };
  }
}

function mapSubscriptionStatus(status?: string | null) {
  switch (status) {
    case "active":
      return "Ativa";
    case "trialing":
      return "Teste";
    case "past_due":
      return "Pagamento pendente";
    case "canceled":
      return "Cancelada";
    case "paused":
      return "Pausada";
    default:
      return "Inativa";
  }
}

export default function PlanosPage() {
  const { session, hasPremiumAccess } = usePremiumAccess();
  const isLogged = Boolean(session?.sub);
  const isAdmin = session?.role === "admin";
  const [hydrated, setHydrated] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [entrySource, setEntrySource] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    setEntrySource(params.get("source"));
    if (checkoutStatus === "success") {
      setBillingMessage("Checkout concluido. Assim que o webhook confirmar, seu premium sera ativado.");
    } else if (checkoutStatus === "cancel") {
      setBillingMessage("Checkout cancelado. Seu plano atual foi mantido.");
    }
  }, []);

  useEffect(() => {
    if (!isLogged) return;

    let mounted = true;

    apiFetch<BillingStatus>("/billing/status")
      .then((data) => {
        if (!mounted) return;
        setBillingStatus(data);
        if (window.location.search.includes("checkout=success") && data?.hasPremiumAccess) {
          setBillingMessage("Pagamento confirmado. Sua conta ja esta com acesso premium.");
        }
      })
      .catch(() => {
        if (!mounted) return;
        setBillingStatus(null);
      });

    return () => {
      mounted = false;
    };
  }, [isLogged]);

  async function handleCheckout(priceKey: "monthly" | "annual") {
    if (!isLogged) return;

    setCheckoutLoading(priceKey);
    setBillingMessage(null);

    try {
      const response = await apiFetch<{ checkoutUrl: string }>("/billing/checkout-session", {
        method: "POST",
        body: { priceKey, source: entrySource || "planos-direct" },
      });

      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      setBillingMessage("Nao foi possivel abrir o checkout agora.");
    } catch (error: any) {
      setBillingMessage(error?.message || "Nao foi possivel iniciar a assinatura agora.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleOpenPortal() {
    setPortalLoading(true);
    setBillingMessage(null);

    try {
      const response = await apiFetch<{ portalUrl: string }>("/billing/portal", { method: "POST" });
      if (response?.portalUrl) {
        window.location.href = response.portalUrl;
        return;
      }

      setBillingMessage("Nao foi possivel abrir o portal de assinatura agora.");
    } catch (error: any) {
      setBillingMessage(error?.message || "Nao foi possivel abrir o portal de assinatura.");
    } finally {
      setPortalLoading(false);
    }
  }

  const resolvedHasPremiumAccess =
    hydrated && (billingStatus?.hasPremiumAccess ?? hasPremiumAccess);
  const resolvedLogged = hydrated ? isLogged : false;
  const resolvedIsAdmin = hydrated ? isAdmin : false;
  const primaryCtaHref = resolvedHasPremiumAccess ? "/dashboard" : resolvedLogged ? "/dashboard" : "/register";
  const primaryCtaLabel = resolvedHasPremiumAccess
    ? "Ir para meu dashboard"
    : resolvedLogged
    ? "Continuar no free"
    : "Criar minha conta gratis";
  const monthlyPrice = billingStatus?.pricing?.monthly ?? 19.9;
  const annualPrice = billingStatus?.pricing?.annual ?? 179.9;
  const annualSavings = Math.max(0, monthlyPrice * 12 - annualPrice);
  const sourceMessage = readPlanSourceMessage(entrySource);

  return (
    <main className="min-h-screen overflow-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-landing.png')",
            backgroundPosition: "center top",
            filter: "brightness(0.28) contrast(1.05) saturate(1.02)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(34,197,94,0.18),transparent_16%),radial-gradient(circle_at_76%_14%,rgba(34,197,94,0.14),transparent_22%),linear-gradient(180deg,rgba(4,4,4,0.78)_0%,rgba(4,4,4,0.72)_26%,rgba(4,4,4,0.94)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-28">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
              Corefit premium
            </div>

            <h1 className="mt-8 max-w-[12ch] text-5xl font-black leading-[0.9] tracking-[-0.055em] text-white sm:text-6xl xl:text-[6.2rem]">
              O treino continua no free.
              <span className="block text-green-400">A clareza sobe no premium.</span>
            </h1>

            <p className="mt-8 max-w-[40rem] text-lg leading-8 text-zinc-300">
              O Corefit free organiza sua rotina. O premium entra quando voce quer transformar treino em
              leitura mais inteligente, menos achismo e mais velocidade para evoluir.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={primaryCtaHref}
                className="group rounded-2xl bg-green-500 px-7 py-4 text-base font-semibold text-black shadow-[0_0_40px_rgba(34,197,94,0.35)] transition duration-200 hover:scale-[1.02] hover:bg-green-400 active:scale-[0.98]"
              >
                <span className="inline-flex items-center gap-2">
                  {primaryCtaLabel}
                  <span className="transition-transform duration-200 group-hover:translate-x-1">-&gt;</span>
                </span>
              </Link>

              <Link
                href={resolvedIsAdmin ? "/admin" : "/funcionalidades"}
                className="rounded-2xl border border-white/12 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition duration-200 hover:scale-[1.02] hover:border-white/20 hover:bg-white/8 active:scale-[0.98]"
              >
                {resolvedIsAdmin ? "Ver camada admin" : "Explorar funcionalidades"}
              </Link>
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                Situacao da sua conta
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                {resolvedHasPremiumAccess
                  ? "Sua conta ja tem acesso premium."
                  : resolvedLogged
                  ? "Sua conta esta hoje no plano free."
                  : "Voce ainda nao entrou. O plano free ja abre a porta."}
              </div>
              <div className="mt-2 text-sm leading-7 text-zinc-400">
                {resolvedHasPremiumAccess
                  ? "Quando o checkout entrar, esse acesso passa a conviver com billing real sem perder a base que ja montamos."
                  : resolvedLogged
                  ? "Voce pode continuar usando o essencial no free e subir para premium quando quiser a camada de inteligencia."
                  : "Entre gratis, use o core do produto e decida subir para premium quando a leitura avancada fizer sentido para sua rotina."}
              </div>
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-green-500/16 bg-green-500/[0.08] px-5 py-4 backdrop-blur-md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                Leitura da jornada
              </div>
              <div className="mt-3 text-lg font-semibold text-white">{sourceMessage.title}</div>
              <div className="mt-2 text-sm leading-7 text-zinc-200">{sourceMessage.body}</div>
            </div>

            {billingMessage && (
              <div className="mt-4 rounded-[1.4rem] border border-green-500/18 bg-green-500/10 px-5 py-4 text-sm leading-7 text-green-100">
                {billingMessage}
              </div>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -left-12 top-8 h-44 w-44 rounded-full bg-green-500/18 blur-[95px]" />
            <div className="absolute -right-12 bottom-6 h-48 w-48 rounded-full bg-green-500/14 blur-[110px]" />

            <div className="relative overflow-hidden rounded-[2.2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(11,16,13,0.96),rgba(7,9,8,0.94))] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.5),0_0_120px_rgba(34,197,94,0.12)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.26em] text-green-300">
                    Leitura comercial
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white">
                    Premium para quem quer enxergar melhor
                  </h2>
                </div>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-right">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-green-300">Preco alvo</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {monthlyPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <div className="mt-1 text-xs text-green-200/90">
                    ou {annualPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/ano
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    <Dumbbell size={14} />
                    Free
                  </div>
                  <div className="mt-4 text-3xl font-black tracking-[-0.05em] text-white">R$ 0</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-400">
                    Base solida para criar, registrar e manter consistencia.
                  </div>
                  <div className="mt-5 space-y-3">
                    {freeFeatures.slice(0, 3).map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
                        <Check size={16} className="mt-1 shrink-0 text-green-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-green-500/18 bg-green-500/[0.08] p-5 shadow-[0_0_40px_rgba(34,197,94,0.12)]">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-green-300">
                    <Crown size={14} />
                    Premium
                  </div>
                  <div className="mt-4 text-3xl font-black tracking-[-0.05em] text-white">
                    {monthlyPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-green-200">
                    {annualPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} no anual
                  </div>
                  <div className="mt-2 text-sm leading-6 text-zinc-200">
                    Camada de inteligencia, contexto e decisao para evoluir sem treino no escuro.
                  </div>
                  <div className="mt-4 inline-flex rounded-full border border-green-400/20 bg-black/20 px-3 py-1 text-xs font-semibold text-green-200">
                    Economiza R$ {annualSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    por ano
                  </div>
                  <div className="mt-5 space-y-3">
                    {premiumFeatures.slice(0, 3).map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm leading-6 text-zinc-100">
                        <Check size={16} className="mt-1 shrink-0 text-green-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
                O free segura o essencial do treino. O premium vai concentrar o que torna o Corefit mais
                inteligente, persuasivo e dificil de largar.
              </div>

              {billingStatus && (
                <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/18 px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Plano atual</div>
                      <div className="mt-2 text-lg font-bold text-white">
                        {billingStatus.hasPremiumAccess ? "Premium" : "Free"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Status</div>
                      <div className="mt-2 text-lg font-bold text-white">
                        {mapSubscriptionStatus(billingStatus.subscriptionStatus)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Billing</div>
                      <div className="mt-2 text-lg font-bold text-white">
                        {billingStatus.billingProvider === "stripe" ? "Stripe" : "Nao conectado"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-zinc-400">
                      Checkout mensal:{" "}
                      <span className={billingStatus.monthlyReady ? "text-green-300" : "text-amber-300"}>
                        {billingStatus.monthlyReady ? "pronto" : "pendente"}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-zinc-400">
                      Checkout anual:{" "}
                      <span className={billingStatus.annualReady ? "text-green-300" : "text-amber-300"}>
                        {billingStatus.annualReady ? "pronto" : "pendente"}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-zinc-400">
                      Webhook:{" "}
                      <span className={billingStatus.webhookReady ? "text-green-300" : "text-amber-300"}>
                        {billingStatus.webhookReady ? "pronto" : "pendente"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!resolvedLogged || resolvedHasPremiumAccess || checkoutLoading !== null || billingStatus?.checkoutReady === false}
                  onClick={() => void handleCheckout("monthly")}
                  className="rounded-2xl bg-green-500 px-5 py-4 text-sm font-semibold text-black transition duration-200 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resolvedHasPremiumAccess
                    ? "Premium ja ativo"
                    : checkoutLoading === "monthly"
                    ? "Abrindo checkout..."
                    : "Assinar premium mensal"}
                </button>

                <button
                  type="button"
                  disabled={!resolvedLogged || resolvedHasPremiumAccess || checkoutLoading !== null || billingStatus?.checkoutReady === false}
                  onClick={() => void handleCheckout("annual")}
                  className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkoutLoading === "annual" ? "Abrindo checkout..." : "Assinar premium anual"}
                </button>
              </div>

              {resolvedHasPremiumAccess && (
                <button
                  type="button"
                  disabled={portalLoading || !billingStatus?.canManageBilling}
                  onClick={() => void handleOpenPortal()}
                  className="mt-3 w-full rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {portalLoading ? "Abrindo portal..." : "Gerenciar assinatura"}
                </button>
              )}

              <div className="mt-3 text-xs leading-6 text-zinc-500">
                {!resolvedLogged
                  ? "Entre na sua conta para abrir o checkout."
                  : resolvedHasPremiumAccess
                  ? billingStatus?.canManageBilling
                    ? "Sua conta ja tem premium. Se quiser, voce pode abrir o portal e gerenciar a assinatura."
                    : "Sua conta ja tem acesso premium ou interno."
                  : billingStatus?.checkoutReady === false
                  ? "Checkout ainda nao configurado no backend. Falta conectar as credenciais Stripe."
                  : "Ao assinar, o acesso premium passa a depender do billing real e do webhook."}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-[rgba(10,10,10,0.72)] p-8 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">Plano free</div>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-white">Use o Corefit de verdade.</h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              O plano free nao e amostra vazia. Ele ja entrega rotina, registro e historico para construir
              consistencia com seriedade.
            </p>
            <div className="mt-8 space-y-4">
              {freeFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                  <Check size={17} className="mt-1 shrink-0 text-green-300" />
                  <div className="text-sm leading-7 text-zinc-300">{item}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-green-500/16 bg-[linear-gradient(180deg,rgba(9,32,17,0.82),rgba(11,12,11,0.94))] p-8 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">Plano premium</div>
            <h2 className="mt-5 max-w-[12ch] text-4xl font-black tracking-[-0.04em] text-white">
              Entre quando quiser mais leitura que log.
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-200">
              O premium nao nasce para esconder o produto. Ele nasce para transformar dado solto em direcao,
              contexto e decisao melhor.
            </p>
            <div className="mt-8 space-y-4">
              {premiumFeatures.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/18 px-4 py-4"
                >
                  <Zap size={17} className="mt-1 shrink-0 text-green-300" />
                  <div className="text-sm leading-7 text-zinc-100">{item}</div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-12 rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,12,12,0.96),rgba(8,8,8,0.98))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">Comparativo direto</div>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white">
              O que muda quando voce sobe de nivel
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-400">
              A ideia e simples: o free organiza. O premium interpreta. Essa diferenca precisa ficar obvia.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/10">
            <div className="grid grid-cols-[1.25fr_0.75fr_0.75fr] border-b border-white/10 bg-white/[0.04]">
              <div className="px-5 py-4 text-sm font-semibold text-zinc-300">Recurso</div>
              <div className="px-5 py-4 text-sm font-semibold text-zinc-300">Free</div>
              <div className="px-5 py-4 text-sm font-semibold text-green-300">Premium</div>
            </div>

            {comparisonRows.map((row, index) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.25fr_0.75fr_0.75fr] ${
                  index !== comparisonRows.length - 1 ? "border-b border-white/8" : ""
                }`}
              >
                <div className="px-5 py-4 text-sm leading-7 text-zinc-300">{row.label}</div>
                <div className="px-5 py-4 text-sm font-medium text-zinc-400">{row.free}</div>
                <div className="px-5 py-4 text-sm font-semibold text-white">{row.premium}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[rgba(10,10,10,0.72)] p-8 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">Momento ideal</div>
            <h2 className="mt-5 max-w-[12ch] text-4xl font-black tracking-[-0.04em] text-white">
              Quando faz sentido virar premium?
            </h2>
            <div className="mt-6 space-y-4">
              {[
                "Quando voce ja registra treino com frequencia e quer enxergar melhor o que mudou.",
                "Quando parar de treinar no escuro vale mais do que economizar alguns reais.",
                "Quando IA, comparacao e leitura de progresso passam a economizar decisao e tempo.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-500/16 bg-[linear-gradient(135deg,rgba(8,34,18,0.86),rgba(16,16,16,0.82))] p-8 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">Fechamento</div>
            <h2 className="mt-5 max-w-[11ch] text-4xl font-black tracking-[-0.04em] text-white">
              Comece gratis. Suba quando quiser mais clareza.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-100">
              O Corefit foi pensado para ser util antes de ser cobrado. O premium entra para multiplicar a
              leitura, nao para travar o basico.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={primaryCtaHref}
                className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-black transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href={resolvedLogged ? "/dashboard" : "/login"}
                className="rounded-2xl border border-white/12 bg-black/20 px-6 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-black/30 active:scale-[0.98]"
              >
                {resolvedLogged ? "Voltar para o app" : "Ja tenho conta"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
