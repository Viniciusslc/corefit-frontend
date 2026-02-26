"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

type WorkoutDetail = {
  id?: string;
  _id?: string;

  trainingName?: string;
  trainingId?: string;

  status?: "active" | "finished";

  startedAt?: string;   // ISO
  finishedAt?: string;  // ISO
  endedAt?: string;     // ISO

  performedExercises?: {
    exerciseName: string;
    order: number;
    targetWeight?: number;
    setsPerformed: { reps: number; weight: number }[];
  }[];
};

function pickId(w: WorkoutDetail) {
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

function computeSummary(performed?: WorkoutDetail["performedExercises"]) {
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
    setsTotal: executed ? sets : 0,
    repsTotal: executed ? reps : 0,
    volumeTotal: executed ? Math.round(volume) : 0,
  };
}

export default function WorkoutDetailPage() {
  useRequireAuth();

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workoutId = params?.id;

  const [data, setData] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!workoutId) return;

      setLoading(true);
      setError(null);

      try {
        const w = await apiFetch<WorkoutDetail>(`/workouts/${workoutId}`);
        setData(w);
      } catch (e: any) {
        setError(e?.message ?? "Erro ao carregar treino");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workoutId]);

  const end = data?.finishedAt ?? data?.endedAt ?? undefined;

  const exercises = useMemo(() => {
    const list = [...(data?.performedExercises ?? [])];
    list.sort((a, b) => safeNumber(a.order) - safeNumber(b.order));
    return list;
  }, [data]);

  const summary = useMemo(() => computeSummary(data?.performedExercises), [data]);

  return (
    <main className="corefit-bg">
      <div className="corefit-container" style={{ paddingTop: 84, paddingBottom: 36 }}>
        {/* Header */}
        <div className="history-header">
          <div className="history-titlewrap">
            <div className="history-icon">⟲</div>
            <div>
              <div className="history-title">Detalhe do treino</div>
              <div className="history-subtitle">
                {data?.trainingName ?? "Treino"} • {end ? "Finalizado" : "Em andamento"}
              </div>
            </div>
          </div>

          <button className="history-filter" type="button" onClick={() => router.back()}>
            Voltar
          </button>
        </div>

        {/* Meta info */}
        <div className="card-dark" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{data?.trainingName ?? "Treino"}</div>
              <div className="text-muted-soft" style={{ marginTop: 6 }}>
                <span className="history-meta-dot">•</span>{" "}
                Início: {formatDateTimeBR(data?.startedAt)}
                <br />
                <span className="history-meta-dot">•</span>{" "}
                Fim: {formatDateTimeBR(end)}
                <br />
                <span className="history-meta-dot">•</span>{" "}
                {formatMinutesFromDates(data?.startedAt, end)}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {summary.executed ? (
                <div className="history-chip history-chip--ok">Executado</div>
              ) : (
                <div className="history-chip">Sem execução</div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo (Sprint 1) */}
        <div className="history-summary" style={{ marginBottom: 18 }}>
          <div className="history-summary-card">
            <div className="history-summary-label">Séries totais</div>
            <div className="history-summary-value">{summary.setsTotal}</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Reps totais</div>
            <div className="history-summary-value">{summary.repsTotal}</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Volume total</div>
            <div className="history-summary-value">
              {summary.volumeTotal.toLocaleString("pt-BR")} kg
            </div>
          </div>
        </div>

        {/* Planejado vs Executado (versão 1: usando targetWeight como “meta”) */}
        <div className="history-section-label">Planejado vs Executado</div>

        {loading && <div className="card-dark">Carregando...</div>}

        {!loading && error && (
          <div className="card-dark" style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Erro</div>
            <div className="text-muted-soft">{error}</div>
          </div>
        )}

        {!loading && !error && !data && (
          <div className="card-dark">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Não encontrado</div>
            <div className="text-muted-soft">Esse treino não existe ou você não tem acesso.</div>
          </div>
        )}

        {!loading && !error && data && exercises.length === 0 && (
          <div className="card-dark">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Sem exercícios</div>
            <div className="text-muted-soft">Não há execução registrada nesse treino.</div>
          </div>
        )}

        {!loading && !error && data && exercises.length > 0 && (
          <div className="history-list">
            {exercises.map((ex) => {
              const sets = (ex.setsPerformed ?? []).filter(
                (s) => safeNumber(s.reps) > 0 || safeNumber(s.weight) > 0
              );

              // estatísticas por exercício
              const exSets = sets.length;
              const exReps = sets.reduce((acc, s) => acc + safeNumber(s.reps), 0);
              const exVol = Math.round(sets.reduce((acc, s) => acc + safeNumber(s.reps) * safeNumber(s.weight), 0));

              return (
                <div key={`${ex.order}-${ex.exerciseName}`} className="history-card">
                  <div className="history-card-head">
                    <div className="history-card-title">
                      <span style={{ opacity: 0.6, marginRight: 8 }}>#{ex.order + 1}</span>
                      {ex.exerciseName}
                    </div>

                    {typeof ex.targetWeight === "number" ? (
                      <div className="history-chip history-chip--ok">Meta: {ex.targetWeight}kg</div>
                    ) : (
                      <div className="history-chip">Sem meta</div>
                    )}
                  </div>

                  <div className="history-stats" style={{ marginTop: 12 }}>
                    <div className="history-stat">
                      <div className="history-stat-label">Séries</div>
                      <div className="history-stat-value">{exSets || "-"}</div>
                    </div>

                    <div className="history-stat">
                      <div className="history-stat-label">Reps</div>
                      <div className="history-stat-value">{exReps || "-"}</div>
                    </div>

                    <div className="history-stat">
                      <div className="history-stat-label">Volume</div>
                      <div className="history-stat-value">
                        {exSets ? `${exVol.toLocaleString("pt-BR")} kg` : "-"}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {sets.length === 0 ? (
                      <div className="text-muted-soft">Sem execução registrada.</div>
                    ) : (
                      sets.map((s, idx) => (
                        <div
                          key={idx}
                          className="card-dark"
                          style={{
                            padding: "10px 12px",
                            borderRadius: 14,
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>
                            Série {idx + 1}
                            <span style={{ opacity: 0.45, margin: "0 8px" }}>•</span>
                            {safeNumber(s.reps)} reps
                            <span style={{ opacity: 0.45, margin: "0 8px" }}>•</span>
                            {safeNumber(s.weight)} kg
                          </div>

                          {/* indicador simples “meta vs feito” quando tiver meta */}
                          {typeof ex.targetWeight === "number" && (
                            <div className="text-muted-soft" style={{ marginTop: 4 }}>
                              {safeNumber(s.weight) >= ex.targetWeight ? "✅ Acima/Bateu a meta" : "⬆️ Abaixo da meta"}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="history-actions" style={{ marginTop: 14 }}>
                    <Link className="history-link" href="/workouts">
                      Voltar pro histórico <span className="history-arrow">›</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}