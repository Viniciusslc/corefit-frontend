"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { calculateWorkoutSummary, formatKg, formatMin } from "@/lib/workoutSummary";

/* =========================
   Types (baseado no SEU JSON real de /workouts)
========================= */
type PerformedSet = {
  reps: number;
  weight: number;
};

type PerformedExercise = {
  exerciseName?: string;
  order?: number | string;
  targetWeight?: number; // ✅ vem no /workouts
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

/* =========================
   Utils
========================= */
function safeArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function maxWeight(sets: PerformedSet[]) {
  let max = 0;
  for (const s of sets) {
    const w = typeof s?.weight === "number" && Number.isFinite(s.weight) ? s.weight : 0;
    if (w > max) max = w;
  }
  return max > 0 ? max : null;
}

function calcStatus(target: number | null, done: number | null): HighlightStatus {
  if (target == null || done == null) return "none";
  const eps = 0.0001;
  if (done > target + eps) return "above";
  if (Math.abs(done - target) <= eps) return "hit";
  return "below";
}

function badgeInfo(status: HighlightStatus) {
  if (status === "above") return { text: "Acima", className: "last-badge last-badge-good" };
  if (status === "hit") return { text: "Bateu", className: "last-badge last-badge-good" };
  if (status === "below") return { text: "Abaixo", className: "last-badge last-badge-warn" };
  return null;
}

function rowClass(status: HighlightStatus) {
  if (status === "above" || status === "hit") return "last-row last-row-good";
  if (status === "below") return "last-row last-row-warn";
  return "last-row";
}

function toDateLabel(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diff = Math.round((startToday - startThat) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff > 1 && diff < 7) return `há ${diff} dias`;

  return d.toLocaleDateString();
}

/* =========================
   Mapping
========================= */
function mapFromWorkout(workout: Workout): LastWorkoutViewModel {
  const summary = calculateWorkoutSummary(workout as any);

  const performed = safeArr<PerformedExercise>(workout.performedExercises)
    .map((pe, idx) => {
      const orderNum =
        typeof pe.order === "number" ? pe.order : typeof pe.order === "string" ? Number(pe.order) : NaN;

      return {
        idx,
        order: Number.isFinite(orderNum) ? orderNum : idx,
        name: pe.exerciseName?.trim() ? pe.exerciseName.trim() : `Exercício ${idx + 1}`,
        targetWeight:
          typeof pe.targetWeight === "number" && Number.isFinite(pe.targetWeight) ? pe.targetWeight : null,
        setsPerformed: safeArr<PerformedSet>(pe.setsPerformed),
      };
    })
    .sort((a, b) => a.order - b.order);

  const highlights: HighlightRow[] = performed
    .map((pe) => {
      const doneKg = maxWeight(pe.setsPerformed);
      if (doneKg == null) return null;

      const targetKg = pe.targetWeight;
      const status = calcStatus(targetKg, doneKg);

      return {
        name: pe.name,
        targetKg,
        doneKg,
        status,
      } as HighlightRow;
    })
    .filter((x): x is HighlightRow => x !== null)
    .slice(0, 6);

  return {
    trainingName: workout.trainingName ?? "Treino",
    label: toDateLabel(workout.finishedAt),
    durationMinutes: summary.durationMinutes,
    totalVolumeKg: summary.totalVolumeKg,
    highlights,
  };
}

/* =========================
   Fetch last workout
========================= */
async function fetchLastWorkout(): Promise<Workout | null> {
  const list = await apiFetch<any>("/workouts");
  const arr: Workout[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];

  const finished = arr
    .filter((w) => !!w?.finishedAt)
    .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime())[0];

  return finished ?? null;
}

/* =========================
   Component
========================= */
export function LastWorkout() {
  const [loading, setLoading] = useState(true);
  const [vm, setVm] = useState<LastWorkoutViewModel | null>(null);

  const hasHighlights = useMemo(() => (vm?.highlights.length ?? 0) > 0, [vm]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const w = await fetchLastWorkout();
        if (w) setVm(mapFromWorkout(w));
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
      <div className="card-dark">
        <p className="last-workout-title">Último treino</p>
        <div className="text-muted-soft">Carregando...</div>
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="card-dark">
        <p className="last-workout-title">Último treino</p>
        <div className="text-muted-soft">Sem destaques (nenhuma execução registrada).</div>
      </div>
    );
  }

  return (
    <div className="card-dark">
      <p className="last-workout-title">Último treino</p>

      <h3 className="workout-name">{vm.trainingName}</h3>
      <p className="workout-date">{vm.label}</p>

      <div className="stats-row">
        <span className="text-muted-soft">{formatMin(vm.durationMinutes)}</span>
        <span className="text-muted-soft">{formatKg(vm.totalVolumeKg)}</span>
      </div>

      <div className="highlight-section">
        <p className="text-muted-soft" style={{ fontWeight: 700, marginBottom: 10 }}>
          DESTAQUES
        </p>

        {!hasHighlights && <div className="text-muted-soft">Sem destaques.</div>}

        {hasHighlights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vm.highlights.map((h, i) => {
              const b = badgeInfo(h.status);

              return (
                <div key={`${h.name}-${i}`} className={rowClass(h.status)}>
                  <div className="last-row-head">
                    <div className="last-row-title">
                      <b>{h.name}</b>
                    </div>

                    {b && <span className={b.className}>{b.text}</span>}
                  </div>

                  <div className="last-row-sub">
                    <span>
                      Meta: <b>{h.targetKg ?? "-"}</b>kg
                    </span>
                    <span>
                      Feito: <b>{h.doneKg ?? "-"}</b>kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
