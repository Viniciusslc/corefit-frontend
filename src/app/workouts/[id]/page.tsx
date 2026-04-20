"use client";

import "../workouts.css";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, History } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

type WorkoutDetail = {
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

function formatMinutesFromDates(start?: string, end?: string) {
  if (!start || !end) return "Duracao: -";
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return "Duracao: -";
  }
  const mins = Math.round((endMs - startMs) / 60000);
  return `Duracao: ${mins} min`;
}

function computeSummary(performed?: WorkoutDetail["performedExercises"]) {
  let sets = 0;
  let reps = 0;
  let volume = 0;

  for (const exercise of performed ?? []) {
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
        const workout = await apiFetch<WorkoutDetail>(`/workouts/${workoutId}`);
        setData(workout);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao carregar treino";
        setError(message);
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
      <div className="corefit-container" style={{ paddingTop: 92, paddingBottom: 36 }}>
        <div className="history-header card-dark" style={{ marginBottom: 16 }}>
          <div className="history-titlewrap">
            <div className="history-icon">
              <History size={18} />
            </div>
            <div>
              <div className="history-title">Detalhe do treino</div>
              <div className="history-subtitle">
                {data?.trainingName ?? "Treino"} / {end ? "Finalizado" : "Em andamento"}
              </div>
            </div>
          </div>

          <button className="history-filter" type="button" onClick={() => router.back()}>
            <span className="d-inline-flex align-items-center gap-2">
              <ArrowLeft size={14} />
              Voltar
            </span>
          </button>
        </div>

        <div className="card-dark" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{data?.trainingName ?? "Treino"}</div>
              <div className="text-muted-soft" style={{ marginTop: 8, display: "grid", gap: 8 }}>
                <div className="d-inline-flex align-items-center gap-2">
                  <CalendarDays size={12} />
                  Inicio: {formatDateTimeBR(data?.startedAt)}
                </div>
                <div className="d-inline-flex align-items-center gap-2">
                  <CalendarDays size={12} />
                  Fim: {formatDateTimeBR(end)}
                </div>
                <div className="d-inline-flex align-items-center gap-2">
                  <Clock3 size={12} />
                  {formatMinutesFromDates(data?.startedAt, end)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {summary.executed ? (
                <div className="history-chip history-chip--ok">Executado</div>
              ) : (
                <div className="history-chip">Sem execucao</div>
              )}
            </div>
          </div>
        </div>

        <div className="history-summary" style={{ marginBottom: 18 }}>
          <div className="history-summary-card">
            <div className="history-summary-label">Series totais</div>
            <div className="history-summary-value">{summary.setsTotal}</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Reps totais</div>
            <div className="history-summary-value">{summary.repsTotal}</div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-label">Volume total</div>
            <div className="history-summary-value">{summary.volumeTotal.toLocaleString("pt-BR")} kg</div>
          </div>
        </div>

        <div className="history-section-label">Planejado vs executado</div>

        {loading ? <div className="card-dark">Carregando...</div> : null}

        {!loading && error ? (
          <div className="card-dark" style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Erro</div>
            <div className="text-muted-soft">{error}</div>
          </div>
        ) : null}

        {!loading && !error && !data ? (
          <div className="card-dark">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Nao encontrado</div>
            <div className="text-muted-soft">Esse treino nao existe ou voce nao tem acesso.</div>
          </div>
        ) : null}

        {!loading && !error && data && exercises.length === 0 ? (
          <div className="card-dark">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Sem exercicios</div>
            <div className="text-muted-soft">Nao ha execucao registrada nesse treino.</div>
          </div>
        ) : null}

        {!loading && !error && data && exercises.length > 0 ? (
          <div className="history-list">
            {exercises.map((exercise) => {
              const sets = (exercise.setsPerformed ?? []).filter(
                (set) => safeNumber(set.reps) > 0 || safeNumber(set.weight) > 0,
              );

              const exerciseSets = sets.length;
              const exerciseReps = sets.reduce((acc, set) => acc + safeNumber(set.reps), 0);
              const exerciseVolume = Math.round(
                sets.reduce((acc, set) => acc + safeNumber(set.reps) * safeNumber(set.weight), 0),
              );

              return (
                <div key={`${exercise.order}-${exercise.exerciseName}`} className="history-card">
                  <div className="history-card-head">
                    <div className="history-card-title">
                      <span style={{ opacity: 0.6, marginRight: 8 }}>#{safeNumber(exercise.order) + 1}</span>
                      {exercise.exerciseName}
                    </div>

                    {typeof exercise.targetWeight === "number" ? (
                      <div className="history-chip history-chip--ok">Meta: {exercise.targetWeight}kg</div>
                    ) : (
                      <div className="history-chip">Sem meta</div>
                    )}
                  </div>

                  <div className="history-stats" style={{ marginTop: 12 }}>
                    <div className="history-stat">
                      <div className="history-stat-label">Series</div>
                      <div className="history-stat-value">{exerciseSets || "-"}</div>
                    </div>

                    <div className="history-stat">
                      <div className="history-stat-label">Reps</div>
                      <div className="history-stat-value">{exerciseReps || "-"}</div>
                    </div>

                    <div className="history-stat">
                      <div className="history-stat-label">Volume</div>
                      <div className="history-stat-value">
                        {exerciseSets ? `${exerciseVolume.toLocaleString("pt-BR")} kg` : "-"}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {sets.length === 0 ? (
                      <div className="text-muted-soft">Sem execucao registrada.</div>
                    ) : (
                      sets.map((set, index) => (
                        <div
                          key={`${exercise.exerciseName}-${index}`}
                          className="card-dark"
                          style={{
                            padding: "10px 12px",
                            borderRadius: 14,
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>
                            Serie {index + 1}
                            <span style={{ opacity: 0.45, margin: "0 8px" }}>/</span>
                            {safeNumber(set.reps)} reps
                            <span style={{ opacity: 0.45, margin: "0 8px" }}>/</span>
                            {safeNumber(set.weight)} kg
                          </div>

                          {typeof exercise.targetWeight === "number" ? (
                            <div className="text-muted-soft" style={{ marginTop: 4 }}>
                              {safeNumber(set.weight) >= exercise.targetWeight
                                ? "Meta atingida ou superada"
                                : "Abaixo da meta"}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="history-actions" style={{ marginTop: 14 }}>
                    <Link className="history-link" href="/workouts">
                      <span className="d-inline-flex align-items-center gap-2">
                        <ArrowLeft size={14} />
                        Voltar para o historico
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
