"use client";

import "./dashboard.css";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

import { Header } from "@/components/dashboard/Header";
import { HeroWorkout } from "@/components/dashboard/HeroWorkout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { WorkoutsList } from "@/components/dashboard/WorkoutsList";
import { LastWorkout } from "@/components/dashboard/LastWorkout";
import { AISection } from "@/components/dashboard/AISection";
import { Footer } from "@/components/dashboard/Footer";

type DashboardTodayResponse =
  | {
      mode: "active";
      workoutId: string;
      trainingId: string;
      trainingName: string;
      exerciseCount: number;
      isActive: true;
    }
  | {
      mode: "next";
      trainingId: string;
      trainingName: string;
      exerciseCount: number;
      isActive: false;
    }
  | {
      mode: "empty";
      isActive: false;
    };

export default function DashboardPage() {
  useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<DashboardTodayResponse | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<DashboardTodayResponse>("/workouts/dashboard/today");
      setToday(data);
    } catch (e) {
      console.error("Erro ao carregar dashboard today:", e);
      setToday({ mode: "empty", isActive: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="corefit-bg">
      <Header />

      <main style={{ paddingTop: 80, paddingBottom: 24 }}>
        <div className="container corefit-container">
          <div className="d-flex flex-column gap-4">
            {/* HERO */}
            {!loading && today?.mode !== "empty" && today && (
              <HeroWorkout
                trainingId={today.mode === "active" ? today.trainingId : today.trainingId}
                workoutName={today.trainingName}
                workoutType={today.mode === "active" ? "Treino ativo" : "Próximo treino"}
                exerciseCount={today.exerciseCount}
                isActive={today.isActive}
              />
            )}

            {!loading && today?.mode === "empty" && (
              <div className="card-dark p-4">
                <b>Nenhum treino cadastrado ainda.</b>
                <div className="text-muted-soft mt-2">
                  Vá em <b>Treinos</b> e crie seu primeiro treino.
                </div>
              </div>
            )}

            {/* STATS */}
            <StatsCards />

            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <WorkoutsList />
              </div>

              <div className="col-12 col-lg-6">
                <div className="d-flex flex-column gap-4">
                  <LastWorkout />
                  <AISection />
                </div>
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
