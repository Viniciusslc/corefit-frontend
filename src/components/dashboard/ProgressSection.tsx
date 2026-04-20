"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { CFSection } from "@/components/corefit/primitives";
import { apiFetch } from "@/lib/apiFetch";

type WorkoutApiItem = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
  startedAt?: string;
  finishedAt?: string;
  endedAt?: string;
  performedExercises?: {
    setsPerformed: { reps: number; weight: number }[];
  }[];
};

function pickId(workout: any) {
  return String(workout?.id ?? workout?._id ?? "");
}

function safeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dayKeyFromMs(ms: number) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatDayLabel(ms: number) {
  return new Date(ms).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function computeWorkoutVolume(performed?: WorkoutApiItem["performedExercises"]) {
  let volume = 0;
  for (const exercise of performed ?? []) {
    for (const set of exercise.setsPerformed ?? []) {
      const reps = safeNumber(set.reps);
      const weight = safeNumber(set.weight);
      if (reps > 0 || weight > 0) volume += reps * weight;
    }
  }
  return Math.round(volume);
}

function computeStreakFromDayKeys(dayKeys: number[]) {
  if (!dayKeys.length) return 0;

  const todayKey = dayKeyFromMs(Date.now());
  const yesterdayKey = todayKey - 24 * 60 * 60 * 1000;

  if (dayKeys[0] !== todayKey && dayKeys[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < dayKeys.length; index += 1) {
    const prev = dayKeys[index - 1];
    const current = dayKeys[index];
    if (prev - current === 24 * 60 * 60 * 1000) streak += 1;
    else break;
  }
  return streak;
}

type Props = {
  refreshKey: string;
};

export function ProgressSection({ refreshKey }: Props) {
  const [raw, setRaw] = useState<WorkoutApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<WorkoutApiItem[] | { items: WorkoutApiItem[] }>("/workouts");
        if (!mounted) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
          ? (data as any).items
          : [];

        setRaw(list);
      } catch {
        if (!mounted) return;
        setRaw([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const finished = useMemo(() => {
    return (raw ?? [])
      .filter((workout) => (workout.status ? workout.status === "finished" : true))
      .map((workout) => {
        const endIso = workout.finishedAt ?? workout.endedAt ?? workout.startedAt;
        const endMs = endIso ? new Date(endIso).getTime() : 0;
        return {
          id: pickId(workout),
          endMs,
          volume: computeWorkoutVolume(workout.performedExercises),
        };
      })
      .filter((workout) => !!workout.id && Number.isFinite(workout.endMs) && workout.endMs > 0)
      .sort((a, b) => b.endMs - a.endMs);
  }, [raw]);

  const week = useMemo(() => {
    const now = new Date();
    const today0 = new Date(now);
    today0.setHours(0, 0, 0, 0);

    const day = today0.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(today0);
    monday.setDate(today0.getDate() - diffToMonday);

    const days: number[] = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const byDay = new Map<number, { volume: number; workouts: number }>();
    for (const dayKey of days) byDay.set(dayKey, { volume: 0, workouts: 0 });

    for (const workout of finished) {
      const key = dayKeyFromMs(workout.endMs);
      if (byDay.has(key)) {
        const current = byDay.get(key)!;
        current.volume += workout.volume;
        current.workouts += 1;
        byDay.set(key, current);
      }
    }

    const series = days.map((dateKey) => ({
      dayKey: dateKey,
      label: formatDayLabel(dateKey),
      volume: Math.round(byDay.get(dateKey)?.volume ?? 0),
      workouts: byDay.get(dateKey)?.workouts ?? 0,
      isToday: dateKey === dayKeyFromMs(Date.now()),
    }));

    const totalVolume = series.reduce((total, item) => total + item.volume, 0);
    const totalWorkouts = series.reduce((total, item) => total + item.workouts, 0);
    const maxVol = Math.max(1, ...series.map((item) => item.volume));

    return { series, totalVolume, totalWorkouts, maxVol };
  }, [finished]);

  const streak = useMemo(() => {
    const uniqueDaysDesc: number[] = [];
    const seen = new Set<number>();

    for (const workout of finished) {
      const key = dayKeyFromMs(workout.endMs);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDaysDesc.push(key);
      }
    }

    return computeStreakFromDayKeys(uniqueDaysDesc);
  }, [finished]);

  return (
    <CFSection tone="default" padding="md" className="fade-in-soft">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Evolucao (semana)</div>
          <div className="text-muted-soft" style={{ marginTop: 4 }}>
            Semana atual (seg {"->"} dom): streak, volume e tendencia.
          </div>
        </div>

        <Link className="history-link" href="/workouts" style={{ whiteSpace: "nowrap" }}>
          Ver historico <span className="history-arrow">›</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-soft" style={{ marginTop: 12 }}>
          Carregando evolucao...
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginTop: 14,
            }}
          >
            <div className="history-summary-card" style={{ margin: 0 }}>
              <div className="history-summary-label">Streak</div>
              <div className="history-summary-value">{streak} dias</div>
            </div>

            <div className="history-summary-card" style={{ margin: 0 }}>
              <div className="history-summary-label">Treinos (semana)</div>
              <div className="history-summary-value">{week.totalWorkouts}</div>
            </div>

            <div className="history-summary-card" style={{ margin: 0 }}>
              <div className="history-summary-label">Volume (semana)</div>
              <div className="history-summary-value volume-highlight">
                {week.totalVolume.toLocaleString("pt-BR")} kg
              </div>
            </div>
          </div>

          <div className="progress-mobile-scroll" style={{ marginTop: 14 }}>
            <div className="text-muted-soft" style={{ fontSize: 12, marginBottom: 8 }}>
              Volume por dia (seg {"->"} dom)
            </div>

            <div
              className="progress-bars"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 10,
                alignItems: "end",
              }}
            >
              {week.series.map((day) => {
                const ratio = day.volume / week.maxVol;
                const height = Math.round(ratio * 64);
                const barHeight = day.volume > 0 ? Math.max(10, height) : 8;

                const hasVolume = day.volume > 0;
                const isMax = day.volume === week.maxVol && day.volume > 0;

                return (
                  <div
                    key={day.dayKey}
                    className="progress-day"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      className={`day-card ${day.isToday ? "day-card-active" : ""} ${isMax ? "day-card-max" : ""}`}
                      title={`${day.volume.toLocaleString("pt-BR")} kg • ${day.workouts} treino(s)`}
                      style={{
                        width: "100%",
                        height: 78,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        borderRadius: 12,
                        border: day.isToday
                          ? "1px solid rgba(34,197,94,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: day.isToday ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.03)",
                        padding: 6,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {hasVolume && (
                        <div className="volume-badge">
                          {day.volume.toLocaleString("pt-BR")}
                          <span style={{ opacity: 0.6, fontWeight: 700 }}>kg</span>
                        </div>
                      )}

                      <div
                        style={{
                          width: "100%",
                          height: barHeight,
                          borderRadius: 10,
                          background: hasVolume ? "rgba(34,197,94,0.60)" : "rgba(34,197,94,0.18)",
                          boxShadow: hasVolume
                            ? "0 0 0 1px rgba(34,197,94,0.25) inset, 0 0 20px rgba(34,197,94,0.12)"
                            : "0 0 0 1px rgba(34,197,94,0.12) inset",
                          transition: "height .55s ease, background .25s ease",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        opacity: day.isToday ? 0.95 : 0.75,
                        fontWeight: day.isToday ? 800 : 600,
                      }}
                    >
                      {day.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </CFSection>
  );
}
