"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Dumbbell, Trophy } from "lucide-react";

import { CFSection } from "@/components/corefit/primitives";
import { apiFetch } from "@/lib/apiFetch";
import { calculateWorkoutSummary, formatKg, formatMin } from "@/lib/workoutSummary";

type PerformedSet = {
  reps: number;
  weight: number;
};

type PerformedExercise = {
  exerciseName?: string;
  order?: number | string;
  targetWeight?: number;
  setsPerformed?: PerformedSet[];
};

type Workout = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
  trainingId?: string;
  trainingName?: string;
  startedAt?: string;
  finishedAt?: string;
  performedExercises?: PerformedExercise[];
};

type HighlightStatus = "above" | "hit" | "below" | "none";

type HighlightRow = {
  name: string;
  targetKg: number | null;
  doneKg: number | null;
  status: HighlightStatus;
};

type LastWorkoutViewModel = {
  trainingName: string;
  label: string;
  durationMinutes: number | null;
  totalVolumeKg: number | null;
  highlights: HighlightRow[];
};

function safeArr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function maxWeight(sets: PerformedSet[]) {
  let max = 0;
  for (const set of sets) {
    const weight = typeof set?.weight === "number" && Number.isFinite(set.weight) ? set.weight : 0;
    if (weight > max) max = weight;
  }
  return max > 0 ? max : null;
}

function calcStatus(target: number | null, done: number | null): HighlightStatus {
  if (target == null || done == null) return "none";
  const epsilon = 0.0001;
  if (done > target + epsilon) return "above";
  if (Math.abs(done - target) <= epsilon) return "hit";
  return "below";
}

function badgeInfo(status: HighlightStatus) {
  if (status === "above") return { text: "Acima", className: "last-badge last-badge-good" };
  if (status === "hit") return { text: "Meta batida", className: "last-badge last-badge-good" };
  if (status === "below") return { text: "Abaixo", className: "last-badge last-badge-warn" };
  return null;
}

function rowClass(status: HighlightStatus) {
  if (status === "above" || status === "hit") return "last-row last-row-good";
  if (status === "below") return "last-row last-row-warn";
  return "last-row";
}

function trustLabel(durationMinutes: number | null, totalVolumeKg: number | null, highlightCount: number) {
  if (durationMinutes != null || totalVolumeKg != null || highlightCount > 0) {
    return "Dados confirmados na sua ultima sessao finalizada.";
  }
  return "Resumo ainda parcial. Complete mais registros para liberar mais contexto.";
}

function toDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((startToday - startThatDay) / 86400000);

  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff > 1 && diff < 7) return `ha ${diff} dias`;
  return date.toLocaleDateString("pt-BR");
}

function mapFromWorkout(workout: Workout): LastWorkoutViewModel {
  const summary = calculateWorkoutSummary(workout as never);

  const performed = safeArr<PerformedExercise>(workout.performedExercises)
    .map((exercise, index) => {
      const orderNum =
        typeof exercise.order === "number"
          ? exercise.order
          : typeof exercise.order === "string"
          ? Number(exercise.order)
          : Number.NaN;

      return {
        index,
        order: Number.isFinite(orderNum) ? orderNum : index,
        name: exercise.exerciseName?.trim() ? exercise.exerciseName.trim() : `Exercicio ${index + 1}`,
        targetWeight:
          typeof exercise.targetWeight === "number" && Number.isFinite(exercise.targetWeight)
            ? exercise.targetWeight
            : null,
        setsPerformed: safeArr<PerformedSet>(exercise.setsPerformed),
      };
    })
    .sort((a, b) => a.order - b.order);

  const highlights: HighlightRow[] = performed
    .map((exercise): HighlightRow | null => {
      const doneKg = maxWeight(exercise.setsPerformed);
      if (doneKg == null) return null;

      return {
        name: exercise.name,
        targetKg: exercise.targetWeight,
        doneKg,
        status: calcStatus(exercise.targetWeight, doneKg),
      };
    })
    .filter((item): item is HighlightRow => item !== null)
    .slice(0, 3);

  return {
    trainingName: workout.trainingName ?? "Treino",
    label: toDateLabel(workout.finishedAt),
    durationMinutes: summary.durationMinutes,
    totalVolumeKg: summary.totalVolumeKg,
    highlights,
  };
}

