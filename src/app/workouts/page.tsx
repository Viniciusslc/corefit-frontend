"use client";

import "./workouts.css";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  History,
  LineChart,
  Play,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

type WorkoutApiItem = {
  id?: string;
  _id?: string;
  trainingName?: string;
  trainingId?: string;
  status?: "active" | "finished";
  startedAt?: string;
  finishedAt?: string;
  endedAt?: string;
  performedExercises?: {
    exerciseName: string;
    order: number;
    targetWeight?: number;
    setsPerformed: { reps: number; weight: number }[];
  }[];
};

type HistoryItem = {
  id: string;
  title: string;
  trainingId: string | null;
  dateLabel: string;
  durationLabel: string;
  durationMinutes: number | null;
  setsTotal: number | null;
  repsTotal: number | null;
  volumeTotal: number | null;
  executed: boolean;
  partial: boolean;
  sortTime: number;
  comparison: {
    type: "up" | "down" | "same" | "none";
    label: string;
    detail?: string;
  };
};

type RangeFilter = "7d" | "30d" | "all";

function pickId(workout: WorkoutApiItem) {
  return String(workout.id ?? workout._id ?? "");
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTimeBR(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function getDurationMinutes(start?: string, end?: string) {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }

  const mins = Math.round((endMs - startMs) / 60000);
  return mins > 0 ? mins : null;
}

function formatDurationLabel(minutes: number | null) {
  return minutes != null ? `Duracao: ${minutes} min` : "Duracao sem leitura";
}

function computeStats(performed?: WorkoutApiItem["performedExercises"]) {
  const exercises = performed ?? [];
  let sets = 0;
  let reps = 0;
  let volume = 0;

  for (const exercise of exercises) {
    for (const set of exercise.setsPerformed ?? []) {
      const repsValue = safeNumber(set.reps);
      const weightValue = safeNumber(set.weight);

      if (repsValue > 0 || weightValue > 0) {
        sets += 1;
        reps += repsValue;
        volume += repsValue * weightValue;
      }
    }
  }

  const executed = sets > 0 || reps > 0 || volume > 0;
  const volumeRounded = Math.round(volume);

  return {
    executed,
    partial: sets > 0 && (reps <= 0 || volumeRounded <= 0),
    setsTotal: sets > 0 ? sets : null,
    repsTotal: reps > 0 ? reps : null,
    volumeTotal: volumeRounded > 0 ? volumeRounded : null,
  };
}

function startOfDayMs(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.getTime();
}

function isSameDay(aMs: number, bMs: number) {
  return startOfDayMs(new Date(aMs)) === startOfDayMs(new Date(bMs));
}

function isInLastDays(dateMs: number, days: number) {
  return dateMs >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function isInThisWeek(dateMs: number) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return dateMs >= monday.getTime();
}

function compareVolume(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous <= 0) {
    return {
      type: "none" as const,
      label: "Sem base de comparacao",
      detail: "Sem execucao registrada",
    };
  }

  const diffKg = Math.round(current - previous);
  const diffPct = Math.round(((current - previous) / previous) * 100);
  if (diffPct > 0) {
    return {
      type: "up" as const,
      label: `+${diffKg.toLocaleString("pt-BR")} kg vs ultima sessao`,
      detail: `+${diffPct}% de volume`,
    };
  }
  if (diffPct < 0) {
    return {
      type: "down" as const,
      label: `${diffKg.toLocaleString("pt-BR")} kg vs ultima sessao`,
      detail: `${diffPct}% de volume`,
    };
  }
  return {
    type: "same" as const,
    label: "Mesmo volume da ultima sessao",
    detail: "Sem variacao de carga total",
  };
}

function buildWeeklyTrend(items: HistoryItem[]) {
  const buckets = new Map<string, number>();

  for (const item of items) {
    if (!item.executed || item.volumeTotal == null || !item.sortTime) continue;
    const date = new Date(item.sortTime);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    buckets.set(key, (buckets.get(key) ?? 0) + item.volumeTotal);
  }

  const values = [...buckets.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-6)
    .map(([key, volume]) => {
      const date = new Date(key);
      return {
        label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        volume,
      };
    });

  const max = Math.max(...values.map((item) => item.volume), 0);
  return values.map((item) => ({
    ...item,
    pct: max > 0 ? Math.max(16, Math.round((item.volume / max) * 100)) : 16,
  }));
}

