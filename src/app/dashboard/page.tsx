"use client";

import "./dashboard.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { apiFetch } from "@/lib/apiFetch";
import { getAuthSession, isAdminSession } from "@/lib/auth-session";
import { CFBadge, CFSection } from "@/components/corefit/primitives";

import { HeroWorkout } from "@/components/dashboard/HeroWorkout";
import { MembershipSpotlight } from "@/components/dashboard/MembershipSpotlight";
import { PremiumCommandCenter } from "@/components/dashboard/PremiumCommandCenter";
import { PremiumPreviewGate } from "@/components/dashboard/PremiumPreviewGate";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LastWorkout } from "@/components/dashboard/LastWorkout";
import { WorkoutsList } from "@/components/dashboard/WorkoutsList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProgressSection } from "@/components/dashboard/ProgressSection";

type Training = {
  id?: string;
  _id?: string;
  name: string;
  type?: string;
  exercises?: any[];
};

type ActiveWorkout = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
};

type WorkoutApiItem = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
  startedAt?: string;
  finishedAt?: string;
  endedAt?: string;
  trainingId?: string;
  trainingName?: string;
};

type LastFinishedRef = {
  trainingId: string | null;
  trainingName: string | null;
};

function pickId(obj: { id?: string; _id?: string } | null | undefined): string {
  return String(obj?.id ?? obj?._id ?? "");
}

