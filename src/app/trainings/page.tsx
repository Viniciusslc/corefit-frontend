"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Dumbbell,
  Layers3,
  Play,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CFBadge, CFButton, CFInput, CFSection } from "@/components/corefit/primitives";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

type Exercise = {
  _id: string;
  name: string;
  sets: number;
  reps: string;
  technique?: string;
  order: number;
  targetWeight?: number;
};

type Training = {
  _id: string;
  name: string;
  description?: string;
  exercises?: Exercise[];
  createdAt: string;
  updatedAt: string;
};

type ActiveWorkoutRef = {
  id?: string;
  _id?: string;
  trainingId?: string;
  status?: "active" | "finished";
};

type DeleteRef = {
  type: "training" | "exercise";
  trainingId?: string;
  id: string;
  name?: string;
};

type StatusInfo = {
  label: string;
  helper: string;
  variant: "accent" | "neutral" | "warning";
};

function pickId(value: { id?: string; _id?: string } | null | undefined) {
  return String(value?.id ?? value?._id ?? "");
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Data indisponivel";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getExerciseCount(training: Training) {
  return training.exercises?.length ?? 0;
}

function getTotalSets(training: Training) {
  return (training.exercises ?? []).reduce((acc, exercise) => acc + Number(exercise.sets ?? 0), 0);
}

function getTargetCount(training: Training) {
  return (training.exercises ?? []).filter(
    (exercise) => typeof exercise.targetWeight === "number" && exercise.targetWeight > 0
  ).length;
}

function getEstimatedLoad(training: Training) {
  const value = (training.exercises ?? []).reduce((acc, exercise) => {
    if (typeof exercise.targetWeight !== "number" || exercise.targetWeight <= 0) return acc;
    return acc + exercise.targetWeight * Number(exercise.sets ?? 0);
  }, 0);

  return value > 0 ? Math.round(value * 10) / 10 : 0;
}

function inferTrainingFocus(training: Training) {
  const source = `${training.name} ${training.description ?? ""} ${
    (training.exercises ?? []).map((exercise) => exercise.name).join(" ")
  }`.toLowerCase();

  if (/(peito|supino|triceps|ombro|desenvolvimento)/.test(source)) return "Peito e membros superiores";
  if (/(costas|remada|puxada|posterior|levantamento)/.test(source)) return "Costas e cadeia posterior";
  if (/(perna|quadriceps|agachamento|leg|panturrilha|gluteo)/.test(source)) return "Pernas e base";
  if (/(biceps|triceps|braco|ombro)/.test(source)) return "Membros superiores";
  if (/(forca|strength)/.test(source)) return "Forca";
  if (/(hipertrofia|hypertrophy)/.test(source)) return "Hipertrofia";
  if (/(full body|fullbody|corpo todo)/.test(source)) return "Corpo inteiro";
  if (training.description?.trim()) return "Foco definido";
  return "Estrutura base";
}

function getStatusInfo(training: Training, activeTrainingId: string | null): StatusInfo {
  const trainingId = pickId(training);
  const exerciseCount = getExerciseCount(training);

  if (activeTrainingId && trainingId === activeTrainingId) {
    return {
      label: "Em andamento",
      helper: "Sessao ativa agora",
      variant: "accent",
    };
  }

  if (exerciseCount <= 0) {
    return {
      label: "Estrutura em montagem",
      helper: "Faltam exercicios para iniciar",
      variant: "warning",
    };
  }

  return {
    label: "Pronto para iniciar",
    helper: "Plano organizado para execucao",
    variant: "neutral",
  };
}

function getFieldLabel(label: string, helper?: string) {
  return (
    <div className="mb-2">
      <div className="register-label text-sm">{label}</div>
      {helper ? <div className="mt-1 text-xs text-white/45">{helper}</div> : null}
    </div>
  );
}

export default function TrainingsPage() {
  return (
    <Suspense
      fallback={
        <main className="corefit-bg">
          <div className="corefit-container pt-24 pb-10">
            <p className="text-muted-soft">Carregando...</p>
          </div>
        </main>
      }
    >
      <TrainingsInner />
    </Suspense>
  );
}

