"use client";

import "../workouts.css";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Dumbbell, PlayCircle, Sparkles } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

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

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isSetLogged(set: { reps: number; weight: number }) {
  return safeNumber(set.reps) > 0 || safeNumber(set.weight) > 0;
}

function normalizeSnapshot(
  exercises: SnapshotExercise[] | undefined
): NormalizedSnapshotExercise[] {
  const list = Array.isArray(exercises) ? exercises : [];

  return list
    .map((exercise, index) => {
      const targetWeight = Number(exercise.targetWeight);

      return {
        name: String(exercise.name ?? ""),
        sets: Number(exercise.sets ?? 0),
        reps: String(exercise.reps ?? ""),
        order: typeof exercise.order === "number" ? exercise.order : index,
        technique: exercise.technique ? String(exercise.technique) : undefined,
        targetWeight: Number.isFinite(targetWeight) ? targetWeight : 0,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function getPerformedAvgWeight(sets: { reps: number; weight: number }[]) {
  const valid = sets.filter((set) => isSetLogged(set));
  if (!valid.length) return 0;

  return valid.reduce((acc, set) => acc + safeNumber(set.weight), 0) / valid.length;
}

function getTargetStatus(
  targetWeight: number,
  sets: { reps: number; weight: number }[]
) {
  if (!targetWeight || targetWeight <= 0) {
    return { label: "Sem meta", diff: 0, avg: 0 };
  }

  const avg = getPerformedAvgWeight(sets);
  if (avg <= 0) {
    return { label: "Sem execucao", diff: 0, avg: 0 };
  }

  const diff = avg - targetWeight;
  const tolerance = 0.5;

  if (Math.abs(diff) <= tolerance) {
    return { label: "Meta alinhada", diff, avg };
  }

  if (diff > 0) {
    return { label: "Acima da meta", diff, avg };
  }

  return { label: "Abaixo da meta", diff, avg };
}

function countDoneSets(performed: PerformedExerciseState[]) {
  return performed.reduce((acc, exercise) => {
    return acc + exercise.setsPerformed.filter(isSetLogged).length;
  }, 0);
}

function countTotalSets(snapshot: NormalizedSnapshotExercise[]) {
  return snapshot.reduce((acc, exercise) => acc + safeNumber(exercise.sets), 0);
}

function findFirstPendingSet(sets: { reps: number; weight: number }[]) {
  return sets.findIndex((set) => !isSetLogged(set));
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getPrimaryCtaLabel(doneSets: number, totalSets: number) {
  if (!totalSets) return "Aguardar treino";
  if (doneSets <= 0) return "Comecar treino";
  if (doneSets >= totalSets) return "Finalizar treino";
  return `Continuar (${doneSets}/${totalSets})`;
}

function getProgressSummary(doneSets: number, totalSets: number) {
  if (!totalSets) return "Nenhuma serie disponivel";
  if (doneSets <= 0) return `0 de ${totalSets} series concluidas`;
  if (doneSets >= totalSets) return `${totalSets} de ${totalSets} series concluidas`;
  return `${doneSets} de ${totalSets} series concluidas`;
}

function getGlobalGuidance(
  snapshot: NormalizedSnapshotExercise[],
  performed: PerformedExerciseState[],
  doneSets: number,
  totalSets: number
) {
  if (!totalSets || !snapshot.length) {
    return {
      label: "Treino em preparo",
      text: "Assim que o treino iniciar, esta tela vira seu painel de execucao em tempo real.",
    };
  }

  for (const exercise of snapshot) {
    const state = performed.find((item) => item.order === exercise.order);
    const pendingIndex = findFirstPendingSet(state?.setsPerformed ?? []);

    if (pendingIndex >= 0) {
      if (doneSets <= 0) {
        return {
          label: "Primeira acao",
          text: `Comece por ${exercise.name} e registre a serie ${pendingIndex + 1} para ativar a leitura do treino.`,
        };
      }

      return {
        label: "Proxima acao",
        text: `${exercise.name}: avance para a serie ${pendingIndex + 1} e mantenha o ritmo que voce ja abriu.`,
      };
    }
  }

  return {
    label: "Tudo pronto",
    text: "Tudo registrado. Revise a sessao e finalize para salvar seu historico completo.",
  };
}

function getExerciseInsight(
  exercise: NormalizedSnapshotExercise,
  state: PerformedExerciseState
) {
  const doneSets = state.setsPerformed.filter(isSetLogged).length;
  const pendingIndex = findFirstPendingSet(state.setsPerformed);
  const lastLoggedSet = [...state.setsPerformed].reverse().find(isSetLogged);
  const lastWeight = safeNumber(lastLoggedSet?.weight);

  let label = "Proxima acao";
  let title = `Serie ${Math.max(1, pendingIndex + 1)} pronta para registrar`;
  let detail = "Preencha reps e carga para transformar execucao em leitura clara.";

  if (doneSets <= 0) {
    title = "Comece pela primeira serie";
    detail =
      exercise.targetWeight > 0
        ? `Meta do bloco: ${round1(exercise.targetWeight)} kg. Registre a primeira serie com leitura limpa.`
        : "Comece com reps e carga reais para gerar contexto desde o inicio.";
  } else if (pendingIndex >= 0) {
    title = `Ritmo ativo: va para a serie ${pendingIndex + 1}`;
    detail =
      lastWeight > 0 && exercise.targetWeight > 0
        ? `Ultima carga registrada: ${round1(lastWeight)} kg. Meta atual: ${round1(exercise.targetWeight)} kg.`
        : lastWeight > 0
          ? `Ultima carga registrada: ${round1(lastWeight)} kg. Use isso como referencia para a proxima serie.`
          : "Mantenha a sequencia do exercicio para nao perder o ritmo da sessao.";
  } else {
    label = "Exercicio concluido";
    title = "Bloco fechado com leitura registrada";
    detail =
      lastWeight > 0
        ? `Ultima carga registrada: ${round1(lastWeight)} kg. Siga para o proximo exercicio com esse contexto salvo.`
        : "Todas as series foram registradas. Voce ja pode seguir para o proximo bloco.";
  }

  const support = exercise.technique
    ? `Foco tecnico: ${exercise.technique}.`
    : "Use os controles rapidos para ajustar reps e carga sem quebrar o ritmo.";

  return { label, title, detail, support, pendingIndex, doneSets };
}

export default function ActiveWorkoutPage() {
  useRequireAuth();
  const router = useRouter();

  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [performed, setPerformed] = useState<PerformedExerciseState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openOrder, setOpenOrder] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [progressFlash, setProgressFlash] = useState(false);
  const [completionPulse, setCompletionPulse] = useState<"none" | "block" | "ready">("none");
  const [interactionKey, setInteractionKey] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishingRef = useRef(false);
  const previousDoneSetsRef = useRef(0);

  const workoutId = useMemo(() => workout?.id ?? workout?._id ?? "", [workout?.id, workout?._id]);

  const snapshot = useMemo(() => {
    return workout ? normalizeSnapshot(workout.exercisesSnapshot) : [];
  }, [workout]);

  const startedAtMs = useMemo(() => {
    const timestamp = workout?.startedAt ? new Date(workout.startedAt).getTime() : Date.now();
    return Number.isFinite(timestamp) ? timestamp : Date.now();
  }, [workout?.startedAt]);

  const totalSets = useMemo(() => countTotalSets(snapshot), [snapshot]);
  const doneSets = useMemo(() => countDoneSets(performed), [performed]);

  const progressPct = useMemo(() => {
    if (!totalSets) return 0;
    return Math.min(100, Math.max(0, Math.round((doneSets / totalSets) * 100)));
  }, [doneSets, totalSets]);

  const progressSummary = useMemo(() => {
    return getProgressSummary(doneSets, totalSets);
  }, [doneSets, totalSets]);

  const primaryCtaLabel = useMemo(() => {
    return getPrimaryCtaLabel(doneSets, totalSets);
  }, [doneSets, totalSets]);

  const globalGuidance = useMemo(() => {
    return getGlobalGuidance(snapshot, performed, doneSets, totalSets);
  }, [snapshot, performed, doneSets, totalSets]);

  const isWorkoutComplete = totalSets > 0 && doneSets >= totalSets;
  const elapsedMinutes = Math.floor(Math.max(0, nowTick - startedAtMs) / 60000);
  const timerTone =
    elapsedMinutes >= 30 ? "workout-chip--timer-hot" : elapsedMinutes >= 15 ? "workout-chip--timer-warm" : "";

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!interactionKey) return;

    const timeout = setTimeout(() => setInteractionKey(null), 260);
    return () => clearTimeout(timeout);
  }, [interactionKey]);

  useEffect(() => {
    const previousDoneSets = previousDoneSetsRef.current;

    if (doneSets > previousDoneSets) {
      setProgressFlash(true);
      setCompletionPulse(doneSets >= totalSets && totalSets > 0 ? "ready" : "block");

      const timeout = setTimeout(() => {
        setProgressFlash(false);
        setCompletionPulse("none");
      }, doneSets >= totalSets && totalSets > 0 ? 1200 : 700);

      previousDoneSetsRef.current = doneSets;
      return () => clearTimeout(timeout);
    }

    previousDoneSetsRef.current = doneSets;
  }, [doneSets, totalSets]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const data = await apiFetch<ActiveWorkout | null>("/workouts/active");

        if (!mounted) return;

        if (!data) {
          setWorkout(null);
          setPerformed([]);
          return;
        }

        setWorkout(data);

        const nextSnapshot = normalizeSnapshot(data.exercisesSnapshot);
        const existing = Array.isArray(data.performedExercises)
          ? data.performedExercises.slice().sort((a, b) => a.order - b.order)
          : [];

        setOpenOrder(nextSnapshot.length ? nextSnapshot[0].order : null);

        if (existing.length) {
          setPerformed(
            nextSnapshot.map((exercise) => {
              const found = existing.find((item) => item.order === exercise.order);
              return {
                exerciseName: exercise.name,
                order: exercise.order,
                targetWeight: exercise.targetWeight || 0,
                setsPerformed: found?.setsPerformed?.length
                  ? found.setsPerformed.map((set) => ({
                      reps: safeNumber(set.reps),
                      weight: safeNumber(set.weight),
                    }))
                  : Array.from({ length: exercise.sets }, () => ({ reps: 0, weight: 0 })),
              };
            })
          );
        } else {
          setPerformed(
            nextSnapshot.map((exercise) => ({
              exerciseName: exercise.name,
              order: exercise.order,
              targetWeight: exercise.targetWeight || 0,
              setsPerformed: Array.from({ length: exercise.sets }, () => ({ reps: 0, weight: 0 })),
            }))
          );
        }
      } catch (error) {
        console.error("Erro ao carregar workout ativo:", error);
        if (!mounted) return;
        setWorkout(null);
        setPerformed([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  function updateSet(order: number, idx: number, field: "reps" | "weight", value: number) {
    setInteractionKey(`${field}-${order}-${idx}`);

    setPerformed((prev) =>
      prev.map((exercise) =>
        exercise.order === order
          ? {
              ...exercise,
              setsPerformed: exercise.setsPerformed.map((set, setIndex) =>
                setIndex === idx ? { ...set, [field]: value } : set
              ),
            }
          : exercise
      )
    );
  }

  function bump(order: number, idx: number, field: "reps" | "weight", delta: number) {
    setInteractionKey(`${field}-${order}-${idx}`);

    setPerformed((prev) =>
      prev.map((exercise) => {
        if (exercise.order !== order) return exercise;

        const current = exercise.setsPerformed[idx] ?? { reps: 0, weight: 0 };
        const nextValue =
          field === "weight"
            ? round1(safeNumber(current[field]) + delta)
            : safeNumber(current[field]) + delta;

        return {
          ...exercise,
          setsPerformed: exercise.setsPerformed.map((set, setIndex) =>
            setIndex === idx ? { ...set, [field]: Math.max(0, nextValue) } : set
          ),
        };
      })
    );
  }

  function toggleDone(order: number, idx: number) {
    setInteractionKey(`done-${order}-${idx}`);

    const currentExercise = performed.find((item) => item.order === order);
    const currentSet = currentExercise?.setsPerformed[idx] ?? { reps: 0, weight: 0 };
    const alreadyLogged = isSetLogged(currentSet);

    if (!alreadyLogged && currentExercise) {
      const nextSets = currentExercise.setsPerformed.map((set, setIndex) =>
        setIndex === idx
          ? {
              reps: Math.max(1, safeNumber(currentSet.reps) || 1),
              weight: safeNumber(currentSet.weight),
            }
          : set
      );

      const allDone = nextSets.every(isSetLogged);
      if (allDone) {
        const currentIndex = snapshot.findIndex((item) => item.order === order);
        const nextExercise = snapshot[currentIndex + 1];
        if (nextExercise) {
          setOpenOrder(nextExercise.order);
        }
      } else {
        setOpenOrder(order);
      }
    }

    setPerformed((prev) =>
      prev.map((exercise) => {
        if (exercise.order !== order) return exercise;

        const current = exercise.setsPerformed[idx] ?? { reps: 0, weight: 0 };
        const next = isSetLogged(current)
          ? { reps: 0, weight: 0 }
          : { reps: Math.max(1, safeNumber(current.reps) || 1), weight: safeNumber(current.weight) };

        return {
          ...exercise,
          setsPerformed: exercise.setsPerformed.map((set, setIndex) =>
            setIndex === idx ? next : set
          ),
        };
      })
    );
  }

  useEffect(() => {
    if (!workoutId || !performed.length || finishingRef.current) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);

        const filtered = performed.map((exercise) => ({
          exerciseName: exercise.exerciseName,
          order: exercise.order,
          targetWeight: safeNumber(exercise.targetWeight),
          setsPerformed: exercise.setsPerformed.map((set) => ({
            reps: safeNumber(set.reps),
            weight: safeNumber(set.weight),
          })),
        }));

        await apiFetch(`/workouts/${workoutId}/performance`, {
          method: "PATCH",
          body: { performedExercises: filtered },
        });
      } catch (error) {
        console.error("Erro ao salvar performance:", error);
      } finally {
        setSaving(false);
      }
    }, 600);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [performed, workoutId]);

  async function finishWorkout() {
    if (!workoutId || finishingRef.current) return;

    finishingRef.current = true;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    try {
      setSaving(true);

      await apiFetch(`/workouts/${workoutId}/performance`, {
        method: "PATCH",
        body: { performedExercises: performed },
      });

      await apiFetch("/workouts/finish", {
        method: "POST",
        body: { workoutId },
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Erro ao finalizar treino:", error);
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";

      alert(message || "Nao foi possivel finalizar o treino. Veja o console.");
      finishingRef.current = false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="corefit-bg">
        <div className="corefit-container" style={{ paddingTop: 86, paddingBottom: 40 }}>
          <div className="card-dark p-4" style={{ color: "rgba(255,255,255,0.92)" }}>
            Carregando treino...
          </div>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="corefit-bg">
        <div className="corefit-container" style={{ paddingTop: 92, paddingBottom: 56 }}>
          <div
            className="card-dark glow-green"
            style={{
              position: "relative",
              overflow: "hidden",
              padding: 28,
              borderRadius: 24,
              background: "linear-gradient(135deg, rgba(11,24,15,0.96), rgba(10,10,10,0.96))",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "0 auto auto 0",
                width: "100%",
                height: 120,
                background: "rgba(34,197,94,0.08)",
                filter: "blur(36px)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(34,197,94,0.20)",
                  background: "rgba(34,197,94,0.10)",
                  color: "rgba(134,239,172,0.95)",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                <Dumbbell size={14} />
                treino em espera
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                    lineHeight: 0.96,
                    letterSpacing: "-0.05em",
                    color: "rgba(255,255,255,0.97)",
                    maxWidth: 460,
                  }}
                >
                  Nenhum treino ativo no momento.
                </div>

                <div
                  style={{
                    marginTop: 14,
                    maxWidth: 640,
                    color: "rgba(229,231,235,0.68)",
                    fontSize: 15,
                    lineHeight: 1.8,
                  }}
                >
                  Para comecar uma sessao, entre em <b style={{ color: "rgba(255,255,255,0.94)" }}>Treinos</b>,
                  escolha o plano que voce quer executar e clique em{" "}
                  <b style={{ color: "rgba(255,255,255,0.94)" }}>Iniciar</b>.
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ color: "rgba(134,239,172,0.95)", fontWeight: 800, fontSize: 13 }}>
                    1. Escolha um treino
                  </div>
                  <div style={{ marginTop: 8, color: "rgba(229,231,235,0.62)", fontSize: 13, lineHeight: 1.7 }}>
                    Abra sua lista de treinos e selecione a estrutura que voce vai executar hoje.
                  </div>
                </div>

                <div
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ color: "rgba(134,239,172,0.95)", fontWeight: 800, fontSize: 13 }}>
                    2. Inicie a sessao
                  </div>
                  <div style={{ marginTop: 8, color: "rgba(229,231,235,0.62)", fontSize: 13, lineHeight: 1.7 }}>
                    Assim que iniciar, esta tela vira seu painel ativo para registrar reps, carga e progresso.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button
                  type="button"
                  className="btn-green"
                  onClick={() => router.push("/trainings")}
                  style={{
                    minHeight: 50,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    borderRadius: 16,
                    fontWeight: 900,
                  }}
                >
                  <PlayCircle size={18} />
                  Ir para treinos
                </button>

                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => router.push("/dashboard")}
                  style={{
                    minHeight: 50,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    borderRadius: 16,
                    fontWeight: 800,
                  }}
                >
                  Voltar ao dashboard
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const elapsed = formatElapsed(nowTick - startedAtMs);

  return (
    <div className="corefit-bg workout-page">
      <div className="corefit-container" style={{ paddingTop: 86, paddingBottom: 84 }}>
        <div className="workout-top">
          <div className="workout-top-left">
            <div className="workout-top-label">Progresso do treino</div>
            <div className={`workout-top-copy ${progressFlash ? "workout-top-copy--flash" : ""}`}>
              {progressSummary}
            </div>
            <div className="workout-progress">
              <div
                className={[
                  "workout-progress-bar",
                  progressFlash ? "workout-progress-bar--flash" : "",
                  isWorkoutComplete ? "workout-progress-bar--complete" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="workout-top-right">
            <span
              className={["workout-chip", "workout-chip--timer", timerTone].filter(Boolean).join(" ")}
              title="Tempo do treino"
            >
              <span className="workout-chip-dot" />
              {elapsed}
            </span>

            <span
              className={[
                "workout-chip",
                "workout-chip--progress",
                progressFlash ? "workout-chip--flash" : "",
                isWorkoutComplete ? "workout-chip--complete" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title="Series concluidas"
            >
              <span className="workout-chip-dot workout-chip-dot--amber" />
              {progressSummary}
            </span>

            <button className="workout-link" onClick={finishWorkout} disabled={saving}>
              {isWorkoutComplete ? "Encerrar" : "Salvar e sair"}
            </button>
          </div>
        </div>

        <div
          className={[
            "workout-hero",
            "card-dark",
            "glow-green",
            isWorkoutComplete ? "workout-hero--complete" : "",
            completionPulse === "ready" ? "workout-hero--celebrate" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="workout-hero-row">
            <div className="workout-hero-title">
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
                  {snapshot.length} exercicios - {totalSets} series - em andamento
                </div>
              </div>
            </div>

            <div className="workout-save text-muted-soft">{saving ? "salvando..." : "salvo"}</div>
          </div>

          <div
            className={[
              "workout-hero-guidance",
              isWorkoutComplete ? "workout-hero-guidance--done" : "",
              completionPulse === "ready" ? "workout-hero-guidance--pulse" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="workout-hero-guidance-label">
              {isWorkoutComplete ? <Sparkles size={13} /> : null}
              {globalGuidance.label}
            </span>
            <p className="workout-hero-guidance-text">{globalGuidance.text}</p>
          </div>
        </div>

        <div className="workout-list">
          {snapshot.map((exercise, exerciseIndex) => {
            const state =
              performed.find((item) => item.order === exercise.order) ??
              ({
                exerciseName: exercise.name,
                order: exercise.order,
                targetWeight: exercise.targetWeight,
                setsPerformed: Array.from({ length: exercise.sets }, () => ({ reps: 0, weight: 0 })),
              } as PerformedExerciseState);

            const isOpen = openOrder === exercise.order;
            const doneInExercise = state.setsPerformed.filter(isSetLogged).length;
            const status = getTargetStatus(exercise.targetWeight, state.setsPerformed);
            const showNumbers = exercise.targetWeight > 0 && status.avg > 0;
            const insight = getExerciseInsight(exercise, state);
            const activeSetIndex =
              insight.pendingIndex >= 0 ? insight.pendingIndex : Math.max(0, state.setsPerformed.length - 1);
            const isExerciseComplete = doneInExercise >= exercise.sets;

            return (
              <div
                key={exercise.order}
                className={[
                  "workout-ex-card",
                  isOpen ? "workout-ex-card--open" : "",
                  isExerciseComplete ? "workout-ex-card--complete" : "",
                  isExerciseComplete && completionPulse === "block"
                    ? "workout-ex-card--complete-flash"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className="workout-ex-head"
                  onClick={() => setOpenOrder((current) => (current === exercise.order ? null : exercise.order))}
                >
                  <div className="workout-ex-head-left">
                    <div className="workout-ex-index">{exerciseIndex + 1}</div>

                    <div className="workout-ex-meta">
                      <div className="workout-ex-name">{exercise.name}</div>
                      <div className="workout-ex-sub text-muted-soft">
                        {exercise.sets}x {exercise.reps}
                        {exercise.targetWeight > 0 ? ` - Meta: ${round1(exercise.targetWeight)}kg` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="workout-ex-head-right">
                    <span
                      className={[
                        "workout-ex-badge",
                        isExerciseComplete ? "workout-ex-badge--complete" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {doneInExercise}/{exercise.sets}
                    </span>
                    <span className={`workout-ex-chevron ${isOpen ? "open" : ""}`}>^</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="workout-ex-body">
                    <div className="workout-ex-status">
                      <span className="workout-ex-status-label">{status.label}</span>

                      {exercise.targetWeight > 0 && (
                        <span className="workout-ex-status-item">
                          Meta: <b>{round1(exercise.targetWeight)} kg</b>
                        </span>
                      )}

                      {showNumbers && (
                        <span className="workout-ex-status-item">
                          Media: <b>{round1(status.avg)} kg</b>{" "}
                          <span className="text-muted-soft">
                            (delta {status.diff >= 0 ? "+" : ""}
                            {round1(status.diff)} kg)
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="workout-ex-insights">
                      <div className="workout-ex-insight workout-ex-insight--primary">
                        <span className="workout-ex-insight-label">{insight.label}</span>
                        <div className="workout-ex-insight-title">{insight.title}</div>
                        <p className="workout-ex-insight-text">{insight.detail}</p>
                      </div>

                      <div className="workout-ex-insight">
                        <span className="workout-ex-insight-label">Leitura rapida</span>
                        <p className="workout-ex-insight-text">{insight.support}</p>
                      </div>
                    </div>

                    <div className="workout-grid-head">
                      <div>Serie</div>
                      <div>Reps</div>
                      <div>Peso (kg)</div>
                      <div style={{ textAlign: "right" }}>OK</div>
                    </div>

                    {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                      const current = state.setsPerformed[setIndex] ?? { reps: 0, weight: 0 };
                      const isDone = isSetLogged(current);
                      const isActive = !isDone && setIndex === activeSetIndex;

                      return (
                        <div
                          key={`${exercise.order}-${setIndex}`}
                          className={[
                            "workout-set-row",
                            isDone ? "workout-set-row--done" : "",
                            isActive ? "workout-set-row--active" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <div className="workout-set-cell--set">
                            <div
                              className={[
                                "workout-set-pill",
                                isDone ? "workout-set-pill--done" : "",
                                isActive ? "workout-set-pill--active" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {setIndex + 1}
                            </div>
                          </div>

                          <div className="workout-stepper workout-stepper--reps">
                            <button
                              type="button"
                              className="workout-step"
                              onClick={() => bump(exercise.order, setIndex, "reps", -1)}
                              aria-label="diminuir reps"
                            >
                              -
                            </button>

                            <input
                              className={[
                                "workout-input",
                                safeNumber(current.reps) > 0 ? "workout-input--filled" : "",
                                interactionKey === `reps-${exercise.order}-${setIndex}`
                                  ? "workout-input--pulse"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              type="number"
                              inputMode="numeric"
                              value={safeNumber(current.reps) === 0 ? "" : String(current.reps)}
                              placeholder="-"
                              onChange={(event) =>
                                updateSet(exercise.order, setIndex, "reps", safeNumber(event.target.value))
                              }
                              onFocus={(event) => event.currentTarget.select()}
                            />

                            <button
                              type="button"
                              className="workout-step"
                              onClick={() => bump(exercise.order, setIndex, "reps", 1)}
                              aria-label="aumentar reps"
                            >
                              +
                            </button>
                          </div>

                          <div className="workout-stepper workout-stepper--weight">
                            <button
                              type="button"
                              className="workout-step"
                              onClick={() => bump(exercise.order, setIndex, "weight", -0.5)}
                              aria-label="diminuir peso"
                            >
                              -
                            </button>

                            <input
                              className={[
                                "workout-input",
                                safeNumber(current.weight) > 0 ? "workout-input--filled" : "",
                                interactionKey === `weight-${exercise.order}-${setIndex}`
                                  ? "workout-input--pulse"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              type="number"
                              step="0.5"
                              inputMode="decimal"
                              value={safeNumber(current.weight) === 0 ? "" : String(current.weight)}
                              placeholder="-"
                              onChange={(event) =>
                                updateSet(exercise.order, setIndex, "weight", safeNumber(event.target.value))
                              }
                              onFocus={(event) => event.currentTarget.select()}
                            />

                            <button
                              type="button"
                              className="workout-step"
                              onClick={() => bump(exercise.order, setIndex, "weight", 0.5)}
                              aria-label="aumentar peso"
                            >
                              +
                            </button>
                          </div>

                          <div className="workout-set-cell--check">
                            <button
                              type="button"
                              className={[
                                "workout-check",
                                isDone ? "workout-check--on" : "",
                                interactionKey === `done-${exercise.order}-${setIndex}`
                                  ? "workout-check--snap"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => toggleDone(exercise.order, setIndex)}
                              aria-label="marcar serie"
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="workout-hint">
                      {isExerciseComplete
                        ? "Bloco concluido. Revise os numeros e siga para o proximo exercicio."
                        : `Serie ${Math.max(1, activeSetIndex + 1)} em foco. Use + e - para ajustar os valores rapidamente.`}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="workout-footer">
        <div className="corefit-container">
          <button
            className="btn-soft workout-footer-btn"
            type="button"
            onClick={() => router.push("/dashboard")}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            className={[
              "btn-green",
              "workout-footer-btn",
              "workout-footer-primary",
              isWorkoutComplete ? "workout-footer-primary--ready" : "",
              completionPulse === "ready" ? "workout-footer-primary--pulse" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="button"
            onClick={finishWorkout}
            disabled={saving}
          >
            {primaryCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
