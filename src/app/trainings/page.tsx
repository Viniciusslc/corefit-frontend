"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Sparkles, Dumbbell } from "lucide-react";

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

export default function TrainingsPage() {
  useRequireAuth();

  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ entrou no fluxo de confirmação (não apaga nada ainda)
  const newCycle = useMemo(() => searchParams.get("newCycle") === "1", [searchParams]);

  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // criar treino
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // editar treino
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // adicionar exercício (por treino)
  const [addingForId, setAddingForId] = useState<string | null>(null);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("3");
  const [exReps, setExReps] = useState("8-12");
  const [exTechnique, setExTechnique] = useState("");
  const [exTargetWeight, setExTargetWeight] = useState("");
  const [exOrder, setExOrder] = useState<string>("");
  const [addingExercise, setAddingExercise] = useState(false);

  // editar exercício (inline)
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

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<{
    type: "training" | "exercise";
    trainingId?: string;
    id: string;
    name?: string;
  } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<Training[]>("/trainings");
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar treinos");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function askDeleteTraining(t: Training) {
    setPendingDelete({ type: "training", id: t._id, name: t.name });
    setConfirmOpen(true);
  }

  function askDeleteExercise(t: Training, ex: Exercise) {
    setPendingDelete({
      type: "exercise",
      trainingId: t._id,
      id: ex._id,
      name: ex.name,
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
    } catch (e: any) {
      setError(e?.message ?? "Erro ao excluir");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  }

  async function startWorkout(t: Training) {
    setError(null);
    try {
      await apiFetch(`/workouts/start/${t._id}`, { method: "POST" });
      router.push("/workouts/active");
    } catch (e: any) {
      const msg = e?.message ?? "Erro ao iniciar treino";
      if (String(msg).toLowerCase().includes("treino ativo")) {
        router.push("/workouts/active");
        return;
      }
      setError(msg);
    }
  }

  async function confirmNewCycle() {
    const ok = window.confirm(
      "Criar um novo ciclo vai APAGAR seus treinos atuais (treinos e exercícios).\n\nDeseja continuar?"
    );
    if (!ok) return;

    setLoading(true);
    setError(null);

    try {
      await apiFetch("/trainings/cycles/new", { method: "POST" });
      router.replace("/trainings");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao criar novo ciclo");
    } finally {
      setLoading(false);
    }
  }

  function cancelNewCycle() {
    router.replace("/trainings"); // ✅ volta sem apagar nada
  }

  async function createTraining(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Nome do treino é obrigatório");
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
    } catch (e: any) {
      setError(e?.message ?? "Erro ao criar treino");
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    if (!editName.trim()) {
      setError("Nome do treino é obrigatório");
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
    } catch (e: any) {
      setError(e?.message ?? "Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  }

  function openAddExercise(t: Training) {
    setAddingForId(t._id);
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

  async function submitAddExercise(e: React.FormEvent, t: Training) {
    e.preventDefault();

    if (!exName.trim()) {
      setError("Nome do exercício é obrigatório");
      return;
    }

    const setsNum = Number(exSets);
    if (!Number.isFinite(setsNum) || setsNum < 1) {
      setError("Séries (sets) precisa ser um número >= 1");
      return;
    }

    if (!exReps.trim()) {
      setError("Reps é obrigatório (ex: 8-12)");
      return;
    }

    const currentOrders = (t.exercises ?? []).map((x) => x.order);
    const nextOrder = currentOrders.length ? Math.max(...currentOrders) + 1 : 0;

    const orderNum = exOrder.trim() === "" ? nextOrder : Number(exOrder);
    if (!Number.isFinite(orderNum) || orderNum < 0) {
      setError("Ordem (order) precisa ser um número >= 0");
      return;
    }

    const tw = exTargetWeight.trim() === "" ? undefined : Number(exTargetWeight);
    if (tw !== undefined && (!Number.isFinite(tw) || tw < 0)) {
      setError("Meta (kg) precisa ser um número >= 0");
      return;
    }

    setAddingExercise(true);
    setError(null);

    try {
      await apiFetch(`/trainings/${t._id}/exercises`, {
        method: "POST",
        body: {
          name: exName.trim(),
          sets: setsNum,
          reps: exReps.trim(),
          technique: exTechnique.trim() ? exTechnique.trim() : undefined,
          order: orderNum,
          targetWeight: tw,
        },
      });

      closeAddExercise();
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao adicionar exercício");
    } finally {
      setAddingExercise(false);
    }
  }

  function startEditExercise(t: Training, ex: Exercise) {
    setEditingExercise({ trainingId: t._id, exerciseId: ex._id });
    setEeName(ex.name);
    setEeSets(String(ex.sets));
    setEeReps(ex.reps);
    setEeTechnique(ex.technique ?? "");
    setEeTargetWeight(ex.targetWeight != null ? String(ex.targetWeight) : "");
    setEeOrder(String(ex.order));
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

  async function saveExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExercise) return;

    if (!eeName.trim()) {
      setError("Nome do exercício é obrigatório");
      return;
    }

    const setsNum = Number(eeSets);
    if (!Number.isFinite(setsNum) || setsNum < 1) {
      setError("Séries (sets) precisa ser um número >= 1");
      return;
    }

    if (!eeReps.trim()) {
      setError("Reps é obrigatório");
      return;
    }

    const orderNum = Number(eeOrder);
    if (!Number.isFinite(orderNum) || orderNum < 0) {
      setError("Ordem (order) precisa ser um número >= 0");
      return;
    }

    const tw = eeTargetWeight.trim() === "" ? undefined : Number(eeTargetWeight);
    if (tw !== undefined && (!Number.isFinite(tw) || tw < 0)) {
      setError("Meta (kg) precisa ser um número >= 0");
      return;
    }

    setSavingExercise(true);
    setError(null);

    try {
      await apiFetch(`/trainings/${editingExercise.trainingId}/exercises/${editingExercise.exerciseId}`, {
        method: "PATCH",
        body: {
          name: eeName.trim(),
          sets: setsNum,
          reps: eeReps.trim(),
          technique: eeTechnique.trim() ? eeTechnique.trim() : undefined,
          order: orderNum,
          targetWeight: tw,
        },
      });

      cancelEditExercise();
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao editar exercício");
    } finally {
      setSavingExercise(false);
    }
  }

  async function moveExercise(t: Training, ex: Exercise, direction: "up" | "down") {
    const list = [...(t.exercises ?? [])].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((x) => x._id === ex._id);
    if (idx === -1) return;

    const swapWithIndex = direction === "up" ? idx - 1 : idx + 1;
    if (swapWithIndex < 0 || swapWithIndex >= list.length) return;

    const a = list[idx];
    const b = list[swapWithIndex];

    setError(null);
    try {
      await apiFetch(`/trainings/${t._id}/exercises/${a._id}`, { method: "PATCH", body: { order: b.order } });
      await apiFetch(`/trainings/${t._id}/exercises/${b._id}`, { method: "PATCH", body: { order: a.order } });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao reordenar exercício");
    }
  }

  return (
    <main className="corefit-bg">
      <div className="corefit-container pt-24 pb-10">
        {/* Cabeçalho da página (igual vibe do print2) */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 hero-animate hero-delay-1">
            <span
              className="d-inline-flex align-items-center justify-content-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.22)",
                color: "#22c55e",
              }}
            >
              <Dumbbell size={18} />
            </span>

            <div>
              <h1 className="m-0" style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.2 }}>
                Meus <span style={{ color: "#22c55e" }}>Treinos</span>
              </h1>
              <div className="text-muted-soft" style={{ fontSize: 13, marginTop: 2 }}>
                Crie e gerencie seus treinos personalizados
              </div>
            </div>
          </div>

          {/* Ações do topo (mantidas, mas com estilo do tema) */}
          <div className="mt-3 d-flex flex-wrap gap-2 hero-animate hero-delay-2">
            <button type="button" onClick={() => router.push("/trainings/ai")} className="btn btn-soft d-inline-flex align-items-center gap-2">
              <Sparkles size={16} />
              Criar treino com IA
            </button>

            <button type="button" onClick={() => router.push("/workouts/active")} className="btn btn-soft d-inline-flex align-items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(34,197,94,0.9)", display: "inline-block" }} />
              Ver treino ativo
            </button>
          </div>
        </div>

        {/* ✅ BARRA DO NOVO CICLO (CONFIRMAÇÃO) */}
        {newCycle && (
          <div className="card-dark mb-4">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Novo ciclo</div>
            <div className="text-muted-soft" style={{ fontSize: 13 }}>
              Você entrou no fluxo de <b>novo ciclo</b>. Nada foi apagado ainda.
            </div>
            <div className="text-muted-soft" style={{ fontSize: 13, marginTop: 6 }}>
              Se confirmar, seus treinos atuais serão apagados e você vai criar tudo do zero.
            </div>

            <div className="d-flex flex-wrap gap-2 mt-3">
              <button type="button" onClick={confirmNewCycle} className="btn btn-soft" disabled={loading}>
                Confirmar novo ciclo
              </button>

              <button type="button" onClick={cancelNewCycle} className="btn btn-soft" disabled={loading}>
                Voltar sem apagar
              </button>
            </div>
          </div>
        )}

        {/* ✅ CRIAR TREINO (igual print2) */}
        {!newCycle && (
          <form onSubmit={createTraining} className="card-dark glow-green mb-4 hero-animate hero-delay-3">
            <div className="mb-3">
              <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                Nome do treino
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark"
                placeholder="Ex: Treino A – Peito"
              />
            </div>

            <div className="mb-3">
              <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-dark"
                placeholder="Ex: Hipertrofia – foco em peito e ombro"
                rows={3}
                style={{ resize: "none" }}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="btn btn-green d-inline-flex align-items-center gap-2"
              style={{ padding: "10px 14px" }}
            >
              <Plus size={18} />
              {creating ? "Criando..." : "Criar treino"}
            </button>
          </form>
        )}

        {/* ERRO */}
        {!loading && error && (
          <div className="card-dark mb-4">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Erro</div>
            <pre className="whitespace-pre-wrap" style={{ opacity: 0.85, margin: 0 }}>
              {error}
            </pre>
          </div>
        )}

        {/* LOADING */}
        {loading && <p className="text-muted-soft">Carregando...</p>}

        {/* VAZIO */}
        {!loading && !error && items.length === 0 && (
          <div className="card-dark">
            <div className="text-muted-soft" style={{ fontSize: 13 }}>
              Nenhum treino ainda. Crie o primeiro 🚀
            </div>
          </div>
        )}

        {/* LISTA */}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-4" style={{ listStyle: "none", paddingLeft: 0 }}>
            {items.map((t) => (
              <li key={t._id} className="card-dark">
                <div className="d-flex align-items-start justify-content-between gap-3">
                  <div style={{ flex: 1 }}>
                    {editingId === t._id ? (
                      <form onSubmit={saveEdit} className="space-y-2">
                        <div>
                          <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                            Nome
                          </label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input-dark"
                          />
                        </div>

                        <div>
                          <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                            Descrição
                          </label>
                          <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="input-dark"
                          />
                        </div>

                        <div className="d-flex gap-2 mt-2">
                          <button type="submit" disabled={saving} className="btn btn-soft">
                            {saving ? "Salvando..." : "Salvar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditName("");
                              setEditDescription("");
                            }}
                            className="btn btn-soft"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 10,
                              background: "rgba(34,197,94,0.12)",
                              border: "1px solid rgba(34,197,94,0.22)",
                              color: "#22c55e",
                              display: "grid",
                              placeItems: "center",
                              flex: "0 0 auto",
                            }}
                          >
                            <Dumbbell size={16} />
                          </div>

                          <div style={{ fontWeight: 900, fontSize: 15 }}>{t.name}</div>
                        </div>

                        {t.description && (
                          <div className="text-muted-soft" style={{ fontSize: 13, marginTop: 6 }}>
                            {t.description}
                          </div>
                        )}

                        <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                          Criado em: {new Date(t.createdAt).toLocaleString()}
                        </div>

                        {/* EXERCÍCIOS */}
                        <div className="mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div style={{ fontSize: 13, fontWeight: 900 }}>Exercícios ({t.exercises?.length ?? 0})</div>

                            <button
                              type="button"
                              onClick={() => openAddExercise(t)}
                              className="btn btn-soft d-inline-flex align-items-center gap-2"
                              disabled={newCycle}
                              title={newCycle ? "Saia do fluxo de novo ciclo para editar" : undefined}
                              style={{ padding: "8px 12px", fontSize: 13 }}
                            >
                              <Plus size={16} />
                              Adicionar exercício
                            </button>
                          </div>

                          {/* FORM ADD EXERCISE (mantido, só estilo) */}
                          {addingForId === t._id && !newCycle && (
                            <form
                              onSubmit={(e) => submitAddExercise(e, t)}
                              className="mt-3"
                              style={{
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 16,
                                padding: 14,
                                background: "rgba(255,255,255,0.02)",
                              }}
                            >
                              <div className="mb-2">
                                <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                                  Nome do exercício
                                </label>
                                <input
                                  value={exName}
                                  onChange={(e) => setExName(e.target.value)}
                                  className="input-dark"
                                  placeholder="Ex: Supino reto"
                                />
                              </div>

                              <div className="d-grid" style={{ gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                                <div>
                                  <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                                    Séries
                                  </label>
                                  <input
                                    value={exSets}
                                    onChange={(e) => setExSets(e.target.value)}
                                    className="input-dark"
                                    placeholder="4"
                                  />
                                </div>

                                <div>
                                  <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                                    Reps
                                  </label>
                                  <input
                                    value={exReps}
                                    onChange={(e) => setExReps(e.target.value)}
                                    className="input-dark"
                                    placeholder="8-12"
                                  />
                                </div>
                              </div>

                              <div className="mt-2">
                                <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                                  Técnica (opcional)
                                </label>
                                <input
                                  value={exTechnique}
                                  onChange={(e) => setExTechnique(e.target.value)}
                                  className="input-dark"
                                  placeholder="Ex: descida controlada"
                                />
                              </div>

                              <div className="mt-2">
                                <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                                  Meta (kg) (opcional)
                                </label>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  step="0.5"
                                  value={exTargetWeight}
                                  onChange={(e) => setExTargetWeight(e.target.value)}
                                  className="input-dark"
                                  placeholder="Ex: 12.5"
                                />
                              </div>

                              <div className="mt-2">
                                <label className="register-label" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                                  Ordem (opcional)
                                </label>
                                <input
                                  value={exOrder}
                                  onChange={(e) => setExOrder(e.target.value)}
                                  className="input-dark"
                                  placeholder="Deixe vazio para automático"
                                />
                                <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 6, opacity: 0.75 }}>
                                  Se deixar vazio, vai para o final automaticamente.
                                </div>
                              </div>

                              <div className="d-flex gap-2 mt-3">
                                <button type="submit" disabled={addingExercise} className="btn btn-green">
                                  {addingExercise ? "Adicionando..." : "Adicionar"}
                                </button>

                                <button type="button" onClick={closeAddExercise} className="btn btn-soft">
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          )}

                          {/* LISTA EXERCÍCIOS (mantida) */}
                          <div className="mt-3">
                            {!t.exercises || t.exercises.length === 0 ? (
                              <div className="text-muted-soft" style={{ fontSize: 13 }}>
                                Nenhum exercício ainda. Adicione o primeiro!
                              </div>
                            ) : (
                              <ul className="space-y-2" style={{ listStyle: "none", paddingLeft: 0 }}>
                                {[...t.exercises]
                                  .sort((a, b) => a.order - b.order)
                                  .map((ex) => {
                                    const isEditing =
                                      editingExercise?.trainingId === t._id &&
                                      editingExercise?.exerciseId === ex._id;

                                    return (
                                      <li
                                        key={ex._id}
                                        style={{
                                          background: "rgba(255,255,255,0.03)",
                                          border: "1px solid rgba(255,255,255,0.08)",
                                          borderRadius: 14,
                                          padding: 12,
                                        }}
                                      >
                                        {isEditing ? (
                                          <form onSubmit={saveExercise} className="space-y-2">
                                            <div className="d-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                              <div>
                                                <label className="register-label" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                                                  Nome
                                                </label>
                                                <input
                                                  value={eeName}
                                                  onChange={(e) => setEeName(e.target.value)}
                                                  className="input-dark"
                                                />
                                              </div>

                                              <div>
                                                <label className="register-label" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                                                  Séries
                                                </label>
                                                <input
                                                  value={eeSets}
                                                  onChange={(e) => setEeSets(e.target.value)}
                                                  className="input-dark"
                                                />
                                              </div>
                                            </div>

                                            <div className="d-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                              <div>
                                                <label className="register-label" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                                                  Reps
                                                </label>
                                                <input
                                                  value={eeReps}
                                                  onChange={(e) => setEeReps(e.target.value)}
                                                  className="input-dark"
                                                />
                                              </div>

                                              <div>
                                                <label className="register-label" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                                                  Ordem
                                                </label>
                                                <input
                                                  value={eeOrder}
                                                  onChange={(e) => setEeOrder(e.target.value)}
                                                  className="input-dark"
                                                />
                                              </div>
                                            </div>

                                            <div>
                                              <label className="register-label" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                                                Técnica (opcional)
                                              </label>
                                              <input
                                                value={eeTechnique}
                                                onChange={(e) => setEeTechnique(e.target.value)}
                                                className="input-dark"
                                              />
                                            </div>

                                            <div>
                                              <label className="register-label" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                                                Meta (kg) (opcional)
                                              </label>
                                              <input
                                                type="number"
                                                inputMode="decimal"
                                                min={0}
                                                step="0.5"
                                                value={eeTargetWeight}
                                                onChange={(e) => setEeTargetWeight(e.target.value)}
                                                className="input-dark"
                                                placeholder="Ex: 12.5"
                                              />
                                            </div>

                                            <div className="d-flex gap-2 mt-2">
                                              <button type="submit" disabled={savingExercise} className="btn btn-soft">
                                                {savingExercise ? "Salvando..." : "Salvar"}
                                              </button>
                                              <button type="button" onClick={cancelEditExercise} className="btn btn-soft">
                                                Cancelar
                                              </button>
                                            </div>
                                          </form>
                                        ) : (
                                          <div className="d-flex align-items-start justify-content-between gap-2">
                                            <div style={{ minWidth: 0 }}>
                                              <div style={{ fontWeight: 900, fontSize: 13 }}>
                                                {ex.order + 1}. {ex.name}
                                              </div>
                                              <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 4 }}>
                                                {ex.sets}x {ex.reps}
                                                {ex.technique ? ` • ${ex.technique}` : ""}
                                                {ex.targetWeight != null ? ` • Meta: ${ex.targetWeight}kg` : ""}
                                              </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-3">
                                              <div className="d-flex flex-column align-items-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => moveExercise(t, ex, "up")}
                                                  className="btn btn-soft"
                                                  style={{ padding: "6px 10px", fontSize: 12 }}
                                                  title="Subir"
                                                  disabled={newCycle}
                                                >
                                                  ↑
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => moveExercise(t, ex, "down")}
                                                  className="btn btn-soft"
                                                  style={{ padding: "6px 10px", fontSize: 12 }}
                                                  title="Descer"
                                                  disabled={newCycle}
                                                >
                                                  ↓
                                                </button>
                                              </div>

                                              <div className="d-flex flex-column align-items-end gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => !newCycle && startEditExercise(t, ex)}
                                                  className="btn btn-soft"
                                                  style={{ padding: "6px 10px", fontSize: 12 }}
                                                  disabled={newCycle}
                                                  title={newCycle ? "Saia do fluxo de novo ciclo para editar" : undefined}
                                                >
                                                  Editar
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() => !newCycle && askDeleteExercise(t, ex)}
                                                  className="btn btn-soft"
                                                  style={{ padding: "6px 10px", fontSize: 12, color: "#fecaca" }}
                                                  disabled={newCycle}
                                                  title={newCycle ? "Saia do fluxo de novo ciclo para excluir" : undefined}
                                                >
                                                  Excluir
                                                </button>
                                              </div>
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
                      </>
                    )}
                  </div>

                  {/* AÇÕES TREINO */}
                  <div className="d-flex flex-column gap-2 align-items-end">
                    <button
                      onClick={() => startWorkout(t)}
                      className="btn btn-green"
                      disabled={newCycle}
                      title={newCycle ? "Saia do fluxo de novo ciclo para iniciar" : undefined}
                      style={{ padding: "8px 12px", fontSize: 13 }}
                    >
                      Iniciar
                    </button>

                    {editingId !== t._id ? (
                      <button
                        onClick={() => {
                          if (newCycle) return;
                          setEditingId(t._id);
                          setEditName(t.name);
                          setEditDescription(t.description ?? "");
                        }}
                        className="btn btn-soft"
                        disabled={newCycle}
                        title={newCycle ? "Saia do fluxo de novo ciclo para editar" : undefined}
                        style={{ padding: "8px 12px", fontSize: 13 }}
                      >
                        Editar
                      </button>
                    ) : (
                      <span className="text-muted-soft" style={{ fontSize: 12 }}>
                        Editando
                      </span>
                    )}

                    <button
                      onClick={() => !newCycle && askDeleteTraining(t)}
                      className="btn btn-soft"
                      disabled={newCycle}
                      title={newCycle ? "Saia do fluxo de novo ciclo para excluir" : undefined}
                      style={{ padding: "8px 12px", fontSize: 13, color: "#fecaca" }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <ConfirmDialog
          open={confirmOpen}
          title={pendingDelete?.type === "training" ? "Excluir treino?" : "Excluir exercício?"}
          description={
            pendingDelete?.type === "training"
              ? `Você está prestes a excluir o treino${pendingDelete?.name ? ` "${pendingDelete.name}"` : ""}. Essa ação não pode ser desfeita.`
              : `Você está prestes a excluir o exercício${pendingDelete?.name ? ` "${pendingDelete.name}"` : ""}. Essa ação não pode ser desfeita.`
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