export default function WorkoutsHistoryPage() {
  useRequireAuth();

  const [raw, setRaw] = useState<WorkoutApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeFilter>("all");
  const [startingTrainingId, setStartingTrainingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<WorkoutApiItem[] | { items: WorkoutApiItem[] }>("/workouts");
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as { items?: WorkoutApiItem[] })?.items)
            ? ((data as { items: WorkoutApiItem[] }).items ?? [])
            : [];

        setRaw(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao carregar historico";
        setError(message);
        setRaw([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const itemsAll = useMemo<HistoryItem[]>(() => {
    const mapped = (raw ?? [])
      .filter((workout) => (workout.status ? workout.status !== "active" : true))
      .map((workout) => {
        const id = pickId(workout);
        const title = workout.trainingName ?? "Treino";
        const end = workout.finishedAt ?? workout.endedAt ?? undefined;
        const sortTime = new Date(end ?? workout.startedAt ?? 0).getTime() || 0;
        const stats = computeStats(workout.performedExercises);
        const durationMinutes = getDurationMinutes(workout.startedAt, end);

        return {
          id,
          title,
          trainingId: workout.trainingId ? String(workout.trainingId) : null,
          dateLabel: formatDateTimeBR(end ?? workout.startedAt),
          durationLabel: formatDurationLabel(durationMinutes),
          durationMinutes,
          setsTotal: stats.setsTotal,
          repsTotal: stats.repsTotal,
          volumeTotal: stats.volumeTotal,
          executed: stats.executed,
          partial: stats.partial,
          sortTime,
          comparison: {
            type: "none" as const,
            label: "Sem base de comparacao",
          },
        };
      })
      .filter((item) => !!item.id)
      .sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0));

    return mapped.map((item, index) => {
      const previous = mapped[index + 1];
      return {
        ...item,
        comparison: compareVolume(item.volumeTotal, previous?.volumeTotal ?? null),
      };
    });
  }, [raw]);

  const items = useMemo(() => {
    if (range === "all") return itemsAll;
    const days = range === "7d" ? 7 : 30;
    return itemsAll.filter((item) => isInLastDays(item.sortTime, days));
  }, [itemsAll, range]);

  const summary = useMemo(() => {
    const executedItems = items.filter((item) => item.executed);
    const totalVolume = executedItems.reduce((acc, item) => acc + (item.volumeTotal ?? 0), 0);
    const averageVolume = executedItems.length > 0 ? Math.round(totalVolume / executedItems.length) : null;
    const activeDays = new Set(
      executedItems.map((item) => {
        const date = new Date(item.sortTime);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    ).size;
    const bestSession = [...executedItems].sort((a, b) => (b.volumeTotal ?? 0) - (a.volumeTotal ?? 0))[0];

    return {
      executedCount: executedItems.length,
      totalVolume,
      averageVolume,
      activeDays,
      bestSessionVolume: bestSession?.volumeTotal ?? null,
      bestSessionTitle: bestSession?.title ?? null,
    };
  }, [items]);

  const weeklyTrend = useMemo(() => buildWeeklyTrend(items), [items]);

  async function restartTraining(trainingId: string) {
    try {
      setStartingTrainingId(trainingId);
      await apiFetch(`/workouts/start/${trainingId}`, { method: "POST" });
      window.location.href = "/workouts/active";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar treino";
      if (String(message).toLowerCase().includes("treino ativo")) {
        window.location.href = "/workouts/active";
        return;
      }
      setError(message);
    } finally {
      setStartingTrainingId(null);
    }
  }

  function renderPeriodBadges(sortTime: number) {
    const now = Date.now();
    const isToday = isSameDay(sortTime, now);
    const inWeek = isInThisWeek(sortTime);

    return (
      <div className="history-badge-row">
        {isToday ? <div className="history-chip history-chip--today">Hoje</div> : null}
        {!isToday && inWeek ? <div className="history-chip history-chip--week">Esta semana</div> : null}
      </div>
    );
  }

  function renderStateBadge(item: HistoryItem) {
    if (item.executed && !item.partial) {
      return (
        <div className="history-chip history-chip--ok">
          <CheckCircle2 size={12} />
          Executado
        </div>
      );
    }

    if (item.partial) {
      return (
        <div className="history-chip history-chip--warn">
          <Activity size={12} />
          Parcial
        </div>
      );
    }

    return (
      <div className="history-chip history-chip--empty">
        <XCircle size={12} />
        Sem leitura
      </div>
    );
  }

  function renderComparison(item: HistoryItem) {
    if (item.comparison.type === "none") {
      return (
        <div className="history-comparison history-comparison--muted">
          <span>{item.comparison.label}</span>
          {item.comparison.detail ? <b>{item.comparison.detail}</b> : null}
        </div>
      );
    }

    if (item.comparison.type === "up") {
      return (
        <div className="history-comparison history-comparison--up">
          <TrendingUp size={13} />
          <span>{item.comparison.label}</span>
          {item.comparison.detail ? <b>{item.comparison.detail}</b> : null}
        </div>
      );
    }

    if (item.comparison.type === "down") {
      return (
        <div className="history-comparison history-comparison--down">
          <TrendingDown size={13} />
          <span>{item.comparison.label}</span>
          {item.comparison.detail ? <b>{item.comparison.detail}</b> : null}
        </div>
      );
    }

    return (
      <div className="history-comparison history-comparison--muted">
        <span>{item.comparison.label}</span>
        {item.comparison.detail ? <b>{item.comparison.detail}</b> : null}
      </div>
    );
  }

  function renderMetric(label: string, value: string | null, helper?: string) {
    return (
      <div className="history-stat">
        <div className="history-stat-label">{label}</div>
        <div className="history-stat-value">{value ?? "Sem leitura"}</div>
        {helper ? <div className="history-stat-helper">{helper}</div> : null}
      </div>
    );
  }

  return (
    <main className="corefit-bg">
      <div className="corefit-container" style={{ paddingTop: 92, paddingBottom: 36 }}>
        <div className="history-hero card-dark">
          <div className="history-header">
            <div className="history-titlewrap">
              <div className="history-icon">
                <History size={18} />
              </div>
              <div>
                <div className="history-title">Sua evolucao em numeros</div>
                <div className="history-subtitle">
                  O que foi feito constrói o proximo treino.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["7d", "30d", "all"] as RangeFilter[]).map((option) => (
                <button
                  key={option}
                  className="history-filter"
                  type="button"
                  onClick={() => setRange(option)}
                  style={{
                    opacity: range === option ? 1 : 0.75,
                    borderColor: range === option ? "rgba(34,197,94,0.45)" : undefined,
                  }}
                >
                  {option === "7d" ? "7 dias" : option === "30d" ? "30 dias" : "Tudo"}
                </button>
              ))}
            </div>
          </div>

          <div className="history-hero-copy">
            <div className="history-hero-tag">Painel de performance</div>
            <p>
              Aqui voce nao ve so registros. Voce enxerga volume, consistencia e o contexto que
              alimenta a sua proxima decisao.
            </p>
          </div>

          <div className="history-trend-card">
            <div className="history-trend-head">
              <div>
                <div className="history-summary-label">Volume por sessao recente</div>
                <div className="history-trend-title">Ritmo da sua evolucao</div>
              </div>
              <div className="history-trend-icon">
                <LineChart size={16} />
              </div>
            </div>

            <div className="history-trend-bars">
                {weeklyTrend.length > 0 ? (
                  weeklyTrend.map((item) => (
                    <div key={`${item.label}-${item.volume}`} className="history-trend-bar-wrap">
                      <div
                        className="history-trend-bar"
                        style={{ height: `${item.pct}%` }}
                        title={`${item.label} - ${item.volume.toLocaleString("pt-BR")} kg`}
                      >
                        <span className="history-trend-tooltip">
                          {item.label} - {item.volume.toLocaleString("pt-BR")} kg
                        </span>
                      </div>
                      <div className="history-trend-bar-label">{item.label}</div>
                    </div>
                  ))
              ) : (
                <div className="history-trend-empty">
                  Finalize treinos com execucao registrada para ver seu ritmo aparecer aqui.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="history-summary history-summary--expanded">
          <div className="history-summary-card">
            <div className="history-summary-label">Treinos executados</div>
            <div className="history-summary-value">{summary.executedCount}</div>
            <div className="history-summary-helper">Sessoes com execucao real registrada</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Volume total</div>
            <div className="history-summary-value">
              {summary.totalVolume.toLocaleString("pt-BR")} kg
            </div>
            <div className="history-summary-helper">Carga acumulada no periodo selecionado</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Media por treino</div>
            <div className="history-summary-value">
              {summary.averageVolume != null
                ? `${summary.averageVolume.toLocaleString("pt-BR")} kg`
                : "Sem leitura"}
            </div>
            <div className="history-summary-helper">Quanto cada sessao entregou em media</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Dias ativos</div>
            <div className="history-summary-value">{summary.activeDays}</div>
            <div className="history-summary-helper">Consistencia real no periodo</div>
          </div>
        </div>

        <div className="history-highlight-row">
          <div className="history-highlight history-highlight--best">
            <div className="history-highlight-icon">
              <Flame size={16} />
            </div>
            <div>
              <div className="history-highlight-label">Melhor sessao do periodo</div>
              <div className="history-highlight-value">
                {summary.bestSessionTitle && summary.bestSessionVolume != null
                  ? `${summary.bestSessionTitle} - ${summary.bestSessionVolume.toLocaleString("pt-BR")} kg`
                  : "Ainda sem uma sessao com leitura completa"}
              </div>
            </div>
          </div>
        </div>

        <div className="history-section-label">Sessoes mais recentes (com leitura e comparacao)</div>

        {loading ? <div className="card-dark">Carregando...</div> : null}

        {!loading && error ? (
          <div className="card-dark" style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Erro</div>
            <div className="text-muted-soft">{error}</div>
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="card-dark">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Nada por aqui ainda</div>
            <div className="text-muted-soft">
              Nenhum treino encontrado nesse periodo. Tente "Tudo" ou finalize um treino.
            </div>
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="history-list">
            {items.map((item) => (
              <div key={item.id} className="history-card history-card--elevated">
                <div className="history-card-head">
                  <div>
                    <div className="history-card-title">{item.title}</div>
                    <div className="history-card-kicker">Sessao concluida e pronta para leitura</div>
                  </div>

                  <div className="history-badge-cluster">
                    {renderPeriodBadges(item.sortTime)}
                    {renderStateBadge(item)}
                  </div>
                </div>

                <div className="history-card-meta">
                  <div className="history-meta-row">
                    <CalendarDays size={12} />
                    <span>{item.dateLabel}</span>
                  </div>
                  <div className="history-meta-row">
                    <Clock3 size={12} />
                    <span>{item.durationLabel}</span>
                  </div>
                </div>

                <div className="history-card-context">
                  {renderComparison(item)}
                </div>

                <div className="history-stats">
                  {renderMetric(
                    "Series",
                    item.setsTotal != null ? String(item.setsTotal) : null,
                    item.setsTotal == null ? "Treino nao concluido" : undefined
                  )}
                  {renderMetric(
                    "Reps",
                    item.repsTotal != null ? String(item.repsTotal) : null,
                    item.repsTotal == null ? "Sem execucao registrada" : undefined
                  )}
                  {renderMetric(
                    "Volume",
                    item.volumeTotal != null ? `${item.volumeTotal.toLocaleString("pt-BR")} kg` : null,
                    item.volumeTotal == null ? "Treino sem carga consolidada" : undefined
                  )}
                </div>

                <div className="history-actions history-actions--split">
                  <Link className="history-link" href={`/workouts/${item.id}`}>
                    <span className="d-inline-flex align-items-center gap-2">
                      <Dumbbell size={14} />
                      Ver detalhes
                    </span>
                  </Link>

                  {item.trainingId ? (
                    <button
                      type="button"
                      className="history-action-btn"
                      onClick={() => restartTraining(item.trainingId!)}
                      disabled={startingTrainingId === item.trainingId}
                    >
                      <Play size={14} />
                      {startingTrainingId === item.trainingId ? "Iniciando..." : "Refazer treino"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
