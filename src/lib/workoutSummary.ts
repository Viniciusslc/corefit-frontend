// src/lib/workoutSummary.ts

type PerformedSet = { reps?: number; weight?: number };
type PerformedExercise = { order?: number; setsPerformed?: PerformedSet[] };

export type WorkoutSummary = {
  durationMinutes: number | null;
  totalVolumeKg: number | null;
  totalSets: number | null;
  totalReps: number | null;
};

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function calculateWorkoutSummary(workout: any): WorkoutSummary {
  const performed: PerformedExercise[] = Array.isArray(workout?.performedExercises)
    ? workout.performedExercises
    : [];

  let totalVolume = 0;
  let totalReps = 0;
  let totalSets = 0;

  for (const ex of performed) {
    const sets = Array.isArray(ex?.setsPerformed) ? ex.setsPerformed : [];
    for (const s of sets) {
      const reps = n(s?.reps);
      const weight = n(s?.weight);

      if (reps > 0 || weight > 0) {
        totalSets += 1;
        totalReps += reps;
        totalVolume += reps * weight;
      }
    }
  }

  const started = workout?.startedAt ? new Date(workout.startedAt).getTime() : NaN;
  const finished = workout?.finishedAt ? new Date(workout.finishedAt).getTime() : NaN;

  const durationMinutes =
    Number.isFinite(started) && Number.isFinite(finished) && finished >= started
      ? Math.round((finished - started) / 60000)
      : null;

  return {
    durationMinutes,
    totalVolumeKg: totalVolume > 0 ? totalVolume : null,
    totalSets: totalSets > 0 ? totalSets : null,
    totalReps: totalReps > 0 ? totalReps : null,
  };
}

// ✅ exports que o LastWorkout vai usar
export function formatKg(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${value.toFixed(1)} kg`;
}

export function formatMin(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${value} min`;
}