async function fetchLastWorkout(): Promise<Workout | null> {
  const list = await apiFetch<unknown>("/workouts");
  const workouts: Workout[] = Array.isArray(list)
    ? (list as Workout[])
    : Array.isArray((list as { items?: Workout[] })?.items)
    ? ((list as { items: Workout[] }).items ?? [])
    : [];

  const finished = workouts
    .filter((workout) => !!workout?.finishedAt)
    .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime())[0];

  return finished ?? null;
}

export function LastWorkout() {
  const [loading, setLoading] = useState(true);
  const [vm, setVm] = useState<LastWorkoutViewModel | null>(null);
  const topHighlight = useMemo(() => vm?.highlights[0] ?? null, [vm]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const workout = await fetchLastWorkout();
        if (workout) setVm(mapFromWorkout(workout));
        else setVm(null);
      } catch {
        setVm(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <CFSection tone="default" padding="md" className="last-workout-card">
        <p className="last-workout-title">Ultimo treino</p>
        <div className="text-muted-soft">Carregando...</div>
      </CFSection>
    );
  }

  if (!vm) {
    return (
      <CFSection tone="default" padding="md" className="last-workout-card">
        <p className="last-workout-title">Ultimo treino</p>
        <div className="text-muted-soft">
          Quando voce terminar sua primeira sessao, os destaques aparecem aqui.
        </div>
      </CFSection>
    );
  }

  return (
    <CFSection tone="default" padding="md" className="last-workout-card">
      <p className="last-workout-title">Ultimo treino</p>

      <div className="last-workout-top">
        <div>
          <h3 className="workout-name">{vm.trainingName}</h3>
          <p className="workout-date">{vm.label}</p>
        </div>
        <div className="last-workout-trust">
          <span className="last-workout-trust-dot" />
          Sessao validada
        </div>
      </div>

      <div className="last-workout-stats-grid">
        <div className="last-mini-stat">
          <span className="last-mini-icon">
            <Clock3 size={14} />
          </span>
          <div>
            <small>Duracao</small>
            <b>{formatMin(vm.durationMinutes)}</b>
          </div>
        </div>

        <div className="last-mini-stat">
          <span className="last-mini-icon">
            <Dumbbell size={14} />
          </span>
          <div>
            <small>Volume</small>
            <b>{formatKg(vm.totalVolumeKg)}</b>
          </div>
        </div>
      </div>

      <div className="last-workout-note">
        {trustLabel(vm.durationMinutes, vm.totalVolumeKg, vm.highlights.length)}
      </div>

      <div className="highlight-section">
        <p className="text-muted-soft" style={{ fontWeight: 700, marginBottom: 10 }}>
          DESTAQUE PRINCIPAL
        </p>

        {topHighlight ? (
          <div className="last-spotlight">
            <div className="last-spotlight-head">
              <div className="last-spotlight-title">
                <span className="last-mini-icon">
                  <Trophy size={14} />
                </span>
                <b>{topHighlight.name}</b>
              </div>
              {badgeInfo(topHighlight.status) && (
                <span className={badgeInfo(topHighlight.status)!.className}>
                  {badgeInfo(topHighlight.status)!.text}
                </span>
              )}
            </div>

            <div className="last-row-sub">
              <span>
                Meta: <b>{topHighlight.targetKg ?? "-"}</b>kg
              </span>
              <span>
                Feito: <b>{topHighlight.doneKg ?? "-"}</b>kg
              </span>
            </div>
          </div>
        ) : (
          <div className="text-muted-soft">Sem destaques ainda.</div>
        )}

        {vm.highlights.length > 1 && (
          <div className="last-highlight-list">
            {vm.highlights.slice(1).map((highlight, index) => {
              const badge = badgeInfo(highlight.status);
              return (
                <div key={`${highlight.name}-${index}`} className={rowClass(highlight.status)}>
                  <div className="last-row-head">
                    <div className="last-row-title">
                      <b>{highlight.name}</b>
                    </div>
                    {badge && <span className={badge.className}>{badge.text}</span>}
                  </div>
                  <div className="last-row-sub">
                    <span>
                      Meta: <b>{highlight.targetKg ?? "-"}</b>kg
                    </span>
                    <span>
                      Feito: <b>{highlight.doneKg ?? "-"}</b>kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CFSection>
  );
}
