"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function pickId(w: any) {
  return String(w?.id ?? w?._id ?? "");
}

function safeNumber(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function dayKeyFromMs(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatDayLabel(ms: number) {
  return new Date(ms).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function computeWorkoutVolume(performed?: WorkoutApiItem["performedExercises"]) {
  let volume = 0;
  for (const ex of performed ?? []) {
    for (const s of ex.setsPerformed ?? []) {
      const reps = safeNumber(s.reps);
      const weight = safeNumber(s.weight);
      if (reps > 0 || weight > 0) volume += reps * weight;
    }
  }
  return Math.round(volume);
}

function computeStreakFromDayKeys(dayKeys: number[]) {
  if (!dayKeys.length) return 0;

  const todayKey = dayKeyFromMs(Date.now());
  const yesterdayKey = todayKey - 24 * 60 * 60 * 1000;

  // streak só conta se teve treino hoje OU ontem (pra não quebrar “de manhã”)
  const hasRecent = dayKeys[0] === todayKey || dayKeys[0] === yesterdayKey;
  if (!hasRecent) return 0;

  let streak = 1;
  for (let i = 1; i < dayKeys.length; i++) {
    const prev = dayKeys[i - 1];
    const cur = dayKeys[i];
    if (prev - cur === 24 * 60 * 60 * 1000) streak += 1;
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
      .filter((w) => (w.status ? w.status === "finished" : true))
      .map((w) => {
        const endIso = w.finishedAt ?? w.endedAt ?? w.startedAt;
        const endMs = endIso ? new Date(endIso).getTime() : 0;
        return {
          id: pickId(w),
          endMs,
          volume: computeWorkoutVolume(w.performedExercises),
        };
      })
      .filter((w) => !!w.id && Number.isFinite(w.endMs) && w.endMs > 0)
      .sort((a, b) => b.endMs - a.endMs);
  }, [raw]);

  // Semana atual (seg -> dom)
  const week = useMemo(() => {
    const now = new Date();
    const today0 = new Date(now);
    today0.setHours(0, 0, 0, 0);

    const day = today0.getDay(); // 0 dom .. 6 sab
    const diffToMonday = (day + 6) % 7; // dom->6, seg->0...
    const monday = new Date(today0);
    monday.setDate(today0.getDate() - diffToMonday);

    const days: number[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const byDay = new Map<number, { volume: number; workouts: number }>();
    for (const d of days) byDay.set(d, { volume: 0, workouts: 0 });

    for (const w of finished) {
      const k = dayKeyFromMs(w.endMs);
      if (byDay.has(k)) {
        const cur = byDay.get(k)!;
        cur.volume += w.volume;
        cur.workouts += 1;
        byDay.set(k, cur);
      }
    }

    const series = days.map((d) => ({
      dayKey: d,
      label: formatDayLabel(d),
      volume: Math.round(byDay.get(d)?.volume ?? 0),
      workouts: byDay.get(d)?.workouts ?? 0,
      isToday: d === dayKeyFromMs(Date.now()),
    }));

    const totalVolume = series.reduce((acc, x) => acc + x.volume, 0);
    const totalWorkouts = series.reduce((acc, x) => acc + x.workouts, 0);
    const maxVol = Math.max(1, ...series.map((x) => x.volume));

    return { series, totalVolume, totalWorkouts, maxVol };
  }, [finished]);

  const streak = useMemo(() => {
    const uniqueDaysDesc: number[] = [];
    const seen = new Set<number>();

    for (const w of finished) {
      const k = dayKeyFromMs(w.endMs);
      if (!seen.has(k)) {
        seen.add(k);
        uniqueDaysDesc.push(k);
      }
    }

    return computeStreakFromDayKeys(uniqueDaysDesc);
  }, [finished]);

  return (
    <div className="card-dark fade-in-soft" style={{ padding: 16 }}>
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
          <div style={{ fontWeight: 900, fontSize: 16 }}>Evolução (semana)</div>
          <div className="text-muted-soft" style={{ marginTop: 4 }}>
            Semana atual (seg → dom): streak, volume e tendência.
          </div>
        </div>

        <Link className="history-link" href="/workouts" style={{ whiteSpace: "nowrap" }}>
          Ver histórico <span className="history-arrow">›</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-soft" style={{ marginTop: 12 }}>
          Carregando evolução…
        </div>
      ) : (
        <>
          {/* KPIs */}
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

          {/* Gráfico (premium: limpo + badge discreto) */}
          <div style={{ marginTop: 14 }}>
            <div className="text-muted-soft" style={{ fontSize: 12, marginBottom: 8 }}>
              Volume por dia (seg → dom)
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 10,
                alignItems: "end",
              }}
            >
              {week.series.map((d) => {
                const ratio = d.volume / week.maxVol;
                const h = Math.round(ratio * 64);
                const barH = d.volume > 0 ? Math.max(10, h) : 8;

                const hasVolume = d.volume > 0;
                const isMax = d.volume === week.maxVol && d.volume > 0;

                return (
                  <div
                    key={d.dayKey}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                  >
                    <div
                      className={`day-card ${d.isToday ? "day-card-active" : ""} ${isMax ? "day-card-max" : ""}`}
                      title={`${d.volume.toLocaleString("pt-BR")} kg • ${d.workouts} treino(s)`}
                      style={{
                        width: "100%",
                        height: 78,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        borderRadius: 12,
                        border: d.isToday
                          ? "1px solid rgba(34,197,94,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: d.isToday ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.03)",
                        padding: 6,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* ✅ badge premium */}
                      {hasVolume && (
                        <div className="volume-badge">
                          {d.volume.toLocaleString("pt-BR")}
                          <span style={{ opacity: 0.6, fontWeight: 700 }}>kg</span>
                        </div>
                      )}

                      {/* Barra (energia) */}
                      <div
                        style={{
                          width: "100%",
                          height: barH,
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
                        opacity: d.isToday ? 0.95 : 0.75,
                        fontWeight: d.isToday ? 800 : 600,
                      }}
                    >
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}