"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, Dumbbell, Flame } from "lucide-react";

import { apiFetch } from "@/lib/apiFetch";
import { CFSection } from "@/components/corefit/primitives";

type Workout = {
  finishedAt?: string | null;
};

type Me = {
  weeklyGoalDays?: number;
};

type ViewModel = {
  weekScorePct: number;
  weekActiveDays: number;
  weekGoalDays: number;
  weekMap: number[];
  workoutsFinishedInMonth: number;
  deltaVsPrev: number;
  monthLabel: string;
  prevMonthLabel: string;
  streakDays: number;
};

const MONTHS_PT = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthLabelPTBR(date = new Date()) {
  return MONTHS_PT[date.getMonth()];
}

function prevMonthLabelPTBR(date = new Date()) {
  const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthLabelPTBR(previousMonth);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const finalValue = Number.isFinite(target) ? target : 0;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(finalValue * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

function calculateStreak(finishedDates: Date[]) {
  if (!finishedDates.length) return 0;

  const uniqueDays = Array.from(new Set(finishedDates.map((date) => startOfDay(date).getTime()))).sort((a, b) => b - a);

  let streak = 0;
  let cursor = startOfDay(new Date()).getTime();

  if (uniqueDays[0] !== cursor && uniqueDays[0] !== cursor - 86400000) {
    return 0;
  }

  if (uniqueDays[0] === cursor - 86400000) {
    cursor = uniqueDays[0];
  }

  for (const day of uniqueDays) {
    if (day === cursor) {
      streak += 1;
      cursor -= 86400000;
      continue;
    }
    break;
  }

  return streak;
}

function consistencyMessage(weekActiveDays: number, goal: number, streakDays: number) {
  if (weekActiveDays === 0) {
    return "Voce esta comecando sua semana. Bora construir consistencia.";
  }
  if (streakDays >= 3) {
    return `Sequencia ativa: ${streakDays} dias mantendo o ritmo.`;
  }
  if (weekActiveDays >= goal) {
    return "Meta da semana batida. Agora e manter o padrao.";
  }
  return `Voce ja marcou ${weekActiveDays} dia(s). Continue empilhando sessoes.`;
}

function weeklyGoalMessage(weekActiveDays: number, goal: number) {
  const left = Math.max(goal - weekActiveDays, 0);
  if (left === 0) return "Meta da semana concluida. Excelente ritmo.";
  if (weekActiveDays === 0) return "Voce esta comecando sua semana. Bora construir consistencia.";
  if (left === 1) return "Falta 1 treino para bater sua meta.";
  return `Faltam ${left} treinos para bater sua meta.`;
}

function monthMessage(monthCount: number, delta: number, monthLabel: string) {
  if (monthCount === 0) return `Seu volume de ${monthLabel} ainda esta zerado.`;
  if (delta > 0) return "Mais sessoes concluidas do que no mes anterior.";
  if (delta < 0) return "Um pouco abaixo do mes anterior, mas ainda no jogo.";
  return "Mesmo ritmo do mes anterior ate aqui.";
}

function SkeletonCard() {
  return (
    <CFSection tone="default" padding="md" className="kpi-card-shell">
      <div className="kpi-icon mb-3" />
      <div style={{ height: 26, width: 90, borderRadius: 10, background: "rgba(255,255,255,0.08)" }} />
      <div
        style={{
          height: 12,
          width: 140,
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          marginTop: 10,
        }}
      />
    </CFSection>
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
        apiFetch<unknown>("/workouts"),
        apiFetch<Me>("/users/me").catch(() => ({} as Me)),
      ]);

      const workouts: Workout[] = Array.isArray(workoutsRaw)
        ? (workoutsRaw as Workout[])
        : Array.isArray((workoutsRaw as { items?: Workout[] })?.items)
        ? ((workoutsRaw as { items: Workout[] }).items ?? [])
        : [];

      const finishedDates = workouts
        .map((workout) => (workout?.finishedAt ? new Date(workout.finishedAt) : null))
        .filter((date): date is Date => !!date && !Number.isNaN(date.getTime()));

      const goal =
        typeof me?.weeklyGoalDays === "number" && me.weeklyGoalDays > 0
          ? Math.min(7, Math.max(1, me.weeklyGoalDays))
          : 4;

      const now = new Date();
      const today0 = startOfDay(now);
      const day = today0.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(today0);
      monday.setDate(today0.getDate() - diffToMonday);

      const weekDays: Date[] = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return date;
      });

      const weekMap = weekDays.map((weekDay) => (finishedDates.some((finishedDay) => isSameDay(finishedDay, weekDay)) ? 1 : 0));
      const weekActiveDays = weekMap.reduce<number>((total, dayValue) => total + (dayValue ? 1 : 0), 0);
      const weekScorePct = Math.round((weekActiveDays / goal) * 100);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const workoutsFinishedInMonth = finishedDates.filter((date) => date >= monthStart && date < nextMonthStart).length;

      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthFinished = finishedDates.filter((date) => date >= prevMonthStart && date < monthStart).length;

      setVm({
        weekScorePct: Number.isFinite(weekScorePct) ? Math.max(0, weekScorePct) : 0,
        weekActiveDays,
        weekGoalDays: goal,
        weekMap,
        workoutsFinishedInMonth,
        deltaVsPrev: workoutsFinishedInMonth - prevMonthFinished,
        monthLabel: monthLabelPTBR(now),
        prevMonthLabel: prevMonthLabelPTBR(now),
        streakDays: calculateStreak(finishedDates),
      });
    } catch (error) {
      console.error("StatsCards load error:", error);
      setVm(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  const dayLabels = useMemo(() => ["S", "T", "Q", "Q", "S", "S", "D"], []);
  const pctAnim = useCountUp(vm?.weekScorePct ?? 0, 750);
  const weekDoneAnim = useCountUp(vm?.weekActiveDays ?? 0, 750);
  const monthAnim = useCountUp(vm?.workoutsFinishedInMonth ?? 0, 800);
  const streakAnim = useCountUp(vm?.streakDays ?? 0, 700);

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
  const safePrevLabel = vm.prevMonthLabel?.trim() ? vm.prevMonthLabel : "mes anterior";
  const safeDelta = Number.isFinite(vm.deltaVsPrev) ? vm.deltaVsPrev : 0;
  const deltaText = safeDelta === 0 ? "Sem mudanca" : safeDelta > 0 ? `+${safeDelta}` : `${safeDelta}`;
  const deltaTone = safeDelta > 0 ? "#22c55e" : safeDelta < 0 ? "#f59e0b" : "rgba(229,231,235,0.6)";

  return (
    <div className="row g-4">
      <div className="col-12 col-md-4">
        <CFSection tone="default" padding="md" className="kpi-card-shell kpi-card-shell--highlight kpi-card-animate">
          <div className="kpi-card-header">
            <span className="kpi-icon"><Activity size={18} /></span>
            <div className="kpi-card-kicker">Constancia</div>
          </div>
          <div className="kpi-card-topline">Seu ritmo da semana</div>
          <div className="kpi-card-value">{Math.round(pctAnim)}%</div>
          <div className="kpi-card-description">{consistencyMessage(vm.weekActiveDays, vm.weekGoalDays, vm.streakDays)}</div>

          <div className="kpi-streak-pill">
            <span className="kpi-streak-icon"><Flame size={13} /></span>
            <b>{Math.round(streakAnim)} dia(s)</b>
            <span>de sequencia</span>
          </div>

          <div className="kpi-week-strip">
            {dayLabels.map((label, index) => {
              const active = vm.weekMap[index] === 1;
              return (
                <div key={`${label}-${index}`} className="kpi-week-day">
                  <div
                    className={`kpi-week-box${active ? " kpi-week-box--active" : ""}`}
                    style={{
                      background: active ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.04)",
                      borderColor: active ? "rgba(34,197,94,0.32)" : "rgba(255,255,255,0.08)",
                    }}
                  />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </CFSection>
      </div>

      <div className="col-12 col-md-4">
        <CFSection tone="default" padding="md" className="kpi-card-shell kpi-card-animate">
          <div className="kpi-card-header">
            <span className="kpi-icon"><CalendarDays size={18} /></span>
            <div className="kpi-card-kicker">Meta semanal</div>
          </div>
          <div className="kpi-card-topline">O que falta para bater a meta</div>
          <div className="kpi-card-value">{Math.round(weekDoneAnim)}/{vm.weekGoalDays}</div>
          <div className="kpi-card-description">{weeklyGoalMessage(vm.weekActiveDays, vm.weekGoalDays)}</div>
          <div className="kpi-progress-row">
            <div className="kpi-progress-meta">
              <span>Progresso</span>
              <b>{Math.round(progressPct)}%</b>
            </div>
            <div className="kpi-progress-bar">
              <div className="kpi-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </CFSection>
      </div>

      <div className="col-12 col-md-4">
        <CFSection tone="default" padding="md" className="kpi-card-shell kpi-card-shell--subtle kpi-card-animate">
          <div className="kpi-card-header">
            <span className="kpi-icon"><Dumbbell size={18} /></span>
            <div className="kpi-card-kicker">Treinos no mes</div>
          </div>
          <div className="kpi-card-topline">Volume de sessoes concluidas</div>
          <div className="kpi-card-value kpi-card-value--soft">{Math.round(monthAnim)}</div>
          <div className="kpi-card-description">{monthMessage(vm.workoutsFinishedInMonth, vm.deltaVsPrev, vm.monthLabel)}</div>
          <div className="kpi-month-delta">
            <b style={{ color: deltaTone }}>{deltaText}</b>
            <span> em relacao a {safePrevLabel}</span>
          </div>
        </CFSection>
      </div>
    </div>
  );
}
