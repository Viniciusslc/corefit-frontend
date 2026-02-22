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

  startedAt?: string;
  finishedAt?: string;
  endedAt?: string;

  performedExercises?: {
    exerciseName?: string;
    order: number;
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
  sortTs: number;
};

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

function formatDuration(start?: string, end?: string) {
  if (!start || !end) return "Duração: —";
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "Duração: —";

  const mins = Math.round((b - a) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h <= 0) return `Duração: ${m} min`;
  return `Duração: ${h}h ${m}min`;
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
      // conta como executada se tiver reps>0 OU weight>0
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

function getSortTs(w: WorkoutApiItem) {
  const end = w.finishedAt ?? w.endedAt ?? undefined;
  const ts = new Date(end ?? w.startedAt ?? 0).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export default function WorkoutsPage() {
  useRequireAuth();

  const HISTORY_ENDPOINT = "/workouts";

  const [raw, setRaw] = useState<WorkoutApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const items: HistoryItem[] = useMemo(() => {
    const normalized = (raw ?? [])
      // se o backend manda também "active", filtra aqui:
      .filter((w) => (w.status ?? "finished") === "finished")
      .map((w) => {
        const id = pickId(w);
        const title = w.trainingName ?? (w.trainingId ? `Treino ${w.trainingId}` : "Treino");

        const end = w.finishedAt ?? w.endedAt ?? undefined;
        const sortTs = getSortTs(w);

        const dateLabel = formatDateTimeBR(end ?? w.startedAt);
        const durationLabel = formatDuration(w.startedAt, end);

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
          sortTs,
        };
      })
      .filter((w) => !!w.id)
      .sort((a, b) => b.sortTs - a.sortTs);

    return normalized;
  }, [raw]);

  const summary = useMemo(() => {
    const executedCount = items.filter((i) => i.executed).length;
    const totalVolume = items.reduce((acc, i) => acc + (i.volumeTotal ?? 0), 0);
    return { executedCount, totalVolume };
  }, [items]);

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

          <button className="history-filter" type="button" disabled>
            Filtrar
          </button>
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
            <div className="text-muted-soft">Finalize um treino para aparecer no histórico.</div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="history-list">
            {items.map((w) => (
              <div key={w.id} className="history-card">
                <div className="history-card-head">
                  <div className="history-card-title">{w.title}</div>

                  {w.executed ? (
                    <div className="history-chip history-chip--ok">Executado</div>
                  ) : (
                    <div className="history-chip">Sem execução</div>
                  )}
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
