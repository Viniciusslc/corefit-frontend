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

function pickId(t: any) {
  return t?.id ?? t?._id ?? "";
}

export default function DashboardPage() {
  useRequireAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
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
          setHasActiveWorkout(!!(active?.id || active?._id));
        } catch {
          if (!mounted) return;
          setHasActiveWorkout(false);
        }

        // 2) carrega treinos
        const ts = await apiFetch<Training[]>("/trainings");
        if (!mounted) return;
        setTrainings(Array.isArray(ts) ? ts : []);
      } catch {
        if (!mounted) return;
        setTrainings([]);
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

  const todaysTraining = useMemo(() => {
    // escolha simples: primeiro treino da lista
    if (!trainings?.length) return null;
    return trainings[0];
  }, [trainings]);

  const heroData = useMemo(() => {
    const t = todaysTraining;
    if (!t) {
      return {
        trainingId: undefined,
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
  }, [todaysTraining]);

  return (
    <div className="corefit-bg">
      <div className="corefit-container" style={{ paddingTop: 96, paddingBottom: 40 }}>
        {loading ? (
          <div className="card-dark p-4">Carregando dashboard…</div>
        ) : (
          <div className="dashboard-stack">
            {/* HERO */}
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

            {/* KPIs */}
            <StatsCards refreshKey={refreshKey} />

            {/* ✅ NOVO: Evolução (Sprint 1) */}
            <ProgressSection refreshKey={refreshKey} />

            {/* GRID (esquerda: listagem / direita: ultimo treino) */}
            <div className="dashboard-grid">
              <div className="left-col">
                <WorkoutsList />

                {/* Ações rápidas */}
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