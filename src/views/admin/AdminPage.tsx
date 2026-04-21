"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { ApiError, apiFetch } from "@/lib/apiFetch";

type AdminOverview = {
  kpis: {
    totalUsers: number;
    freeUsers: number;
    premiumUsers: number;
    billablePremiumUsers: number;
    internalUsers: number;
    conversionRate: number;
    dau: number;
    wau: number;
    mau: number;
  };
  financial: {
    mrr: number;
    arr: number;
    monthlyPrice: number;
    churnCount: number;
    monthlyGrowthPct: number;
    premiumActivationsThisMonth: number;
    premiumActivationsPrevMonth: number;
    excludedInternalPremiumUsers: number;
    isEstimated: boolean;
  };
  engagement: {
    workoutsPerDay: Array<{ date: string; workouts: number; activeUsers: number; completed: number }>;
    activeUsersPerDay: Array<{ date: string; value: number }>;
    averageWorkoutDurationMinutes: number;
    completionRate: number;
  };
  productUsage: {
    topExercises: Array<{ name: string; count: number }>;
    topTrainings: Array<{ name: string; count: number }>;
    featureUsage: Array<{ name: string; value: number; tracked: boolean }>;
  };
  performance: {
    averageEvolutionKg: number;
    prsThisWeek: number;
    averageVolumeKg: number;
  };
  ai: {
    usersUsingAi: number;
    generatedTrainings: number;
  };
  notes: {
    activeUsersDefinition: string;
    financialDefinition: string;
  };
  growth: {
    usersCreatedThisMonth: number;
    usersCreatedPrevMonth: number;
  };
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  plan: "free" | "premium";
  authProvider: "local" | "google";
  weeklyGoalDays: number;
  createdAt: string | null;
  planUpdatedAt: string | null;
  lastWorkoutAt: string | null;
  lastWorkoutName: string | null;
};

type SortMode = "recent" | "name" | "activity" | "premium";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function formatCompactInt(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Sem registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatRelativeShort(value?: string | null) {
  if (!value) return "Sem atividade";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem atividade";
  const diff = Date.now() - date.getTime();
  const day = 86400000;
  if (diff < day) return "Hoje";
  if (diff < day * 2) return "Ontem";
  if (diff < day * 7) return `${Math.floor(diff / day)}d atras`;
  return formatDate(value);
}

function toMillis(value?: string | null) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function daysSince(value?: string | null) {
  const ms = toMillis(value);
  if (!ms) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - ms) / 86400000);
}

function buildLinePath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  const max = Math.max(1, ...values);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * (height - 14) - 7;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  const line = buildLinePath(values, width, height);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