function safeTimeMs(iso?: string) {
  if (!iso) return 0;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeName(s: any) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function trainingOrderKey(name?: string) {
  const s = String(name ?? "").toUpperCase();

  const m = s.match(/\bTREINO\s*([A-Z])\b/);
  if (m?.[1]) return m[1].charCodeAt(0);

  const n = s.match(/\bTREINO\s*(\d+)\b/);
  if (n?.[1]) return 1000 + Number(n[1]);

  return 9999;
}

function sortTrainingsStable(list: Training[]) {
  return [...list].sort((a, b) => {
    const ka = trainingOrderKey(a.name);
    const kb = trainingOrderKey(b.name);
    if (ka !== kb) return ka - kb;
    return String(a.name).localeCompare(String(b.name), "pt-BR");
  });
}

export default function DashboardPage() {
  const router = useRouter();
  useRequireAuth();
  const { hasPremiumAccess, session } = usePremiumAccess();
  const isAdmin = isAdminSession(session);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastFinished, setLastFinished] = useState<LastFinishedRef>({
    trainingId: null,
    trainingName: null,
  });
  const [refreshKey, setRefreshKey] = useState(() => String(Date.now()));

  useEffect(() => {
    if (isAdminSession(getAuthSession())) {
      router.replace("/admin");
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;

    if (isAdminSession(getAuthSession())) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    async function load() {
      setLoading(true);

      try {
        try {
          const active = await apiFetch<ActiveWorkout | null>("/workouts/active");
          if (!mounted) return;
          setHasActiveWorkout(!!pickId(active ?? undefined));
        } catch {
          if (!mounted) return;
          setHasActiveWorkout(false);
        }

        const ts = await apiFetch<Training[]>("/trainings");
        if (!mounted) return;

        const trainingsList: Training[] = Array.isArray(ts) ? ts : [];
        const sortedTrainings = sortTrainingsStable(trainingsList);
        setTrainings(sortedTrainings);

        try {
          const ws = await apiFetch<WorkoutApiItem[] | { items: WorkoutApiItem[] }>("/workouts");
          if (!mounted) return;

          const list: WorkoutApiItem[] = Array.isArray(ws)
            ? ws
            : Array.isArray((ws as any)?.items)
              ? (ws as any).items
              : [];

          const finishedOnly = list.filter((w) => w.status === "finished");

          const ranked = finishedOnly
            .map((w) => {
              const endIso = w.finishedAt ?? w.endedAt ?? w.startedAt;
              return {
                trainingId: String(w.trainingId ?? ""),
                trainingName: String(w.trainingName ?? ""),
                endMs: safeTimeMs(endIso),
              };
            })
            .filter((x) => x.endMs > 0 && (x.trainingId || x.trainingName))
            .sort((a, b) => b.endMs - a.endMs);

          const last = ranked[0];
          setLastFinished({
            trainingId: last?.trainingId ? last.trainingId : null,
            trainingName: last?.trainingName ? last.trainingName : null,
          });
        } catch {
          if (!mounted) return;
          setLastFinished({ trainingId: null, trainingName: null });
        }
      } catch {
        if (!mounted) return;
        setTrainings([]);
        setLastFinished({ trainingId: null, trainingName: null });
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const nextTraining = useMemo(() => {
    if (!trainings.length) return null;

    if (lastFinished.trainingId) {
      const idx = trainings.findIndex((t) => pickId(t) === lastFinished.trainingId);
      if (idx >= 0) return trainings[(idx + 1) % trainings.length] ?? trainings[0];
    }

    if (lastFinished.trainingName) {
      const lastName = normalizeName(lastFinished.trainingName);
      const idxByName = trainings.findIndex((t) => normalizeName(t.name) === lastName);
      if (idxByName >= 0) return trainings[(idxByName + 1) % trainings.length] ?? trainings[0];
    }

    return trainings[0];
  }, [trainings, lastFinished]);

  const heroData = useMemo(() => {
    const t = nextTraining;
    if (!t) {
      return {
        trainingId: undefined as string | undefined,
        workoutName: "Crie um treino para comecar",
        workoutType: "Sem treino",
        exerciseCount: 0,
      };
    }

    return {
      trainingId: pickId(t),
      workoutName: t.name,
      workoutType: t.type ?? "Treino",
      exerciseCount: t.exercises?.length ?? 0,
    };
  }, [nextTraining]);

  if (loading) {
    return (
      <div className="corefit-bg dashboard-page">
        <div className="corefit-container dashboard-container">
          <div className="card-dark p-4">Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="corefit-bg dashboard-page">
        <div className="corefit-container dashboard-container">
          <div className="card-dark p-4">Abrindo painel admin...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`corefit-bg dashboard-page ${hasPremiumAccess ? "dashboard-page--premium" : "dashboard-page--free"}`}>
      <div className="corefit-container dashboard-container">
        <div className="dashboard-stack">
          <CFSection tone="accent" padding="lg" className="overflow-hidden">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <CFBadge className="w-fit">
                  {hasPremiumAccess ? "Corefit premium ativo" : "Corefit dashboard"}
                </CFBadge>
                <h1 className="mt-6 max-w-[13ch] text-4xl font-black leading-[0.95] tracking-[-0.05em] text-white sm:text-5xl">
                  {hasPremiumAccess
                    ? "Sua camada premium ja esta pronta para entrar no fluxo."
                    : "Sua rotina ja esta organizada. Agora o produto precisa ler isso com voce."}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                  {hasPremiumAccess
                    ? "Treino, progresso e IA agora precisam parecer a mesma experiencia. Esse dashboard passa a ser o centro da sua leitura diaria dentro do Corefit."
                    : "Aqui comeca a parte viva do produto: entender o treino de hoje, ver consistencia e decidir o proximo passo sem sair do ritmo."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Conta
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">
                    {session?.role === "admin" ? "Admin" : "Atleta"}
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {session?.name || session?.email || "Corefit user"}
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Camada
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">
                    {hasPremiumAccess ? "Premium" : "Free"}
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {hasPremiumAccess ? "IA e leitura avancada liberadas" : "Base operacional ativa"}
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Centro
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">Dashboard</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    Seu ponto de entrada diario no produto
                  </div>
                </div>
              </div>
            </div>
          </CFSection>

          <HeroWorkout
            trainingId={heroData.trainingId}
            workoutName={heroData.workoutName}
            workoutType={heroData.workoutType}
            exerciseCount={heroData.exerciseCount}
            isActive={hasActiveWorkout}
            onStarted={() => {
              setHasActiveWorkout(true);
              setRefreshKey(String(Date.now()));
            }}
          />

          <MembershipSpotlight />
          {hasPremiumAccess ? <PremiumCommandCenter /> : <PremiumPreviewGate />}

          <StatsCards refreshKey={refreshKey} />
          <ProgressSection refreshKey={refreshKey} />

          <div className="dashboard-grid">
            <div className="left-col">
              <WorkoutsList />
              <QuickActions />
            </div>

            <div className="right-col">
              <LastWorkout />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
