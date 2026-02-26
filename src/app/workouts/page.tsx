// corefit-frontend/src/app/workouts/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

type WorkoutApiItem = {
  id?: string;
  _id?: string;

  trainingName?: string;
  trainingId?: string;

  status?: "active" | "finished";

  startedAt?: string;   // ISO
  finishedAt?: string;  // ISO (se existir)
  endedAt?: string;     // ISO (alguns backends usam endedAt)

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
  dateLabel: string;
  durationLabel: string;
  setsTotal: number | null;
  repsTotal: number | null;
  volumeTotal: number | null;
  executed: boolean;
  sortTime: number; // ✅ novo (pra ordenar/filtrar sem gambiarra)
};

type RangeFilter = "7d" | "30d" | "all";

function pickId(w: WorkoutApiItem) {
  return String(w.id ?? w._id ?? "");
}

function safeNumber(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function formatDateTimeBR(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

function formatMinutesFromDates(start?: string, end?: string) {
  if (!start || !end) return "Duração: —";
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "Duração: —";
  const mins = Math.round((b - a) / 60000);
  return `Duração: ${mins} min`;
}

function computeStats(performed?: WorkoutApiItem["performedExercises"]) {
  const exs = performed ?? [];
  let sets = 0;
  let reps = 0;
  let volume = 0;

  for (const ex of exs) {
    const arr = ex.setsPerformed ?? [];
    for (const s of arr) {
      const r = safeNumber(s.reps);
      const w = safeNumber(s.weight);
      if (r > 0 || w > 0) {
        sets += 1;
        reps += r;
        volume += r * w;
      }
    }
  }

  const executed = sets > 0 || reps > 0 || volume > 0;

  return {
    executed,
    setsTotal: executed ? sets : null,
    repsTotal: executed ? reps : null,
    volumeTotal: executed ? Math.round(volume) : null,
  };
}

function startOfDayMs(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function isSameDay(aMs: number, bMs: number) {
  return startOfDayMs(new Date(aMs)) === startOfDayMs(new Date(bMs));
}

function isInLastDays(dateMs: number, days: number) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return dateMs >= cutoff;
}

function isInThisWeek(dateMs: number) {
  const now = new Date();
  const day = now.getDay(); // 0 dom ... 6 sab
  const diffToMonday = (day + 6) % 7; // seg = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return dateMs >= monday.getTime();
}

export default function WorkoutsHistoryPage() {
  useRequireAuth();

  const HISTORY_ENDPOINT = "/workouts";

  const [raw, setRaw] = useState<WorkoutApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ novo: filtro real
  const [range, setRange] = useState<RangeFilter>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<WorkoutApiItem[] | { items: WorkoutApiItem[] }>(
          HISTORY_ENDPOINT
        );

        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
          ? (data as any).items
          : [];

        setRaw(list);
      } catch (e: any) {
        setError(e?.message ?? "Erro ao carregar histórico");
        setRaw([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const itemsAll: HistoryItem[] = useMemo(() => {
    return (raw ?? [])
      // ✅ não deixa treino ativo aparecer no histórico
      .filter((w) => (w.status ? w.status !== "active" : true))
      .map((w) => {
        const id = pickId(w);
        const title = w.trainingName ?? "Treino";

        const end = w.finishedAt ?? w.endedAt ?? undefined;
        const sortTime =
          new Date(end ?? w.startedAt ?? 0).getTime() || 0;

        const dateLabel = formatDateTimeBR(end ?? w.startedAt);
        const durationLabel = formatMinutesFromDates(w.startedAt, end);

        const stats = computeStats(w.performedExercises);

        return {
          id,
          title,
          dateLabel,
          durationLabel,
          setsTotal: stats.setsTotal,
          repsTotal: stats.repsTotal,
          volumeTotal: stats.volumeTotal,
          executed: stats.executed,
          sortTime,
        };
      })
      .filter((w) => !!w.id)
      .sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0));
  }, [raw]);

  const items = useMemo(() => {
    if (range === "all") return itemsAll;

    const days = range === "7d" ? 7 : 30;
    return itemsAll.filter((i) => isInLastDays(i.sortTime, days));
  }, [itemsAll, range]);

  const summary = useMemo(() => {
    const executedCount = items.filter((i) => i.executed).length;
    const totalVolume = items.reduce((acc, i) => acc + (i.volumeTotal ?? 0), 0);
    return { executedCount, totalVolume };
  }, [items]);

  // ✅ badges úteis por card (Hoje / Esta semana)
  function renderBadges(sortTime: number) {
    const now = Date.now();
    const isToday = isSameDay(sortTime, now);
    const inWeek = isInThisWeek(sortTime);

    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {isToday && <div className="history-chip history-chip--ok">Hoje</div>}
        {!isToday && inWeek && <div className="history-chip">Esta semana</div>}
      </div>
    );
  }

  return (
    <main className="corefit-bg">
      <div className="corefit-container" style={{ paddingTop: 84, paddingBottom: 36 }}>
        {/* Header */}
        <div className="history-header">
          <div className="history-titlewrap">
            <div className="history-icon">⟲</div>
            <div>
              <div className="history-title">Histórico</div>
              <div className="history-subtitle">Seus treinos finalizados</div>
            </div>
          </div>

          {/* ✅ filtro real */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="history-filter"
              type="button"
              onClick={() => setRange("7d")}
              style={{
                opacity: range === "7d" ? 1 : 0.75,
                borderColor: range === "7d" ? "rgba(34,197,94,0.45)" : undefined,
              }}
            >
              7 dias
            </button>
            <button
              className="history-filter"
              type="button"
              onClick={() => setRange("30d")}
              style={{
                opacity: range === "30d" ? 1 : 0.75,
                borderColor: range === "30d" ? "rgba(34,197,94,0.45)" : undefined,
              }}
            >
              30 dias
            </button>
            <button
              className="history-filter"
              type="button"
              onClick={() => setRange("all")}
              style={{
                opacity: range === "all" ? 1 : 0.75,
                borderColor: range === "all" ? "rgba(34,197,94,0.45)" : undefined,
              }}
            >
              Tudo
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="history-summary">
          <div className="history-summary-card">
            <div className="history-summary-label">Treinos executados</div>
            <div className="history-summary-value">{summary.executedCount}</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Volume total</div>
            <div className="history-summary-value">
              {summary.totalVolume.toLocaleString("pt-BR")} kg
            </div>
          </div>
        </div>

        <div className="history-section-label">Treinos finalizados (mais recente primeiro)</div>

        {loading && <div className="card-dark">Carregando...</div>}

        {!loading && error && (
          <div className="card-dark" style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Erro</div>
            <div className="text-muted-soft">{error}</div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="card-dark">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Nada por aqui ainda</div>
            <div className="text-muted-soft">
              Nenhum treino encontrado nesse período. Tenta “Tudo” ou finalize um treino.
            </div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="history-list">
            {items.map((w) => (
              <div key={w.id} className="history-card">
                <div className="history-card-head">
                  <div className="history-card-title">{w.title}</div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {renderBadges(w.sortTime)}
                    {w.executed ? (
                      <div className="history-chip history-chip--ok">Executado</div>
                    ) : (
                      <div className="history-chip">Sem execução</div>
                    )}
                  </div>
                </div>

                <div className="history-card-meta">
                  <div className="history-meta-row">
                    <span className="history-meta-dot">•</span>
                    <span>{w.dateLabel}</span>
                  </div>
                  <div className="history-meta-row">
                    <span className="history-meta-dot">•</span>
                    <span>{w.durationLabel}</span>
                  </div>
                </div>

                <div className="history-stats">
                  <div className="history-stat">
                    <div className="history-stat-label">Séries</div>
                    <div className="history-stat-value">{w.setsTotal ?? "-"}</div>
                  </div>

                  <div className="history-stat">
                    <div className="history-stat-label">Reps</div>
                    <div className="history-stat-value">{w.repsTotal ?? "-"}</div>
                  </div>

                  <div className="history-stat">
                    <div className="history-stat-label">Volume</div>
                    <div className="history-stat-value">
                      {w.volumeTotal != null ? `${w.volumeTotal.toLocaleString("pt-BR")} kg` : "-"}
                    </div>
                  </div>
                </div>

                <div className="history-actions">
                  <Link className="history-link" href={`/workouts/${w.id}`}>
                    Ver detalhes <span className="history-arrow">›</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}