// corefit-frontend/src/app/workouts/active/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

/* =======================
   TIPOS
======================= */
type SnapshotExercise = {
  name: string;
  sets: number;
  reps: string;
  order?: number;
  technique?: string;
  targetWeight?: number | string;
};

type ActiveWorkout = {
  id?: string;
  _id?: string;
  trainingId?: string;
  trainingName: string;
  startedAt: string;
  status?: "active" | "finished";
  exercisesSnapshot: SnapshotExercise[];
  performedExercises?: {
    exerciseName: string;
    order: number;
    targetWeight?: number;
    setsPerformed: { reps: number; weight: number }[];
  }[];
};

type PerformedExerciseState = {
  exerciseName: string;
  order: number;
  targetWeight?: number;
  setsPerformed: { reps: number; weight: number }[];
};

type NormalizedSnapshotExercise = {
  name: string;
  sets: number;
  reps: string;
  order: number;
  technique?: string;
  targetWeight: number;
};

/* =======================
   HELPERS
======================= */
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function normalizeSnapshot(exercises: SnapshotExercise[] | undefined): NormalizedSnapshotExercise[] {
  const list = Array.isArray(exercises) ? exercises : [];
  return list
    .map((ex, idx) => {
      const tw = Number(ex.targetWeight);
      return {
        name: String(ex.name ?? ""),
        sets: Number(ex.sets ?? 0),
        reps: String(ex.reps ?? ""),
        order: typeof ex.order === "number" ? ex.order : idx,
        technique: ex.technique ? String(ex.technique) : undefined,
        targetWeight: Number.isFinite(tw) ? tw : 0,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function getPerformedAvgWeight(sets: { reps: number; weight: number }[]) {
  const valid = sets.filter((s) => (s.reps ?? 0) > 0 || (s.weight ?? 0) > 0);
  if (!valid.length) return 0;
  return valid.reduce((acc, s) => acc + (Number(s.weight) || 0), 0) / valid.length;
}

function getTargetStatus(targetWeight: number, sets: { reps: number; weight: number }[]) {
  if (!targetWeight || targetWeight <= 0) return { label: "Sem meta", diff: 0, avg: 0 };
  const avg = getPerformedAvgWeight(sets ?? []);
  if (avg <= 0) return { label: "Sem execução", diff: 0, avg: 0 };

  const diff = avg - targetWeight;
  const tolerance = 0.5;
  if (Math.abs(diff) <= tolerance) return { label: "Bateu a meta", diff, avg };
  if (diff > 0) return { label: "Acima da meta", diff, avg };
  return { label: "Abaixo da meta", diff, avg };
}

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function countDoneSets(performed: PerformedExerciseState[]) {
  return performed.reduce((acc, ex) => {
    const done = ex.setsPerformed.filter((s) => safeNumber(s.reps) > 0 || safeNumber(s.weight) > 0).length;
    return acc + done;
  }, 0);
}

function countTotalSets(snapshot: NormalizedSnapshotExercise[]) {
  return snapshot.reduce((acc, ex) => acc + safeNumber(ex.sets), 0);
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =======================
   PAGE
======================= */
export default function ActiveWorkoutPage() {
  useRequireAuth();
  const router = useRouter();

  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [performed, setPerformed] = useState<PerformedExerciseState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openOrder, setOpenOrder] = useState<number | null>(null);

  // debounce para salvar performance (sem any)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // trava contra finish duplicado
  const finishingRef = useRef(false);

  // timer UI (tempo do treino)
  const [nowTick, setNowTick] = useState(Date.now());

  const workoutId = useMemo(() => {
    return workout?.id ?? workout?._id ?? "";
  }, [workout?.id, workout?._id]);

  const snapshot = useMemo(() => {
    return workout ? normalizeSnapshot(workout.exercisesSnapshot) : [];
  }, [workout]);

  const startedAtMs = useMemo(() => {
    const t = workout?.startedAt ? new Date(workout.startedAt).getTime() : Date.now();
    return Number.isFinite(t) ? t : Date.now();
  }, [workout?.startedAt]);

  const totalSets = useMemo(() => countTotalSets(snapshot), [snapshot]);
  const doneSets = useMemo(() => countDoneSets(performed), [performed]);
  const progressPct = useMemo(() => {
    if (!totalSets) return 0;
    return Math.min(100, Math.max(0, Math.round((doneSets / totalSets) * 100)));
  }, [doneSets, totalSets]);

  useEffect(() => {
    // atualiza relógio a cada 1s
    const i = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const data = await apiFetch<ActiveWorkout | null>("/workouts/active");

        if (!data) {
          setWorkout(null);
          setPerformed([]);
          return;
        }

        setWorkout(data);

        const snap = normalizeSnapshot(data.exercisesSnapshot);
        const existing = Array.isArray(data.performedExercises)
          ? data.performedExercises.slice().sort((a, b) => a.order - b.order)
          : [];

        // abre o primeiro exercício por padrão
        setOpenOrder(snap.length ? snap[0].order : null);

        // monta performed state alinhado ao snapshot
        if (existing.length) {
          setPerformed(
            snap.map((ex) => {
              const found = existing.find((p) => p.order === ex.order);
              return {
                exerciseName: ex.name,
                order: ex.order,
                targetWeight: ex.targetWeight || 0,
                setsPerformed:
                  found?.setsPerformed?.length
                    ? found.setsPerformed.map((s) => ({
                        reps: safeNumber(s.reps),
                        weight: safeNumber(s.weight),
                      }))
                    : Array.from({ length: ex.sets }, () => ({ reps: 0, weight: 0 })),
              };
            })
          );
        } else {
          setPerformed(
            snap.map((ex) => ({
              exerciseName: ex.name,
              order: ex.order,
              targetWeight: ex.targetWeight || 0,
              setsPerformed: Array.from({ length: ex.sets }, () => ({ reps: 0, weight: 0 })),
            }))
          );
        }
      } catch (e) {
        console.error("Erro ao carregar workout ativo:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function updateSet(order: number, idx: number, field: "reps" | "weight", value: number) {
    setPerformed((prev) =>
      prev.map((ex) =>
        ex.order === order
          ? {
              ...ex,
              setsPerformed: ex.setsPerformed.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
            }
          : ex
      )
    );
  }

  function bump(order: number, idx: number, field: "reps" | "weight", delta: number) {
    setPerformed((prev) =>
      prev.map((ex) => {
        if (ex.order !== order) return ex;
        const cur = ex.setsPerformed[idx] ?? { reps: 0, weight: 0 };
        const nextVal = field === "weight" ? round1(safeNumber(cur[field]) + delta) : safeNumber(cur[field]) + delta;
        const clamped = Math.max(0, nextVal);

        return {
          ...ex,
          setsPerformed: ex.setsPerformed.map((s, i) => (i === idx ? { ...s, [field]: clamped } : s)),
        };
      })
    );
  }

  function toggleDone(order: number, idx: number) {
    // “feito” = se está vazio, coloca 1 rep (ou mantém), se já tem algo, zera tudo
    setPerformed((prev) =>
      prev.map((ex) => {
        if (ex.order !== order) return ex;
        const cur = ex.setsPerformed[idx] ?? { reps: 0, weight: 0 };
        const hasSomething = safeNumber(cur.reps) > 0 || safeNumber(cur.weight) > 0;

        const next = hasSomething ? { reps: 0, weight: 0 } : { reps: Math.max(1, safeNumber(cur.reps) || 1), weight: safeNumber(cur.weight) };

        return {
          ...ex,
          setsPerformed: ex.setsPerformed.map((s, i) => (i === idx ? next : s)),
        };
      })
    );
  }

  // Salva performance (debounce)
  useEffect(() => {
    if (!workoutId) return;
    if (!performed.length) return;
    if (finishingRef.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);

        const filtered = performed.map((ex) => ({
          exerciseName: ex.exerciseName,
          order: ex.order,
          targetWeight: safeNumber(ex.targetWeight),
          setsPerformed: ex.setsPerformed.map((s) => ({
            reps: safeNumber(s.reps),
            weight: safeNumber(s.weight),
          })),
        }));

        await apiFetch(`/workouts/${workoutId}/performance`, {
          method: "PATCH",
          body: { performedExercises: filtered },
        });
      } catch (e) {
        console.error("Erro ao salvar performance:", e);
      } finally {
        setSaving(false);
      }
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [performed, workoutId]);

  async function finishWorkout() {
    if (!workoutId) return;

    if (finishingRef.current) return;
    finishingRef.current = true;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    try {
      setSaving(true);

      // garante performance salva
      await apiFetch(`/workouts/${workoutId}/performance`, {
        method: "PATCH",
        body: { performedExercises: performed },
      });

      // finaliza (backend)
      await apiFetch(`/workouts/finish`, {
        method: "POST",
        body: { workoutId },
      });

      router.push("/dashboard");
    } catch (e: any) {
      console.error("Erro ao finalizar treino:", e);
      alert(String(e?.message ?? "Não foi possível finalizar o treino. Veja o console."));
      finishingRef.current = false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6">Carregando treino...</p>;
  if (!workout) return <p className="p-6">Nenhum treino ativo.</p>;

  const elapsed = formatElapsed(nowTick - startedAtMs);

  return (
    <div className="corefit-bg workout-page">
      <div className="corefit-container" style={{ paddingTop: 86, paddingBottom: 84 }}>
        {/* TOP */}
        <div className="workout-top">
          <div className="workout-top-left">
            <div className="workout-top-label">Progresso do treino</div>
            <div className="workout-progress">
              <div className="workout-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="workout-top-right">
            <span className="workout-chip" title="Tempo do treino">
              <span className="workout-chip-dot" />
              {elapsed}
            </span>

            <span className="workout-chip" title="Séries concluídas">
              <span className="workout-chip-dot workout-chip-dot--amber" />
              {doneSets}/{totalSets} séries
            </span>

            <button className="workout-link" onClick={finishWorkout} disabled={saving}>
              Finalizar
            </button>
          </div>
        </div>

        {/* HERO */}
        <div className="workout-hero card-dark glow-green">
          <div className="workout-hero-row">
            <div className="workout-hero-title">
              {/* ✅ badge ajustado (não precisa ser redondo) */}
              <div
                className="workout-hero-badge"
                style={{
                  width: 54,
                  padding: "0 10px",
                  borderRadius: 12,
                }}
              >
                TREINO
              </div>

              <div style={{ minWidth: 0 }}>
                <div className="workout-hero-name">{workout.trainingName}</div>
                <div className="workout-hero-sub text-muted-soft">
                  {snapshot.length} exercícios • {totalSets} séries • em andamento
                </div>
              </div>
            </div>

            <div className="workout-save text-muted-soft">{saving ? "salvando..." : "salvo"}</div>
          </div>
        </div>

        {/* LISTA */}
        <div className="workout-list">
          {snapshot.map((ex, idx) => {
            const order = ex.order;
            const state =
              performed.find((p) => p.order === order) ??
              ({
                exerciseName: ex.name,
                order,
                targetWeight: ex.targetWeight,
                setsPerformed: Array.from({ length: ex.sets }, () => ({ reps: 0, weight: 0 })),
              } as PerformedExerciseState);

            const isOpen = openOrder === order;

            const doneInExercise = state.setsPerformed.filter((s) => safeNumber(s.reps) > 0 || safeNumber(s.weight) > 0).length;
            const status = getTargetStatus(ex.targetWeight, state.setsPerformed);
            const showNumbers = ex.targetWeight > 0 && status.avg > 0;

            return (
              <div key={order} className={`workout-ex-card ${isOpen ? "workout-ex-card--open" : ""}`}>
                <button
                  type="button"
                  className="workout-ex-head"
                  onClick={() => setOpenOrder((cur) => (cur === order ? null : order))}
                >
                  <div className="workout-ex-head-left">
                    <div className="workout-ex-index">{idx + 1}</div>

                    <div className="workout-ex-meta">
                      <div className="workout-ex-name">{ex.name}</div>
                      <div className="workout-ex-sub text-muted-soft">
                        {ex.sets}× {ex.reps}
                        {ex.targetWeight > 0 ? ` • Meta: ${round1(ex.targetWeight)}kg` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="workout-ex-head-right">
                    <span className="workout-ex-badge">
                      {doneInExercise}/{ex.sets}
                    </span>
                    <span className={`workout-ex-chevron ${isOpen ? "open" : ""}`}>˅</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="workout-ex-body">
                    {/* STATUS */}
                    <div className="workout-ex-status">
                      <span className="workout-ex-status-label">{status.label}</span>

                      {ex.targetWeight > 0 && (
                        <span className="workout-ex-status-item">
                          Meta: <b>{round1(ex.targetWeight)} kg</b>
                        </span>
                      )}

                      {showNumbers && (
                        <span className="workout-ex-status-item">
                          Média: <b>{round1(status.avg)} kg</b>{" "}
                          <span className="text-muted-soft">
                            (Δ {status.diff >= 0 ? "+" : ""}
                            {round1(status.diff)} kg)
                          </span>
                        </span>
                      )}
                    </div>

                    {/* GRID HEAD */}
                    <div className="workout-grid-head">
                      <div>Série</div>
                      <div>Reps</div>
                      <div>Peso (kg)</div>
                      <div style={{ textAlign: "right" }}>✓</div>
                    </div>

                    {/* SETS */}
                    {Array.from({ length: ex.sets }).map((_, i) => {
                      const cur = state.setsPerformed[i] ?? { reps: 0, weight: 0 };
                      const isDone = safeNumber(cur.reps) > 0 || safeNumber(cur.weight) > 0;

                      return (
                        <div key={`${order}-${i}`} className={`workout-set-row ${isDone ? "workout-set-row--done" : ""}`}>
                          <div className="workout-set-cell--set">
                            <div className="workout-set-pill">{i + 1}</div>
                          </div>

                          {/* REPS */}
                          <div className="workout-stepper workout-stepper--reps">
                            <button type="button" className="workout-step" onClick={() => bump(order, i, "reps", -1)} aria-label="diminuir reps">
                              –
                            </button>

                            <input
                              className="workout-input"
                              type="number"
                              inputMode="numeric"
                              value={safeNumber(cur.reps) === 0 ? "" : String(cur.reps)}
                              placeholder="-"
                              onChange={(e) => updateSet(order, i, "reps", safeNumber(e.target.value))}
                              onFocus={(e) => e.currentTarget.select()}
                            />

                            <button type="button" className="workout-step" onClick={() => bump(order, i, "reps", +1)} aria-label="aumentar reps">
                              +
                            </button>
                          </div>

                          {/* WEIGHT */}
                          <div className="workout-stepper workout-stepper--weight">
                            <button type="button" className="workout-step" onClick={() => bump(order, i, "weight", -0.5)} aria-label="diminuir peso">
                              –
                            </button>

                            <input
                              className="workout-input"
                              type="number"
                              step="0.5"
                              inputMode="decimal"
                              value={safeNumber(cur.weight) === 0 ? "" : String(cur.weight)}
                              placeholder="-"
                              onChange={(e) => updateSet(order, i, "weight", safeNumber(e.target.value))}
                              onFocus={(e) => e.currentTarget.select()}
                            />

                            <button type="button" className="workout-step" onClick={() => bump(order, i, "weight", +0.5)} aria-label="aumentar peso">
                              +
                            </button>
                          </div>

                          {/* CHECK */}
                          <div className="workout-set-cell--check">
                            <button
                              type="button"
                              className={`workout-check ${isDone ? "workout-check--on" : ""}`}
                              onClick={() => toggleDone(order, i)}
                              aria-label="marcar série"
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="workout-hint">Use + e − para ajustar os valores rapidamente</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER FIXO */}
      <div className="workout-footer">
        <div className="corefit-container">
          <button className="btn-soft workout-footer-btn" type="button" onClick={() => router.push("/dashboard")} disabled={saving}>
            Cancelar
          </button>

          <button className="btn-green workout-footer-btn workout-footer-primary" type="button" onClick={finishWorkout} disabled={saving}>
            Finalizar ({doneSets}/{totalSets})
          </button>
        </div>
      </div>
    </div>
  );
}