function TrainingsInner() {
  useRequireAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const createSectionRef = useRef<HTMLDivElement | null>(null);

  const newCycle = useMemo(() => searchParams.get("newCycle") === "1", [searchParams]);

  const [items, setItems] = useState<Training[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [addingForId, setAddingForId] = useState<string | null>(null);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("3");
  const [exReps, setExReps] = useState("8-12");
  const [exTechnique, setExTechnique] = useState("");
  const [exTargetWeight, setExTargetWeight] = useState("");
  const [exOrder, setExOrder] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);

  const [editingExercise, setEditingExercise] = useState<{
    trainingId: string;
    exerciseId: string;
  } | null>(null);
  const [eeName, setEeName] = useState("");
  const [eeSets, setEeSets] = useState("3");
  const [eeReps, setEeReps] = useState("8-12");
  const [eeTechnique, setEeTechnique] = useState("");
  const [eeTargetWeight, setEeTargetWeight] = useState("");
  const [eeOrder, setEeOrder] = useState("0");
  const [savingExercise, setSavingExercise] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DeleteRef | null>(null);

  const activeTrainingId = activeWorkout?.trainingId ? String(activeWorkout.trainingId) : null;

  const pageStats = useMemo(() => {
    const trainingCount = items.length;
    const exerciseCount = items.reduce((acc, training) => acc + getExerciseCount(training), 0);
    const targetCount = items.reduce((acc, training) => acc + getTargetCount(training), 0);

    return {
      trainingCount,
      exerciseCount,
      targetCount,
    };
  }, [items]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      try {
        const active = await apiFetch<ActiveWorkoutRef | null>("/workouts/active");
        setActiveWorkout(active ?? null);
      } catch {
        setActiveWorkout(null);
      }

      const data = await apiFetch<Training[]>("/trainings");
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao carregar treinos";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function scrollToCreateSection() {
    createSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function askDeleteTraining(training: Training) {
    setPendingDelete({ type: "training", id: training._id, name: training.name });
    setConfirmOpen(true);
  }

  function askDeleteExercise(training: Training, exercise: Exercise) {
    setPendingDelete({
      type: "exercise",
      trainingId: training._id,
      id: exercise._id,
      name: exercise.name,
    });
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;

    setConfirmLoading(true);
    setError(null);

    try {
      if (pendingDelete.type === "training") {
        await apiFetch(`/trainings/${pendingDelete.id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/trainings/${pendingDelete.trainingId}/exercises/${pendingDelete.id}`, {
          method: "DELETE",
        });
      }

      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao excluir";
      setError(message);
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  }

  async function startWorkout(training: Training) {
    setError(null);

    try {
      await apiFetch(`/workouts/start/${training._id}`, { method: "POST" });
      router.push("/workouts/active");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao iniciar treino";
      if (String(message).toLowerCase().includes("treino ativo")) {
        router.push("/workouts/active");
        return;
      }
      setError(message);
    }
  }

  async function confirmNewCycle() {
    const ok = window.confirm(
      "Criar um novo ciclo vai apagar seus treinos atuais. Deseja continuar?"
    );
    if (!ok) return;

    setLoading(true);
    setError(null);

    try {
      await apiFetch("/trainings/cycles/new", { method: "POST" });
      router.replace("/trainings");
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao criar novo ciclo";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function cancelNewCycle() {
    router.replace("/trainings");
  }

  async function createTraining(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Nome do treino e obrigatorio");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await apiFetch("/trainings", {
        method: "POST",
        body: {
          name,
          description: description || undefined,
        },
      });

      setName("");
      setDescription("");
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao criar treino";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;

    if (!editName.trim()) {
      setError("Nome do treino e obrigatorio");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/trainings/${editingId}`, {
        method: "PATCH",
        body: {
          name: editName,
          description: editDescription || undefined,
        },
      });

      setEditingId(null);
      setEditName("");
      setEditDescription("");
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao salvar alteracoes";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function openAddExercise(training: Training) {
    setAddingForId(training._id);
    setExName("");
    setExSets("3");
    setExReps("8-12");
    setExTechnique("");
    setExTargetWeight("");
    setExOrder("");
  }

  function closeAddExercise() {
    setAddingForId(null);
    setExName("");
    setExSets("3");
    setExReps("8-12");
    setExTechnique("");
    setExTargetWeight("");
    setExOrder("");
  }

  async function submitAddExercise(event: React.FormEvent, training: Training) {
    event.preventDefault();

    if (!exName.trim()) {
      setError("Nome do exercicio e obrigatorio");
      return;
    }

    const setsNum = Number(exSets);
    if (!Number.isFinite(setsNum) || setsNum < 1) {
      setError("Series precisam ser um numero maior ou igual a 1");
      return;
    }

    if (!exReps.trim()) {
      setError("Reps e obrigatorio");
      return;
    }

    const currentOrders = (training.exercises ?? []).map((exercise) => exercise.order);
    const nextOrder = currentOrders.length ? Math.max(...currentOrders) + 1 : 0;
    const orderNum = exOrder.trim() === "" ? nextOrder : Number(exOrder);

    if (!Number.isFinite(orderNum) || orderNum < 0) {
      setError("A ordem precisa ser um numero maior ou igual a 0");
      return;
    }

    const targetWeight = exTargetWeight.trim() === "" ? undefined : Number(exTargetWeight);
    if (
      targetWeight !== undefined &&
      (!Number.isFinite(targetWeight) || targetWeight < 0)
    ) {
      setError("A meta de carga precisa ser um numero maior ou igual a 0");
      return;
    }

    setAddingExercise(true);
    setError(null);

    try {
      await apiFetch(`/trainings/${training._id}/exercises`, {
        method: "POST",
        body: {
          name: exName.trim(),
          sets: setsNum,
          reps: exReps.trim(),
          technique: exTechnique.trim() ? exTechnique.trim() : undefined,
          order: orderNum,
          targetWeight,
        },
      });

      closeAddExercise();
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao adicionar exercicio";
      setError(message);
    } finally {
      setAddingExercise(false);
    }
  }

  function startEditExercise(training: Training, exercise: Exercise) {
    setEditingExercise({ trainingId: training._id, exerciseId: exercise._id });
    setEeName(exercise.name);
    setEeSets(String(exercise.sets));
    setEeReps(exercise.reps);
    setEeTechnique(exercise.technique ?? "");
    setEeTargetWeight(
      typeof exercise.targetWeight === "number" ? String(exercise.targetWeight) : ""
    );
    setEeOrder(String(exercise.order));
  }

  function cancelEditExercise() {
    setEditingExercise(null);
    setEeName("");
    setEeSets("3");
    setEeReps("8-12");
    setEeTechnique("");
    setEeTargetWeight("");
    setEeOrder("0");
  }

  async function saveExercise(event: React.FormEvent) {
    event.preventDefault();
    if (!editingExercise) return;

    if (!eeName.trim()) {
      setError("Nome do exercicio e obrigatorio");
      return;
    }

    const setsNum = Number(eeSets);
    if (!Number.isFinite(setsNum) || setsNum < 1) {
      setError("Series precisam ser um numero maior ou igual a 1");
      return;
    }

    if (!eeReps.trim()) {
      setError("Reps e obrigatorio");
      return;
    }

    const orderNum = Number(eeOrder);
    if (!Number.isFinite(orderNum) || orderNum < 0) {
      setError("A ordem precisa ser um numero maior ou igual a 0");
      return;
    }

    const targetWeight = eeTargetWeight.trim() === "" ? undefined : Number(eeTargetWeight);
    if (
      targetWeight !== undefined &&
      (!Number.isFinite(targetWeight) || targetWeight < 0)
    ) {
      setError("A meta de carga precisa ser um numero maior ou igual a 0");
      return;
    }

    setSavingExercise(true);
    setError(null);

    try {
      await apiFetch(
        `/trainings/${editingExercise.trainingId}/exercises/${editingExercise.exerciseId}`,
        {
          method: "PATCH",
          body: {
            name: eeName.trim(),
            sets: setsNum,
            reps: eeReps.trim(),
            technique: eeTechnique.trim() ? eeTechnique.trim() : undefined,
            order: orderNum,
            targetWeight,
          },
        }
      );

      cancelEditExercise();
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao editar exercicio";
      setError(message);
    } finally {
      setSavingExercise(false);
    }
  }

  async function moveExercise(training: Training, exercise: Exercise, direction: "up" | "down") {
    const list = [...(training.exercises ?? [])].sort((a, b) => a.order - b.order);
    const index = list.findIndex((item) => item._id === exercise._id);
    if (index < 0) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= list.length) return;

    const current = list[index];
    const target = list[swapIndex];

    setError(null);

    try {
      await apiFetch(`/trainings/${training._id}/exercises/${current._id}`, {
        method: "PATCH",
        body: { order: target.order },
      });

      await apiFetch(`/trainings/${training._id}/exercises/${target._id}`, {
        method: "PATCH",
        body: { order: current.order },
      });

      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao reordenar exercicio";
      setError(message);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-landing.png')",
            backgroundPosition: "center top",
            filter: "brightness(0.24) contrast(1.04) saturate(1.02)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(34,197,94,0.18),transparent_16%),radial-gradient(circle_at_78%_12%,rgba(34,197,94,0.14),transparent_22%),linear-gradient(180deg,rgba(4,4,4,0.82)_0%,rgba(4,4,4,0.76)_28%,rgba(4,4,4,0.94)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-28">
        <CFSection tone="accent" padding="lg" className="card-hero mb-6 overflow-hidden hero-animate hero-delay-1">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <CFBadge className="mb-4 w-fit">
                <Layers3 size={13} />
                Estrutura, leitura, execucao
              </CFBadge>

              <h1 className="max-w-[720px] text-[clamp(2.7rem,5vw,4.6rem)] font-black leading-[0.92] tracking-[-0.06em] text-white">
                Organize seu treino com{" "}
                <span className="text-green-400">clareza real.</span>
              </h1>

              <div className="mt-4 text-lg font-black tracking-[-0.04em] text-white/92 sm:text-xl">
                Aqui nasce a sua evolucao.
              </div>

              <p className="mt-5 max-w-[640px] text-[15px] leading-8 text-white/68">
                Aqui nasce sua evolucao. Crie estruturas que facam sentido depois, entenda o foco
                de cada sessao e deixe o proximo passo sempre pronto para execucao.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <CFButton type="button" onClick={scrollToCreateSection} size="lg">
                  <Plus size={17} />
                  Criar treino manual
                </CFButton>

                <CFButton
                  type="button"
                  onClick={() => router.push("/trainings/ai")}
                  variant="secondary"
                  size="lg"
                >
                  <Sparkles size={17} />
                  Criar treino com IA
                </CFButton>

                <CFButton
                  type="button"
                  onClick={() => router.push("/workouts/active")}
                  variant="ghost"
                  size="lg"
                >
                  <Play size={16} />
                  Ver treino ativo
                </CFButton>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-[2px] hover:border-green-500/20">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                  Planos montados
                </div>
                <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                  {pageStats.trainingCount}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/58">
                  Treinos organizados para leitura e execucao.
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-[2px] hover:border-green-500/20">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                  Estrutura viva
                </div>
                <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                  {pageStats.exerciseCount}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/58">
                  Exercicios prontos para virar execucao em contexto.
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-[2px] hover:border-green-500/20">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                  Leitura de carga
                </div>
                <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                  {pageStats.targetCount}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/58">
                  Metas de carga ja definidas para orientar o treino.
                </div>
              </div>
            </div>
          </div>
        </CFSection>

        {newCycle ? (
          <CFSection tone="soft" padding="md" className="mb-5 border-amber-400/18 bg-amber-400/[0.05]">
            <div className="flex flex-wrap items-start gap-4">
              <div className="mt-1 rounded-xl border border-amber-300/20 bg-amber-300/10 p-2 text-amber-100">
                <ShieldAlert size={18} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-black uppercase tracking-[0.2em] text-amber-100">
                  Novo ciclo
                </div>
                <div className="mt-3 text-xl font-black tracking-[-0.04em] text-white">
                  Nada foi apagado ainda.
                </div>
                <p className="mt-2 max-w-[760px] text-sm leading-7 text-white/62">
                  Se confirmar, seus treinos atuais saem de cena para abrir uma nova estrutura do
                  zero. Use isso quando quiser reorganizar tudo com um novo contexto.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CFButton type="button" onClick={confirmNewCycle} variant="secondary">
                  Confirmar novo ciclo
                </CFButton>
                <CFButton type="button" onClick={cancelNewCycle} variant="ghost">
                  Voltar sem apagar
                </CFButton>
              </div>
            </div>
          </CFSection>
        ) : null}

        {!newCycle ? (
          <div ref={createSectionRef}>
            <CFSection tone="default" padding="lg" className="mb-6 hero-animate hero-delay-2">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                    Criacao guiada
                  </div>
                  <h2 className="mt-3 text-[2rem] font-black tracking-[-0.05em] text-white">
                    Monte um treino com intencao.
                  </h2>
                  <p className="mt-3 max-w-[560px] text-sm leading-7 text-white/62">
                    Em vez de criar so um nome, pense no treino como um bloco que voce vai querer
                    reconhecer, ajustar e executar sem atrito depois.
                  </p>

                  <form onSubmit={createTraining} className="mt-6 space-y-5">
                    <div>
                      {getFieldLabel(
                        "Nome do treino",
                        "Como voce vai reconhecer esse treino quando voltar para ele?"
                      )}
                      <CFInput
                        tone="subtle"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Ex: Treino A - Peito e ombro"
                      />
                    </div>

                    <div>
                      {getFieldLabel(
                        "Descricao",
                        "Descreva foco, divisao, ritmo ou qualquer leitura que ajude na proxima sessao."
                      )}
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Ex: Hipertrofia com foco em peito, ombro e progressao de carga."
                        rows={4}
                        className="input-dark min-h-[126px] w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base text-white placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <CFButton type="submit" size="lg" disabled={creating}>
                        <Plus size={18} />
                        {creating ? "Criando..." : "Criar treino"}
                      </CFButton>

                      <CFButton
                        type="button"
                        onClick={() => router.push("/trainings/ai")}
                        variant="secondary"
                        size="lg"
                      >
                        <Sparkles size={17} />
                        Gerar com IA
                      </CFButton>
                    </div>
                  </form>
                </div>

                <div className="grid gap-3 self-start">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-[2px] hover:border-green-500/18">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                      Passo 1
                    </div>
                    <div className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                      Defina a identidade
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/58">
                      Nome e descricao precisam te lembrar o objetivo do bloco, nao so o grupo
                      muscular.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-[2px] hover:border-green-500/18">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                      Passo 2
                    </div>
                    <div className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                      Monte a estrutura
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/58">
                      Depois do treino criado, organize exercicios, series, reps e metas de carga
                      com leitura clara.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-green-500/16 bg-green-500/[0.06] p-5 shadow-[0_18px_42px_rgba(34,197,94,0.08)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                      Leitura do produto
                    </div>
                    <div className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                      Estrutura antes da evolucao.
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/62">
                      Essa tela nao serve so para cadastrar. Ela prepara contexto para o dashboard,
                      para o treino ativo e para a leitura da sua evolucao depois.
                    </p>
                  </div>
                </div>
              </div>
            </CFSection>
          </div>
        ) : null}

        {!loading && error ? (
          <CFSection tone="soft" padding="md" className="mb-5 border-red-300/12 bg-red-300/[0.04]">
            <div className="text-sm font-black uppercase tracking-[0.2em] text-red-200">Erro</div>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-white/76">{error}</pre>
          </CFSection>
        ) : null}

        {loading ? <p className="text-muted-soft">Carregando...</p> : null}

        {!loading && !error && items.length === 0 ? (
          <CFSection tone="soft" padding="md" className="border-white/10 bg-white/[0.04]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                  Base vazia
                </div>
                <div className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                  Seu primeiro treino comeca aqui.
                </div>
                <p className="mt-2 max-w-[560px] text-sm leading-7 text-white/58">
                  Crie uma estrutura simples e depois refine com exercicios, metas e contexto.
                </p>
              </div>
              <CFButton type="button" onClick={scrollToCreateSection}>
                <Plus size={18} />
                Criar primeiro treino
              </CFButton>
            </div>
          </CFSection>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                  Seus planos montados
                </div>
                <h2 className="mt-2 text-[2rem] font-black tracking-[-0.05em] text-white">
                  Treinos com presenca e hierarquia.
                </h2>
                <p className="mt-2 max-w-[680px] text-sm leading-7 text-white/58">
                  Cada card abaixo representa uma entidade do produto, nao so um item de lista.
                  Inicie, edite e evolua com mais clareza.
                </p>
              </div>

              <CFButton
                type="button"
                onClick={scrollToCreateSection}
                size="lg"
                className="shadow-[0_18px_32px_rgba(34,197,94,0.14)] hover:shadow-[0_24px_42px_rgba(34,197,94,0.24)]"
              >
                <Plus size={16} />
                Criar treino
              </CFButton>
            </div>

            <ul className="space-y-5" style={{ listStyle: "none", paddingLeft: 0 }}>
              {items.map((training) => {
                const exerciseCount = getExerciseCount(training);
                const totalSets = getTotalSets(training);
                const targetCount = getTargetCount(training);
                const estimatedLoad = getEstimatedLoad(training);
                const focus = inferTrainingFocus(training);
                const status = getStatusInfo(training, activeTrainingId);
                const isEditingTraining = editingId === training._id;
                const isAddingExercise = addingForId === training._id;

                return (
                  <li key={training._id}>
                    <CFSection
                      tone="default"
                      padding="lg"
                      className="group border-white/12 transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.01] hover:border-green-500/24 hover:shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_42px_rgba(34,197,94,0.10)]"
                    >
                      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          {isEditingTraining ? (
                            <form onSubmit={saveEdit} className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  {getFieldLabel("Nome do treino")}
                                  <CFInput
                                    tone="subtle"
                                    value={editName}
                                    onChange={(event) => setEditName(event.target.value)}
                                  />
                                </div>

                                <div>
                                  {getFieldLabel("Descricao")}
                                  <CFInput
                                    tone="subtle"
                                    value={editDescription}
                                    onChange={(event) => setEditDescription(event.target.value)}
                                    placeholder="Resumo rapido do foco do treino"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <CFButton type="submit" variant="secondary" disabled={saving}>
                                  {saving ? "Salvando..." : "Salvar alteracoes"}
                                </CFButton>
                                <CFButton
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditName("");
                                    setEditDescription("");
                                  }}
                                >
                                  Cancelar
                                </CFButton>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-[1rem] border border-green-500/18 bg-green-500/10 text-green-300 shadow-[0_0_28px_rgba(34,197,94,0.12)]">
                                      <Dumbbell size={18} />
                                    </div>
                                    <CFBadge variant={status.variant} className="w-fit">
                                      {status.label}
                                    </CFBadge>
                                  </div>

                                  <div className="mt-4 text-[1.9rem] font-black tracking-[-0.05em] text-white">
                                    {training.name}
                                  </div>

                                  <div className="mt-2 text-sm leading-7 text-white/62">
                                    {training.description?.trim()
                                      ? training.description
                                      : "Treino sem descricao ainda. Defina foco e contexto para facilitar a proxima leitura."}
                                  </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                    <CFBadge
                                      variant="neutral"
                                      className={`w-fit transition-all duration-300 ${
                                        status.label === "Pronto para iniciar"
                                          ? "border-green-500/22 bg-green-500/[0.10] text-green-200 shadow-[0_0_24px_rgba(34,197,94,0.08)]"
                                          : ""
                                      }`}
                                    >
                                      <Layers3 size={13} />
                                      {exerciseCount} exercicio{exerciseCount === 1 ? "" : "s"}
                                    </CFBadge>
                                    <CFBadge variant="neutral" className="w-fit">
                                      <Target size={13} />
                                      {totalSets} serie{totalSets === 1 ? "" : "s"}
                                    </CFBadge>
                                    <CFBadge variant="neutral" className="w-fit">
                                      <Sparkles size={13} />
                                      {focus}
                                    </CFBadge>
                                    <CFBadge variant="neutral" className="w-fit">
                                      <CalendarDays size={13} />
                                      {formatDateLabel(training.updatedAt || training.createdAt)}
                                    </CFBadge>
                                  </div>
                                </div>

                                <div className="grid min-w-[240px] gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 xl:w-[280px]">
                                  <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                                      Contexto do bloco
                                    </div>
                                    <div className="mt-3 text-lg font-black tracking-[-0.04em] text-white">
                                      {status.helper}
                                    </div>
                                  </div>

                                  <div className="grid gap-2 text-sm text-white/62">
                                    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                      <span>Leitura de carga</span>
                                      <b className="text-white">{targetCount > 0 ? `${targetCount} metas` : "Inicial"}</b>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                      <span>Volume estimado</span>
                                      <b className="text-white">{estimatedLoad > 0 ? `${estimatedLoad} kg` : "Sem meta"}</b>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-5 flex flex-wrap gap-3">
                                <CFButton
                                  type="button"
                                  onClick={() => startWorkout(training)}
                                  size="lg"
                                  className="shadow-[0_18px_34px_rgba(34,197,94,0.16)] hover:shadow-[0_24px_44px_rgba(34,197,94,0.26)]"
                                  disabled={newCycle || exerciseCount === 0}
                                  title={
                                    newCycle
                                      ? "Saia do fluxo de novo ciclo para iniciar"
                                      : exerciseCount === 0
                                        ? "Adicione exercicios antes de iniciar"
                                        : undefined
                                  }
                                >
                                  <Play size={17} />
                                  Iniciar treino
                                </CFButton>

                                <CFButton
                                  type="button"
                                  onClick={() => {
                                    if (newCycle) return;
                                    setEditingId(training._id);
                                    setEditName(training.name);
                                    setEditDescription(training.description ?? "");
                                  }}
                                  variant="secondary"
                                  size="lg"
                                  disabled={newCycle}
                                  title={newCycle ? "Saia do fluxo de novo ciclo para editar" : undefined}
                                >
                                  Editar treino
                                </CFButton>

                                <CFButton
                                  type="button"
                                  onClick={() => openAddExercise(training)}
                                  variant="ghost"
                                  size="lg"
                                  disabled={newCycle}
                                  title={newCycle ? "Saia do fluxo de novo ciclo para editar" : undefined}
                                >
                                  <Plus size={16} />
                                  Adicionar exercicio
                                </CFButton>

                                <button
                                  type="button"
                                  onClick={() => !newCycle && askDeleteTraining(training)}
                                  disabled={newCycle}
                                  className="inline-flex items-center rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-red-200/88 transition-all duration-200 hover:bg-red-300/[0.06] hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  title={newCycle ? "Saia do fluxo de novo ciclo para excluir" : undefined}
                                >
                                  Excluir
                                </button>
                              </div>
                            </>
                          )}

                          <div className="mt-6 border-t border-white/8 pt-5">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                                  Estrutura do treino
                                </div>
                                <div className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                                  Exercicios que sustentam esse bloco
                                </div>
                              </div>

                              {!isEditingTraining ? (
                                <div className="text-sm text-white/42">
                                  {exerciseCount > 0
                                    ? `${exerciseCount} exercicio${exerciseCount === 1 ? "" : "s"} pronto${exerciseCount === 1 ? "" : "s"} para execucao`
                                    : "Comece adicionando o primeiro exercicio"}
                                </div>
                              ) : null}
                            </div>

                            {isAddingExercise && !newCycle ? (
                              <form
                                onSubmit={(event) => submitAddExercise(event, training)}
                                className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5"
                              >
                                <div className="mb-5">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                                    Novo exercicio
                                  </div>
                                  <div className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                                    Adicione contexto desde a primeira linha.
                                  </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="md:col-span-2">
                                    {getFieldLabel("Nome do exercicio", "O nome precisa ser claro na hora da execucao.")}
                                    <CFInput
                                      tone="subtle"
                                      value={exName}
                                      onChange={(event) => setExName(event.target.value)}
                                      placeholder="Ex: Supino reto"
                                    />
                                  </div>

                                  <div>
                                    {getFieldLabel("Series")}
                                    <CFInput
                                      tone="subtle"
                                      value={exSets}
                                      onChange={(event) => setExSets(event.target.value)}
                                      placeholder="4"
                                    />
                                  </div>

                                  <div>
                                    {getFieldLabel("Reps")}
                                    <CFInput
                                      tone="subtle"
                                      value={exReps}
                                      onChange={(event) => setExReps(event.target.value)}
                                      placeholder="8-12"
                                    />
                                  </div>

                                  <div>
                                    {getFieldLabel("Tecnica", "Opcional, mas ajuda na leitura depois.")}
                                    <CFInput
                                      tone="subtle"
                                      value={exTechnique}
                                      onChange={(event) => setExTechnique(event.target.value)}
                                      placeholder="Ex: descida controlada"
                                    />
                                  </div>

                                  <div>
                                    {getFieldLabel("Meta de carga", "Opcional, para conectar estrutura com leitura.")}
                                    <CFInput
                                      tone="subtle"
                                      type="number"
                                      inputMode="decimal"
                                      min={0}
                                      step="0.5"
                                      value={exTargetWeight}
                                      onChange={(event) => setExTargetWeight(event.target.value)}
                                      placeholder="Ex: 12.5"
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                    {getFieldLabel("Ordem", "Deixe vazio para enviar o exercicio ao final do treino.")}
                                    <CFInput
                                      tone="subtle"
                                      value={exOrder}
                                      onChange={(event) => setExOrder(event.target.value)}
                                      placeholder="Automatico"
                                    />
                                  </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                  <CFButton type="submit" variant="secondary" disabled={addingExercise}>
                                    {addingExercise ? "Adicionando..." : "Adicionar exercicio"}
                                  </CFButton>
                                  <CFButton type="button" variant="ghost" onClick={closeAddExercise}>
                                    Cancelar
                                  </CFButton>
                                </div>
                              </form>
                            ) : null}

                            <div className="mt-5">
                              {!training.exercises || training.exercises.length === 0 ? (
                                <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.02] p-5 text-sm leading-7 text-white/50">
                                  Esse treino ainda esta sem exercicios. Adicione o primeiro bloco para
                                  transformar estrutura em execucao.
                                </div>
                              ) : (
                                <ul className="space-y-3" style={{ listStyle: "none", paddingLeft: 0 }}>
                                  {[...training.exercises]
                                    .sort((a, b) => a.order - b.order)
                                    .map((exercise) => {
                                      const isEditingExercise =
                                        editingExercise?.trainingId === training._id &&
                                        editingExercise?.exerciseId === exercise._id;

                                      return (
                                        <li
                                          key={exercise._id}
                                          className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-[2px] hover:scale-[1.01] hover:border-green-500/22 hover:bg-white/[0.045] hover:shadow-[0_20px_34px_rgba(0,0,0,0.20),0_0_28px_rgba(34,197,94,0.08)]"
                                        >
                                          {isEditingExercise ? (
                                            <form onSubmit={saveExercise} className="space-y-4">
                                              <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                  {getFieldLabel("Nome")}
                                                  <CFInput
                                                    tone="subtle"
                                                    value={eeName}
                                                    onChange={(event) => setEeName(event.target.value)}
                                                  />
                                                </div>

                                                <div>
                                                  {getFieldLabel("Series")}
                                                  <CFInput
                                                    tone="subtle"
                                                    value={eeSets}
                                                    onChange={(event) => setEeSets(event.target.value)}
                                                  />
                                                </div>

                                                <div>
                                                  {getFieldLabel("Reps")}
                                                  <CFInput
                                                    tone="subtle"
                                                    value={eeReps}
                                                    onChange={(event) => setEeReps(event.target.value)}
                                                  />
                                                </div>

                                                <div>
                                                  {getFieldLabel("Ordem")}
                                                  <CFInput
                                                    tone="subtle"
                                                    value={eeOrder}
                                                    onChange={(event) => setEeOrder(event.target.value)}
                                                  />
                                                </div>

                                                <div>
                                                  {getFieldLabel("Tecnica")}
                                                  <CFInput
                                                    tone="subtle"
                                                    value={eeTechnique}
                                                    onChange={(event) => setEeTechnique(event.target.value)}
                                                  />
                                                </div>

                                                <div>
                                                  {getFieldLabel("Meta de carga")}
                                                  <CFInput
                                                    tone="subtle"
                                                    type="number"
                                                    inputMode="decimal"
                                                    min={0}
                                                    step="0.5"
                                                    value={eeTargetWeight}
                                                    onChange={(event) => setEeTargetWeight(event.target.value)}
                                                    placeholder="Ex: 12.5"
                                                  />
                                                </div>
                                              </div>

                                              <div className="flex flex-wrap gap-2">
                                                <CFButton type="submit" variant="secondary" disabled={savingExercise}>
                                                  {savingExercise ? "Salvando..." : "Salvar exercicio"}
                                                </CFButton>
                                                <CFButton type="button" variant="ghost" onClick={cancelEditExercise}>
                                                  Cancelar
                                                </CFButton>
                                              </div>
                                            </form>
                                          ) : (
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                              <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-3">
                                                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/20 text-white/85">
                                                    {exercise.order + 1}
                                                  </div>
                                                  <div className="text-lg font-black tracking-[-0.04em] text-white">
                                                    {exercise.name}
                                                  </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                  <CFBadge variant="neutral" className="w-fit">
                                                    {exercise.sets}x {exercise.reps}
                                                  </CFBadge>
                                                  {exercise.technique ? (
                                                    <CFBadge variant="neutral" className="w-fit">
                                                      {exercise.technique}
                                                    </CFBadge>
                                                  ) : null}
                                                  {typeof exercise.targetWeight === "number" ? (
                                                    <CFBadge variant="neutral" className="w-fit">
                                                      Meta {exercise.targetWeight}kg
                                                    </CFBadge>
                                                  ) : null}
                                                </div>
                                              </div>

                                              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                <CFButton
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => moveExercise(training, exercise, "up")}
                                                  disabled={newCycle}
                                                  title="Subir"
                                                >
                                                  <ArrowUp size={15} />
                                                </CFButton>

                                                <CFButton
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => moveExercise(training, exercise, "down")}
                                                  disabled={newCycle}
                                                  title="Descer"
                                                >
                                                  <ArrowDown size={15} />
                                                </CFButton>

                                                <CFButton
                                                  type="button"
                                                  variant="secondary"
                                                  size="sm"
                                                  onClick={() => !newCycle && startEditExercise(training, exercise)}
                                                  disabled={newCycle}
                                                >
                                                  Editar
                                                </CFButton>

                                                <button
                                                  type="button"
                                                  onClick={() => !newCycle && askDeleteExercise(training, exercise)}
                                                  disabled={newCycle}
                                                  className="inline-flex items-center rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold text-red-200/88 transition-all duration-200 hover:bg-red-300/[0.06] hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                  Excluir
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </li>
                                      );
                                    })}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CFSection>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <ConfirmDialog
          open={confirmOpen}
          title={pendingDelete?.type === "training" ? "Excluir treino?" : "Excluir exercicio?"}
          description={
            pendingDelete?.type === "training"
              ? `Voce esta prestes a excluir o treino${pendingDelete?.name ? ` "${pendingDelete.name}"` : ""}. Essa acao nao pode ser desfeita.`
              : `Voce esta prestes a excluir o exercicio${pendingDelete?.name ? ` "${pendingDelete.name}"` : ""}. Essa acao nao pode ser desfeita.`
          }
          confirmText="Excluir"
          cancelText="Cancelar"
          danger
          loading={confirmLoading}
          onClose={() => !confirmLoading && setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </main>
  );
}
