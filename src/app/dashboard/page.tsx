"use client";

import "./dashboard.css";

import { useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

import { HeroWorkout } from "@/components/dashboard/HeroWorkout";
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

// Pega ordem por "Treino A/B/C" (estável)
function trainingOrderKey(name?: string) {
  const s = String(name ?? "").toUpperCase();

  const m = s.match(/\bTREINO\s*([A-Z])\b/);
  if (m?.[1]) return m[1].charCodeAt(0); // A=65, B=66, C=67...

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
  useRequireAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const [loading, setLoading] = useState(true);

  // referência do último treino finalizado (id + nome)
  const [lastFinished, setLastFinished] = useState<LastFinishedRef>({
    trainingId: null,
    trainingName: null,
  });

  // força refresh dos KPIs quando iniciar treino
  const [refreshKey, setRefreshKey] = useState(() => String(Date.now()));

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        // 1) verifica ativo
        try {
          const active = await apiFetch<ActiveWorkout | null>("/workouts/active");
          if (!mounted) return;
          setHasActiveWorkout(!!pickId(active ?? undefined));
        } catch {
          if (!mounted) return;
          setHasActiveWorkout(false);
        }

        // 2) carrega treinos (já ordena A/B/C)
        const ts = await apiFetch<Training[]>("/trainings");
        if (!mounted) return;

        const trainingsList: Training[] = Array.isArray(ts) ? ts : [];
        const sortedTrainings = sortTrainingsStable(trainingsList);
        setTrainings(sortedTrainings);

        // 3) pega o último treino FINALIZADO
        try {
          const ws = await apiFetch<WorkoutApiItem[] | { items: WorkoutApiItem[] }>("/workouts");
          if (!mounted) return;

          const list: WorkoutApiItem[] = Array.isArray(ws)
            ? ws
            : Array.isArray((ws as any)?.items)
            ? (ws as any).items
            : [];

          // só finalizados MESMO
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
  }, []);

  const nextTraining = useMemo(() => {
    if (!trainings.length) return null;

    // 1) tenta achar pelo trainingId do workout
    if (lastFinished.trainingId) {
      const idx = trainings.findIndex((t) => pickId(t) === lastFinished.trainingId);
      if (idx >= 0) return trainings[(idx + 1) % trainings.length] ?? trainings[0];
    }

    // 2) fallback: tenta achar pelo trainingName (normalizado)
    if (lastFinished.trainingName) {
      const lastName = normalizeName(lastFinished.trainingName);
      const idxByName = trainings.findIndex((t) => normalizeName(t.name) === lastName);
      if (idxByName >= 0) return trainings[(idxByName + 1) % trainings.length] ?? trainings[0];
    }

    // default
    return trainings[0];
  }, [trainings, lastFinished]);

  const heroData = useMemo(() => {
    const t = nextTraining;
    if (!t) {
      return {
        trainingId: undefined as string | undefined,
        workoutName: "Crie um treino para começar",
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

  return (
    <div className="corefit-bg">
      <div className="corefit-container" style={{ paddingTop: 96, paddingBottom: 40 }}>
        {loading ? (
          <div className="card-dark p-4">Carregando dashboard…</div>
        ) : (
          <div className="dashboard-stack">
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
        )}
      </div>
    </div>
  );
}