"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Activity, CalendarDays, Dumbbell } from "lucide-react";

import { CFCard } from "@/components/ui/CFCard";

type Workout = {
  finishedAt?: string | null;
};

type Me = {
  weeklyGoalDays?: number;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTHS_PT = [
  "jan.",
  "fev.",
  "mar.",
  "abr.",
  "mai.",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "out.",
  "nov.",
  "dez.",
];

function monthLabelPTBR(d = new Date()) {
  return MONTHS_PT[d.getMonth()];
}

function prevMonthLabelPTBR(d = new Date()) {
  const pm = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return monthLabelPTBR(pm);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** CountUp simples (sem lib) - SEM quebrar ordem de hooks */
function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const to = Number.isFinite(target) ? target : 0;
    const from = 0;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = from + (to - from) * eased;

      setValue(current);

      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

type ViewModel = {
  weekScorePct: number;
  weekActiveDays: number;
  weekGoalDays: number;
  weekMap: number[]; // seg..dom (7)

  workoutsFinishedInMonth: number;
  prevMonthFinished: number;
  deltaVsPrev: number;

  monthLabel: string;
  prevMonthLabel: string;
};

function SkeletonCard() {
  return (
    <CFCard style={{ padding: 16 }}>
      <div className="kpi-icon mb-3" />
      <div
        style={{
          height: 26,
          width: 90,
          borderRadius: 10,
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          height: 12,
          width: 120,
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          marginTop: 10,
        }}
      />
    </CFCard>
  );
}

type Props = {
  refreshKey?: string;
};

export function StatsCards({ refreshKey }: Props) {
  const [vm, setVm] = useState<ViewModel | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const [workoutsRaw, me] = await Promise.all([
        apiFetch<any>("/workouts"),
        apiFetch<Me>("/users/me").catch(() => ({} as Me)),
      ]);

      const workouts: Workout[] = Array.isArray(workoutsRaw)
        ? workoutsRaw
        : Array.isArray(workoutsRaw?.items)
        ? workoutsRaw.items
        : [];

      const finishedDates = workouts
        .map((w) => (w?.finishedAt ? new Date(w.finishedAt) : null))
        .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));

      const goal =
        typeof me?.weeklyGoalDays === "number" && me.weeklyGoalDays > 0
          ? Math.min(7, Math.max(1, me.weeklyGoalDays))
          : 4;

      // Semana (segunda..domingo)
      const now = new Date();
      const today0 = startOfDay(now);

      const day = today0.getDay(); // 0 dom .. 6 sab
      const diffToMonday = (day + 6) % 7; // dom->6, seg->0...
      const monday = new Date(today0);
      monday.setDate(today0.getDate() - diffToMonday);

      const weekDays: Date[] = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });

      const weekMap: number[] = weekDays.map((wd) => {
        const has = finishedDates.some((fd) => isSameDay(fd, wd));
        return has ? 1 : 0;
      });

      const weekActiveDays = weekMap.reduce<number>((acc, v) => acc + (v ? 1 : 0), 0);
      const weekScorePct = Math.round((weekActiveDays / goal) * 100);

      // Mês atual
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const workoutsFinishedInMonth = finishedDates.filter(
        (d) => d >= monthStart && d < nextMonthStart
      ).length;

      // Mês anterior
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevNextStart = monthStart;

      const prevMonthFinished = finishedDates.filter(
        (d) => d >= prevMonthStart && d < prevNextStart
      ).length;

      const deltaVsPrev = workoutsFinishedInMonth - prevMonthFinished;

      setVm({
        weekScorePct: Number.isFinite(weekScorePct) ? Math.max(0, weekScorePct) : 0,
        weekActiveDays,
        weekGoalDays: goal,
        weekMap,

        workoutsFinishedInMonth,
        prevMonthFinished,
        deltaVsPrev,

        monthLabel: monthLabelPTBR(now),
        prevMonthLabel: prevMonthLabelPTBR(now),
      });
    } catch (e) {
      console.error("StatsCards load error:", e);
      setVm(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const dayLabels = useMemo(() => ["S", "T", "Q", "Q", "S", "S", "D"], []);

  const weekScoreTarget = vm?.weekScorePct ?? 0;
  const weekDoneTarget = vm?.weekActiveDays ?? 0;
  const monthTarget = vm?.workoutsFinishedInMonth ?? 0;

  const pctAnim = useCountUp(weekScoreTarget, 750);
  const weekDoneAnim = useCountUp(weekDoneTarget, 750);
  const monthAnim = useCountUp(monthTarget, 800);

  if (loading || !vm) {
    return (
      <div className="row g-4">
        <div className="col-12 col-md-4"><SkeletonCard /></div>
        <div className="col-12 col-md-4"><SkeletonCard /></div>
        <div className="col-12 col-md-4"><SkeletonCard /></div>
      </div>
    );
  }

  const progressPct = clamp((vm.weekActiveDays / vm.weekGoalDays) * 100, 0, 100);

  const safePrevLabel = vm.prevMonthLabel?.trim() ? vm.prevMonthLabel : "mês anterior";
  const safeDelta = Number.isFinite(vm.deltaVsPrev) ? vm.deltaVsPrev : 0;
  const deltaText = safeDelta === 0 ? "0" : safeDelta > 0 ? `+${safeDelta}` : `${safeDelta}`;

  return (
    <div className="row g-4">
      {/* 1) ACOMPANHAMENTO */}
      <div className="col-12 col-md-4">
        <CFCard style={{ padding: 16 }}>
          <span className="kpi-icon mb-3">
            <Activity size={18} />
          </span>

          <div className="text-white text-3xl font-extrabold leading-none">
            {Math.round(pctAnim)}%
          </div>

          <div className="text-white/60 text-[11px] tracking-wide uppercase mt-2">
            Acompanhamento
          </div>

          <div className="mt-3 d-flex align-items-center gap-2">
            {dayLabels.map((d, i) => {
              const on = vm.weekMap[i] === 1;
              return (
                <div key={i} style={{ display: "grid", placeItems: "center" }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: on ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.05)",
                      boxShadow: on ? "0 0 14px rgba(34,197,94,0.14)" : undefined,
                      transition: "all .18s ease",
                    }}
                    title={d}
                  />
                  <div className="text-white/40" style={{ fontSize: 10, marginTop: 4 }}>
                    {d}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-white/40 text-xs mt-2">presença na semana</div>
        </CFCard>
      </div>

      {/* 2) RITMO SEMANAL */}
      <div className="col-12 col-md-4">
        <CFCard style={{ padding: 16 }}>
          <span className="kpi-icon mb-3">
            <CalendarDays size={18} />
          </span>

          <div className="text-white text-3xl font-extrabold leading-none">
            {Math.round(weekDoneAnim)}/{vm.weekGoalDays}
          </div>

          <div className="text-white/60 text-[11px] tracking-wide uppercase mt-2">
            Ritmo semanal
          </div>

          <div className="mt-3 d-flex align-items-center gap-2">
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "rgba(34,197,94,0.95)",
                flexShrink: 0,
              }}
              title="Progresso"
            >
              ⏱️
            </span>

            <div
              style={{
                position: "relative",
                height: 10,
                width: "100%",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  borderRadius: 999,
                  background: "rgba(34,197,94,0.85)",
                  boxShadow: "0 0 18px rgba(34,197,94,0.35)",
                  transition: "width .35s ease",
                }}
              />
            </div>
          </div>

          <div className="text-white mt-3" style={{ fontWeight: 800 }}>
            Meta: <span style={{ fontWeight: 900 }}>{vm.weekGoalDays}</span> dias
          </div>
        </CFCard>
      </div>

      {/* 3) TREINOS NO MÊS */}
      <div className="col-12 col-md-4">
        <CFCard style={{ padding: 16 }}>
          <span className="kpi-icon mb-3">
            <Dumbbell size={18} />
          </span>

          <div className="text-white text-3xl font-extrabold leading-none">
            {Math.round(monthAnim)}
          </div>

          <div className="text-white/60 text-[11px] tracking-wide uppercase mt-2">
            Treinos no mês
          </div>

          <div className="text-white/40 text-xs mt-1">em {vm.monthLabel}</div>

          <div className="mt-3" style={{ height: 26 }} />

          <div className="mt-1" style={{ fontSize: 13, fontWeight: 800 }}>
            <span style={{ color: safeDelta >= 0 ? "#f59e0b" : "rgba(229,231,235,0.65)" }}>
              {deltaText}
            </span>{" "}
            <span style={{ color: "rgba(229,231,235,0.65)", fontWeight: 700 }}>
              em relação a {safePrevLabel}
            </span>
          </div>
        </CFCard>
      </div>
    </div>
  );
}