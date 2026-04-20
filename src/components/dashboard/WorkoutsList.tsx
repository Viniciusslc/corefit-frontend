"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Dumbbell, Play } from "lucide-react";

import { apiFetch } from "@/lib/apiFetch";
import { CFButton, CFSection } from "@/components/corefit/primitives";

type Training = {
  id?: string;
  _id?: string;
  name: string;
  type?: string;
  exercises?: unknown[];
};

type ActiveWorkout = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
};

export function WorkoutsList() {
  const router = useRouter();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const active = await apiFetch<ActiveWorkout | null>("/workouts/active");
        setHasActiveWorkout(!!(active?.id || active?._id));
      } catch {
        setHasActiveWorkout(false);
      }

      try {
        const data = await apiFetch<Training[]>("/trainings");
        setTrainings(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erro ao carregar treinos:", e);
        setTrainings([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const items = useMemo(() => {
    return trainings
      .map((t) => {
        const id = (t as { id?: string; _id?: string }).id ?? (t as { _id?: string })._id ?? "";
        const exerciseCount = t.exercises?.length ?? 0;
        const subtitle = `${t.type ?? "Treino"} • ${exerciseCount} exercício${exerciseCount === 1 ? "" : "s"}`;
        return { id, name: t.name, subtitle, raw: t };
      })
      .filter((x) => !!x.id)
      .slice(0, 3);
  }, [trainings]);

  async function onStart(training: Training) {
    const trainingId =
      (training as { id?: string; _id?: string }).id ??
      (training as { _id?: string })._id ??
      "";

    if (!trainingId) {
      alert("Treino inválido.");
      return;
    }

    if (hasActiveWorkout) {
      router.push("/workouts/active");
      return;
    }

    try {
      setStartingId(trainingId);
      await apiFetch(`/workouts/start/${trainingId}`, { method: "POST" });
      router.push("/workouts/active");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      if (msg.toLowerCase().includes("treino ativo")) {
        router.push("/workouts/active");
        return;
      }
      alert(msg || "Erro ao iniciar treino.");
    } finally {
      setStartingId(null);
    }
  }

  if (loading) {
    return (
      <CFSection tone="default" padding="md" className="dashboard-panel-card">
        <div className="dashboard-section-head">
          <div>
            <b>Seus treinos</b>
            <span>Carregando sua lista principal...</span>
          </div>
        </div>

        <div className="dashboard-list-stack">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-train-row dashboard-train-row--skeleton" />
          ))}
        </div>
      </CFSection>
    );
  }

  return (
    <CFSection tone="default" padding="md" className="dashboard-panel-card">
      <div className="dashboard-section-head">
        <div>
          <b>Seus treinos</b>
          <span>Entre mais rápido no próximo treino.</span>
        </div>

        <Link href="/trainings" className="dashboard-inline-link">
          Ver todos
        </Link>
      </div>

      {!items.length && (
        <div className="text-muted-soft">Você ainda não cadastrou treinos.</div>
      )}

      <div className="dashboard-list-stack">
        {items.map((t) => {
          const isStarting = startingId === t.id;

          return (
            <div key={t.id} className="dashboard-train-row">
              <div className="dashboard-train-main">
                <div className="dashboard-train-icon">
                  <Dumbbell size={17} />
                </div>

                <div className="dashboard-train-copy">
                  <div className="dashboard-train-name">{t.name}</div>
                  <div className="dashboard-train-subtitle">{t.subtitle}</div>
                </div>
              </div>

              <div className="dashboard-train-actions">
                <CFButton
                  variant="secondary"
                  onClick={() => onStart(t.raw)}
                  disabled={isStarting}
                  className="dashboard-train-play"
                  title="Iniciar treino"
                >
                  {isStarting ? "..." : <Play size={17} fill="currentColor" />}
                </CFButton>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="dashboard-secondary-cta"
        onClick={() => router.push("/trainings")}
      >
        Organizar meus treinos
        <ArrowRight size={15} />
      </button>
    </CFSection>
  );
}
