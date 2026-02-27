// corefit-frontend/src/app/dashboard/page.tsx
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
  trainingId?: string;
  trainingName?: string;
  startedAt?: string;
};

type WorkoutApiItem = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
  trainingId?: string;
  trainingName?: string;
  startedAt?: string;
  finishedAt?: string;
  endedAt?: string;
};

function pickId<T extends { id?: string; _id?: string }>(x: T) {
  return String(x?.id ?? x?._id ?? "");
}

function pickTrainingIdFromWorkout(w: WorkoutApiItem) {
  return String(w?.trainingId ?? "");
}

function pickWorkoutEndIso(w: WorkoutApiItem) {
  return w?.finishedAt ?? w?.endedAt ?? w?.startedAt ?? null;
}

export default function DashboardPage() {
  useRequireAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const [lastFinishedTrainingId, setLastFinishedTrainingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

          const activeExists = !!(active?.id || active?._id);
          setHasActiveWorkout(activeExists);
        } catch {
          if (!mounted) return;
          setHasActiveWorkout(false);
        }

        // 2) carrega treinos
        const ts = await apiFetch<Training[]>("/trainings");
        if (!mounted) return;

        const trainingsList: Training[] = Array.isArray(ts) ? ts : [];
        setTrainings(trainingsList);

        // 3) último treino finalizado → sugerir próximo no ciclo
        try {
          const ws = await apiFetch<WorkoutApiItem[] | { items: WorkoutApiItem[] }>("/workouts");
          if (!mounted) return;

          const list: WorkoutApiItem[] = Array.isArray(ws)
            ? ws
            : Array.isArray((ws as any)?.items)
              ? (ws as any).items
              : [];

          type WithEnd = { w: WorkoutApiItem; endMs: number };

          const finishedSorted: WithEnd[] = (list ?? [])
            .filter((w: WorkoutApiItem) => (w?.status ? w.status === "finished" : true))
            .map((w: WorkoutApiItem) => {
              const endIso = pickWorkoutEndIso(w);
              const endMs = endIso ? new Date(endIso).getTime() : 0;
              return { w, endMs };
            })
            .filter((x: WithEnd) => Number.isFinite(x.endMs) && x.endMs > 0)
            .sort((a: WithEnd, b: WithEnd) => b.endMs - a.endMs);

          const last = finishedSorted[0]?.w;
          const lastTid = last ? pickTrainingIdFromWorkout(last) : "";

          setLastFinishedTrainingId(lastTid || null);
        } catch {
          if (!mounted) return;
          setLastFinishedTrainingId(null);
        }
      } catch {
        if (!mounted) return;
        setTrainings([]);
        setLastFinishedTrainingId(null);
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

  // ✅ próximo treino do ciclo baseado no último finalizado
  const nextTraining = useMemo(() => {
    if (!trainings?.length) return null;

    if (!lastFinishedTrainingId) return trainings[0];

    const idx = trainings.findIndex((t: Training) => pickId(t) === String(lastFinishedTrainingId));
    if (idx < 0) return trainings[0];

    const nextIdx = (idx + 1) % trainings.length;
    return trainings[nextIdx];
  }, [trainings, lastFinishedTrainingId]);

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