export default function NovaAdminPage() {
  const feedbackRef = useRef<HTMLElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "premium">("all");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{ userName: string; password: string } | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [visibleUsersCount, setVisibleUsersCount] = useState(6);

  const loadAdminData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMessage(null);

    try {
      const currentQuery = query.trim();
      const [overviewData, usersData] = await Promise.all([
        apiFetch<AdminOverview>("/admin/overview"),
        apiFetch<AdminUser[]>(
          `/admin/users?plan=${planFilter}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`
        ),
      ]);

      setOverview(overviewData);
      setUsers(usersData);
      setAccessState("authorized");
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setAccessState("unauthorized");
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Nao foi possivel carregar a visao administrativa."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setAccessState("unauthorized");
      setLoading(false);
      return;
    }

    setAccessState("authorized");
  }, []);

  useEffect(() => {
    if (accessState !== "authorized") return;
    void loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessState, planFilter]);

  useEffect(() => {
    setVisibleUsersCount(6);
  }, [query, planFilter, sortMode]);

  const executiveKpis = useMemo(() => {
    if (!overview) return null;

    return [
      {
        title: "Receita recorrente",
        value: formatMoney(overview.financial.mrr),
        supporting: `${formatMoney(overview.financial.arr)} ARR • ${formatCompactInt(
          overview.kpis.billablePremiumUsers
        )} pagantes`,
        badge: `${formatPercent(overview.financial.monthlyGrowthPct)} no mes`,
        tone: "green" as const,
      },
      {
        title: "Base premium",
        value: formatCompactInt(overview.kpis.premiumUsers),
        supporting: `${formatCompactInt(overview.kpis.billablePremiumUsers)} pagantes • ${formatPercent(
          overview.kpis.conversionRate
        )} de conversao`,
        badge: `${formatCompactInt(overview.financial.excludedInternalPremiumUsers)} interno(s) fora da receita`,
        tone: "neutral" as const,
      },
      {
        title: "Atividade semanal",
        value: formatCompactInt(overview.kpis.wau),
        supporting: `${formatCompactInt(overview.kpis.dau)} DAU • ${formatCompactInt(overview.kpis.mau)} MAU`,
        badge: `${formatPercent(overview.engagement.completionRate)} concluem treino`,
        tone: "neutral" as const,
      },
      {
        title: "Performance media",
        value: `${overview.performance.averageEvolutionKg} kg`,
        supporting: `${overview.performance.prsThisWeek} PRs esta semana`,
        badge: `${overview.performance.averageVolumeKg.toLocaleString("pt-BR")} kg de volume`,
        tone: "neutral" as const,
      },
    ];
  }, [overview]);

  const workoutsValues = useMemo(
    () => (overview?.engagement.workoutsPerDay ?? []).map((item) => item.workouts),
    [overview]
  );
  const activeValues = useMemo(
    () => (overview?.engagement.activeUsersPerDay ?? []).map((item) => item.value),
    [overview]
  );
  const workoutLabels = useMemo(
    () => overview?.engagement.workoutsPerDay.map((item) => item.date.slice(5)) ?? [],
    [overview]
  );
  const activeLabels = useMemo(
    () => overview?.engagement.activeUsersPerDay.map((item) => item.date.slice(5)) ?? [],
    [overview]
  );

  const filteredAndSortedUsers = useMemo(() => {
    const list = [...users];

    list.sort((a, b) => {
      switch (sortMode) {
        case "name":
          return a.name.localeCompare(b.name, "pt-BR");
        case "activity":
          return toMillis(b.lastWorkoutAt) - toMillis(a.lastWorkoutAt);
        case "premium":
          if (a.plan !== b.plan) return a.plan === "premium" ? -1 : 1;
          return toMillis(b.createdAt) - toMillis(a.createdAt);
        case "recent":
        default:
          return toMillis(b.createdAt) - toMillis(a.createdAt);
      }
    });

    return list;
  }, [users, sortMode]);

  const visibleUsers = useMemo(
    () => filteredAndSortedUsers.slice(0, visibleUsersCount),
    [filteredAndSortedUsers, visibleUsersCount]
  );

  const userSummary = useMemo(() => {
    const total = filteredAndSortedUsers.length;
    const premium = filteredAndSortedUsers.filter((user) => user.plan === "premium").length;
    const admins = filteredAndSortedUsers.filter((user) => user.role === "admin").length;
    const active = filteredAndSortedUsers.filter((user) => !!user.lastWorkoutName).length;

    return { total, premium, admins, active };
  }, [filteredAndSortedUsers]);

  const smartAlerts = useMemo(() => {
    const inactiveUsers = users.filter((user) => daysSince(user.lastWorkoutAt) >= 3).length;
    const premiumOpportunities = users.filter(
      (user) =>
        user.role !== "admin" &&
        user.plan === "free" &&
        !!user.lastWorkoutName &&
        daysSince(user.lastWorkoutAt) <= 7
    ).length;

    const workoutSeries = overview?.engagement.workoutsPerDay ?? [];
    const midpoint = Math.ceil(workoutSeries.length / 2);
    const firstHalf = workoutSeries.slice(0, midpoint).reduce((acc, item) => acc + item.workouts, 0);
    const secondHalf = workoutSeries.slice(midpoint).reduce((acc, item) => acc + item.workouts, 0);
    const activityDelta = secondHalf - firstHalf;

    return [
      {
        tone: inactiveUsers > 0 ? "amber" : "green",
        title:
          inactiveUsers > 0
            ? `${inactiveUsers} usuario(s) sem treino recente`
            : "Base treinando sem sinais de pausa",
        body:
          inactiveUsers > 0
            ? "Vale acionar recuperacao, suporte ou incentivo antes de esfriar a rotina."
            : "Nenhum grupo relevante ficou parado por 3 dias ou mais.",
      },
      {
        tone: premiumOpportunities > 0 ? "green" : "neutral",
        title:
          premiumOpportunities > 0
            ? `${premiumOpportunities} usuario(s) com perfil de upgrade`
            : "Sem oportunidade clara de upgrade agora",
        body:
          premiumOpportunities > 0
            ? "Usuarios free ativos nesta semana ja mostram contexto para oferta premium."
            : "Acompanhe a retomada de uso para identificar o melhor timing de conversao.",
      },
      {
        tone: activityDelta < 0 ? "red" : "green",
        title:
          activityDelta < 0
            ? "Atividade caiu na segunda metade da semana"
            : "Atividade sustentada na segunda metade da semana",
        body:
          activityDelta < 0
            ? "A queda recente merece leitura rapida para evitar perda de ritmo na base."
            : "O volume mais recente segurou bem e indica consistencia operacional.",
      },
    ] as const;
  }, [overview, users]);

  const handleSearch = async () => {
    if (accessState !== "authorized") return;
    await loadAdminData(true);
  };

  const handlePlanChange = async (userId: string, nextPlan: "free" | "premium") => {
    setActionKey(`plan-${userId}`);
    setStatusMessage(null);
    setTemporaryPassword(null);

    try {
      await apiFetch(`/admin/users/${userId}/plan`, {
        method: "PATCH",
        body: { plan: nextPlan },
      });

      setStatusMessage(
        nextPlan === "premium"
          ? "Plano atualizado para premium com sucesso."
          : "Usuario movido para o plano free."
      );
      await loadAdminData(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o plano.");
    } finally {
      setActionKey(null);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    setActionKey(`password-${userId}`);
    setStatusMessage(null);
    setErrorMessage(null);
    setTemporaryPassword(null);

    try {
      const response = await apiFetch<{ ok: true; temporaryPassword: string }>(
        `/admin/users/${userId}/reset-password`,
        { method: "POST" }
      );

      setTemporaryPassword({ userName, password: response.temporaryPassword });
      setStatusMessage("Senha temporaria gerada. Compartilhe por canal seguro e peca troca imediata.");
      requestAnimationFrame(() => {
        feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setAccessState("unauthorized");
      }
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel resetar a senha.");
    } finally {
      setActionKey(null);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword.password);
      setStatusMessage("Senha temporaria copiada para a area de transferencia.");
    } catch {
      setErrorMessage("Nao consegui copiar automaticamente. Pode copiar manualmente.");
    }
  };

  if (accessState === "unauthorized") {
    return (
      <main className="min-h-screen bg-[#040404] text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 pt-24">
          <div className="w-full rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,15,0.96),rgba(8,9,8,0.92))] p-10 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              Painel protegido
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
              Essa area e restrita ao admin do Corefit.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Para abrir a area admin, entre com um token que tenha `role: admin`.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-landing.png')",
            backgroundPosition: "center top",
            filter: "brightness(0.26) contrast(1.08) saturate(1.05)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(34,197,94,0.18),transparent_18%),radial-gradient(circle_at_78%_10%,rgba(34,197,94,0.16),transparent_22%),linear-gradient(180deg,rgba(3,3,3,0.84)_0%,rgba(3,3,3,0.7)_24%,rgba(3,3,3,0.94)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-28">
        <section className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-[2.35rem] border border-green-500/16 bg-[linear-gradient(180deg,rgba(8,32,17,0.88),rgba(11,14,12,0.92))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.42),0_0_90px_rgba(34,197,94,0.08)] backdrop-blur-xl sm:p-9">
            <div className="inline-flex items-center gap-3 rounded-full border border-green-400/18 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-green-300">
              <ShieldCheck size={14} />
              Business intelligence dashboard
            </div>

            <h1 className="mt-7 max-w-[11ch] text-5xl font-black leading-[0.9] tracking-[-0.055em] text-white sm:text-6xl">
              Corefit no comando.
              <span className="block text-green-400">Leitura executiva. Ação imediata.</span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-300">
              Agora a area admin ja une visao de negocio, saude do produto e operacao manual em uma camada mais
              executiva. O objetivo aqui e decidir rapido e agir sem atrito.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {executiveKpis?.map((card) => (
                <ExecutiveKpiCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  supporting={card.supporting}
                  badge={card.badge}
                  tone={card.tone}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,11,0.96),rgba(8,8,8,0.94))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                  Operacao rapida
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white">Controle de usuarios</h2>
              </div>

              <button
                onClick={() => void loadAdminData(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:border-white/16 hover:bg-white/[0.08]"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                Atualizar
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <label className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Search size={16} className="text-zinc-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por nome ou email"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                  />
                </div>
              </label>

              <div className="flex flex-wrap gap-3">
                {[
                  { value: "all", label: "Todos" },
                  { value: "free", label: "Free" },
                  { value: "premium", label: "Premium" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setPlanFilter(item.value as "all" | "free" | "premium")}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                      planFilter === item.value
                        ? "border-green-400/30 bg-green-500/12 text-green-200"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/16 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={() => void handleSearch()}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:border-white/16 hover:bg-white/[0.08]"
                >
                  Aplicar busca
                </button>
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-4">
                <CompactSummaryStat label="Base filtrada" value={formatCompactInt(userSummary.total)} />
                <CompactSummaryStat label="Premium" value={formatCompactInt(userSummary.premium)} />
                <CompactSummaryStat label="Admins" value={formatCompactInt(userSummary.admins)} />
                <CompactSummaryStat label="Com atividade" value={formatCompactInt(userSummary.active)} />
              </div>
            </div>
          </div>
        </section>

        {(statusMessage || errorMessage || temporaryPassword) && (
          <section ref={feedbackRef} className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div
              className={`rounded-[1.6rem] border px-5 py-4 text-sm leading-7 ${
                errorMessage
                  ? "border-red-500/25 bg-red-500/10 text-red-100"
                  : "border-green-500/20 bg-green-500/10 text-green-100"
              }`}
            >
              {errorMessage ?? statusMessage}
            </div>

            {temporaryPassword && (
              <div className="rounded-[1.6rem] border border-amber-400/20 bg-amber-400/10 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                      Senha temporaria
                    </div>
                    <div className="mt-2 text-sm text-amber-50">{temporaryPassword.userName}</div>
                    <div className="mt-3 font-mono text-base font-semibold tracking-[0.04em] text-white">
                      {temporaryPassword.password}
                    </div>
                  </div>

                  <button
                    onClick={() => void copyTemporaryPassword()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-white/15"
                  >
                    <Copy size={15} />
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <PremiumTrendPanel
                title="Treinos por dia"
                subtitle="Ultimos 7 dias"
                metaLabel="7 dias"
                value={formatCompactInt(workoutsValues.reduce((acc, value) => acc + value, 0))}
                secondary={`${formatPercent(overview?.engagement.completionRate ?? 0)} de conclusao`}
                labels={workoutLabels}
                values={workoutsValues}
                accent="green"
              />

              <PremiumTrendPanel
                title="Usuarios ativos"
                subtitle="Ultimos 7 dias"
                metaLabel="atividade recente"
                value={formatCompactInt(activeValues.reduce((acc, value) => Math.max(acc, value), 0))}
                secondary={`${formatCompactInt(overview?.kpis.wau ?? 0)} WAU no periodo`}
                labels={activeLabels}
                values={activeValues}
                accent="white"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <MetricPanel
                title="Financeiro"
                badge="Receita"
                icon={<Crown size={16} />}
                lines={[
                  { label: "MRR", value: overview ? formatMoney(overview.financial.mrr) : "--" },
                  { label: "ARR", value: overview ? formatMoney(overview.financial.arr) : "--" },
                  {
                    label: "Premium pagante",
                    value: overview ? formatCompactInt(overview.kpis.billablePremiumUsers) : "--",
                  },
                ]}
                footnote={overview?.notes.financialDefinition}
              />

              <MetricPanel
                title="Engajamento"
                badge="Retencao"
                icon={<Users size={16} />}
                lines={[
                  {
                    label: "Conclusao",
                    value: overview ? formatPercent(overview.engagement.completionRate) : "--",
                  },
                  {
                    label: "Duracao media",
                    value: overview
                      ? `${overview.engagement.averageWorkoutDurationMinutes.toLocaleString("pt-BR")} min`
                      : "--",
                  },
                  { label: "WAU", value: overview ? formatCompactInt(overview.kpis.wau) : "--" },
                ]}
                footnote={overview?.notes.activeUsersDefinition}
              />

              <MetricPanel
                title="Performance"
                badge="Produto"
                icon={<Zap size={16} />}
                lines={[
                  {
                    label: "PRs / semana",
                    value: overview ? formatCompactInt(overview.performance.prsThisWeek) : "--",
                  },
                  {
                    label: "Evolucao media",
                    value: overview ? `${overview.performance.averageEvolutionKg} kg` : "--",
                  },
                  {
                    label: "Volume medio",
                    value: overview ? `${overview.performance.averageVolumeKg.toLocaleString("pt-BR")} kg` : "--",
                  },
                ]}
                footnote="Leitura objetiva da saude de resultado da base."
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <ListPanel
                title="Exercicios mais usados"
                items={overview?.productUsage.topExercises.map((item) => ({
                  label: item.name,
                  value: `${item.count}x`,
                })) ?? []}
              />

              <ListPanel
                title="Treinos mais feitos"
                items={overview?.productUsage.topTrainings.map((item) => ({
                  label: item.name,
                  value: `${item.count}x`,
                })) ?? []}
              />

              <ListPanel
                title="Uso do produto"
                items={overview?.productUsage.featureUsage.map((item) => ({
                  label: item.name,
                  value: item.tracked ? formatCompactInt(item.value) : "Coleta em andamento",
                })) ?? []}
              />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-green-500/16 bg-[linear-gradient(180deg,rgba(9,32,17,0.86),rgba(10,12,11,0.95))] p-6">
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                <Sparkles size={14} />
                Alertas operacionais
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">
                O que pede ação agora
              </h2>
              <div className="mt-5 space-y-3">
                {smartAlerts.map((alert) => (
                  <div
                    key={alert.title}
                    className={`rounded-2xl border px-4 py-4 ${
                      alert.tone === "green"
                        ? "border-green-400/18 bg-green-500/10"
                        : alert.tone === "amber"
                        ? "border-amber-400/18 bg-amber-400/10"
                        : alert.tone === "red"
                        ? "border-red-400/18 bg-red-500/10"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{alert.title}</div>
                    <div className="mt-2 text-sm leading-7 text-zinc-300">{alert.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,14,13,0.95),rgba(8,8,8,0.96))] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                Proximo passo BI
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">
                O core ja esta de pe. Agora entra a camada de inteligencia real.
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  "Conectar billing real para churn, receita liquida, upgrades e historico financeiro confiavel.",
                  "Instrumentar eventos de feature para IA, historico, comparacao, troca de exercicio e funil de uso.",
                  "Liberar exportacao operacional para suporte, growth e auditoria sem depender de consulta manual.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-zinc-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-green-500/16 bg-[linear-gradient(180deg,rgba(9,32,17,0.86),rgba(10,12,11,0.95))] p-6">
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                <Sparkles size={14} />
                Assistente operacional
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ExecutiveMiniCard
                  title="Novos usuarios no mes"
                  value={overview ? formatCompactInt(overview.growth.usersCreatedThisMonth) : "--"}
                  helper="Entrada bruta na base"
                />
                <ExecutiveMiniCard
                  title="Ativacoes premium"
                  value={overview ? formatCompactInt(overview.financial.premiumActivationsThisMonth) : "--"}
                  helper="Pagantes novos do periodo"
                />
              </div>
              <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
                Hoje o painel ja sustenta operacao, suporte e leitura de base. O proximo salto e trocar estimativa
                por telemetria e faturamento reais.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,12,12,0.96),rgba(8,8,8,0.98))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                Suporte e billing manual
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">
                Operacoes criticas por usuario
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Mais compacto para operar hoje e mais preparado para escalar amanha: ordene, expanda e aja
                sem transformar a tela em um feed infinito de cards pesados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                {filteredAndSortedUsers.length} usuarios
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "recent", label: "Recentes" },
                  { value: "activity", label: "Atividade" },
                  { value: "premium", label: "Premium" },
                  { value: "name", label: "Nome" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSortMode(item.value as SortMode)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      sortMode === item.value
                        ? "border-green-400/30 bg-green-500/12 text-green-200"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <CompactSummaryStat label="Exibidos" value={formatCompactInt(visibleUsers.length)} />
            <CompactSummaryStat label="Premium" value={formatCompactInt(userSummary.premium)} />
            <CompactSummaryStat label="Admins" value={formatCompactInt(userSummary.admins)} />
            <CompactSummaryStat label="Com historico" value={formatCompactInt(userSummary.active)} />
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-zinc-400">
                Carregando visao administrativa...
              </div>
            ) : filteredAndSortedUsers.length === 0 ? (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-zinc-400">
                Nenhum usuario encontrado com esse filtro.
              </div>
            ) : (
              <>
                {visibleUsers.map((user) => {
                  const isPremium = user.plan === "premium";
                  const isExpanded = expandedUserId === user.id;
                  const currentActionKey = actionKey ?? "";

                  return (
                    <article
                      key={user.id}
                      className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 transition duration-200 hover:border-white/14 hover:bg-white/[0.045]"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-2xl font-bold tracking-[-0.03em] text-white">{user.name}</div>
                            <UserChip tone={isPremium ? "green" : "neutral"}>{user.plan}</UserChip>
                            <UserChip tone={user.role === "admin" ? "amber" : "neutral"}>{user.role}</UserChip>
                            <UserChip tone="neutral">{user.authProvider}</UserChip>
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">{user.email}</div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[560px] xl:max-w-[560px]">
                          <MiniMetric title="Meta" value={`${user.weeklyGoalDays} dias`} />
                          <MiniMetric title="Criado" value={formatDate(user.createdAt)} />
                          <MiniMetric
                            title="Ultimo treino"
                            value={user.lastWorkoutName ?? "Sem treino"}
                            hint={formatRelativeShort(user.lastWorkoutAt)}
                          />
                          <MiniMetric title="Plano alterado" value={formatDate(user.planUpdatedAt)} />
                        </div>

                        <div className="flex flex-col gap-3 xl:min-w-[290px]">
                          <button
                            onClick={() => void handlePlanChange(user.id, isPremium ? "free" : "premium")}
                            disabled={currentActionKey === `plan-${user.id}`}
                            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                              isPremium
                                ? "border border-white/10 bg-white/[0.04] text-white hover:border-white/16 hover:bg-white/[0.08]"
                                : "bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.18)] hover:bg-green-400"
                            } ${currentActionKey === `plan-${user.id}` ? "opacity-70" : ""}`}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <span>
                                {currentActionKey === `plan-${user.id}`
                                  ? "Atualizando..."
                                  : isPremium
                                  ? "Mover para free"
                                  : "Promover para premium"}
                              </span>
                              {!isPremium && currentActionKey !== `plan-${user.id}` ? (
                                <span className="rounded-full border border-black/10 bg-black/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-black/80">
                                  +{formatMoney(overview?.financial.monthlyPrice ?? 0)}/mes
                                </span>
                              ) : null}
                            </span>
                          </button>

                          <div className="flex gap-3">
                            <button
                              onClick={() => void handleResetPassword(user.id, user.name)}
                              disabled={currentActionKey === `password-${user.id}`}
                              className={`flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:border-white/16 hover:bg-white/[0.08] ${
                                currentActionKey === `password-${user.id}` ? "opacity-70" : ""
                              }`}
                            >
                              {currentActionKey === `password-${user.id}` ? "Gerando..." : "Resetar senha"}
                            </button>

                            <button
                              onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition duration-200 hover:border-white/16 hover:bg-white/[0.08]"
                              aria-label={isExpanded ? "Recolher usuario" : "Expandir usuario"}
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-green-500/16 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-100">
                        {user.lastWorkoutName
                          ? `Ultima atividade: ${user.lastWorkoutName}`
                          : "Usuario ainda sem treino registrado."}
                      </div>

                      {isExpanded && (
                        <div className="mt-4 grid gap-4 border-t border-white/8 pt-4 md:grid-cols-[1fr_0.85fr]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <ExpandedInfoCard
                              title="Leitura do perfil"
                              lines={[
                                `Plano atual: ${user.plan}`,
                                `Papel no sistema: ${user.role}`,
                                `Metodo de acesso: ${user.authProvider}`,
                              ]}
                            />
                            <ExpandedInfoCard
                              title="Recorte operacional"
                              lines={[
                                `Meta semanal configurada: ${user.weeklyGoalDays} dias`,
                                `Criado em: ${formatDate(user.createdAt)}`,
                                `Ultima troca de plano: ${formatDate(user.planUpdatedAt)}`,
                              ]}
                            />
                          </div>

                          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                              Proxima leitura sugerida
                            </div>
                            <div className="mt-3 text-sm leading-7 text-zinc-300">
                              {user.lastWorkoutName
                                ? `Usuario com historico recente em ${user.lastWorkoutName}. Vale monitorar recorrencia antes de promover manualmente.`
                                : "Usuario sem historico recente. Em caso de suporte, resetar senha e validar onboarding costuma ser a acao mais util."}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}

                {visibleUsersCount < filteredAndSortedUsers.length && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleUsersCount((count) => count + 6)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:border-white/16 hover:bg-white/[0.08]"
                    >
                      Mostrar mais usuarios
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ExecutiveKpiCard({
  title,
  value,
  supporting,
  badge,
  tone,
}: {
  title: string;
  value: string;
  supporting: string;
  badge: string;
  tone: "green" | "neutral";
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-5 ${
        tone === "green"
          ? "border-green-400/18 bg-green-500/[0.08]"
          : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">{title}</div>
      <div className="mt-4 text-4xl font-black tracking-[-0.06em] text-white">{value}</div>
      <div className="mt-2 text-sm text-zinc-300">{supporting}</div>
      <div
        className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
          tone === "green"
            ? "border-green-400/22 bg-green-500/10 text-green-200"
            : "border-white/10 bg-white/[0.04] text-zinc-300"
        }`}
      >
        {badge}
      </div>
    </div>
  );
}

function CompactSummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">{value}</div>
    </div>
  );
}

function PremiumTrendPanel({
  title,
  subtitle,
  metaLabel,
  value,
  secondary,
  labels,
  values,
  accent,
}: {
  title: string;
  subtitle: string;
  metaLabel: string;
  value: string;
  secondary: string;
  labels: string[];
  values: number[];
  accent: "green" | "white";
}) {
  const width = 520;
  const height = 220;
  const linePath = buildLinePath(values, width, height);
  const areaPath = buildAreaPath(values, width, height);
  const accentColor = accent === "green" ? "#4ade80" : "#f4f4f5";
  const accentSoft = accent === "green" ? "rgba(74,222,128,0.18)" : "rgba(244,244,245,0.14)";

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,13,13,0.96),rgba(8,8,8,0.98))] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">{subtitle}</div>
          <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">{title}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{metaLabel}</div>
          <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">{value}</div>
          <div className="mt-1 text-xs text-zinc-400">{secondary}</div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.7rem] border border-white/8 bg-black/20 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
          <defs>
            <linearGradient id={`gradient-${title.replace(/\s+/g, "-")}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accentSoft} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((index) => {
            const y = 20 + index * 48;
            return (
              <line
                key={index}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="6 8"
              />
            );
          })}

          <path d={areaPath} fill={`url(#gradient-${title.replace(/\s+/g, "-")})`} />
          <path d={linePath} fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />

          {values.map((point, index) => {
            const max = Math.max(1, ...values);
            const x = values.length > 1 ? (index * width) / (values.length - 1) : width / 2;
            const y = height - (point / max) * (height - 14) - 7;
            return (
              <g key={`${title}-${index}`}>
                <circle cx={x} cy={y} r="7" fill={accentColor} fillOpacity="0.18" />
                <circle cx={x} cy={y} r="4" fill={accentColor} />
              </g>
            );
          })}
        </svg>

        <div className="mt-3 flex items-center justify-between gap-2">
          {labels.map((label) => (
            <div key={`${title}-${label}`} className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricPanel({
  title,
  badge,
  icon,
  lines,
  footnote,
}: {
  title: string;
  badge: string;
  icon: ReactNode;
  lines: Array<{ label: string; value: string }>;
  footnote?: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,13,13,0.95),rgba(8,8,8,0.96))] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
          {icon}
          {badge}
        </div>
        <div className="text-sm text-zinc-500">{title}</div>
      </div>

      <div className="mt-5 space-y-4">
        {lines.map((line) => (
          <div key={line.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              {line.label}
            </div>
            <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">{line.value}</div>
          </div>
        ))}
      </div>

      {footnote && <div className="mt-4 text-sm leading-6 text-zinc-500">{footnote}</div>}
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,13,13,0.95),rgba(8,8,8,0.96))] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">{title}</div>
      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <div className="text-sm text-zinc-300">{item.label}</div>
              <div className="text-sm font-semibold text-white">{item.value}</div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-zinc-500">
            Sem dados suficientes ainda.
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutiveMiniCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
      <div className="text-sm text-zinc-300">{title}</div>
      <div className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-2 text-xs leading-6 text-zinc-500">{helper}</div>
    </div>
  );
}

function UserChip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "amber" | "neutral";
}) {
  const styles =
    tone === "green"
      ? "border-green-400/24 bg-green-500/12 text-green-200"
      : tone === "amber"
      ? "border-amber-400/24 bg-amber-400/10 text-amber-100"
      : "border-white/10 bg-white/[0.04] text-zinc-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${styles}`}>
      {children}
    </span>
  );
}

function MiniMetric({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/8 bg-black/16 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{title}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function ExpandedInfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">{title}</div>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <div key={line} className="text-sm leading-7 text-zinc-300">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
