"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";

type AiDraftExercise = {
  name: string;
  sets: number;
  reps: string;
  technique?: string;
  order: number;
  targetWeight?: number;
};

type AiTrainingDraft = {
  name: string;
  description?: string;
  exercises: AiDraftExercise[];
};

export default function GenerateTrainingAiPage() {
  useRequireAuth();

  const [goal, setGoal] = useState("hipertrofia");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [level, setLevel] = useState("intermediario");
  const [sessionMinutes, setSessionMinutes] = useState<number>(60);
  const [focus, setFocus] = useState("");
  const [restrictions, setRestrictions] = useState("");

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<AiTrainingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderedExercises = useMemo(() => {
    if (!draft) return [];
    return [...draft.exercises].sort((a, b) => a.order - b.order);
  }, [draft]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setDraft(null);

    try {
      const res = await apiFetch<AiTrainingDraft>(`/ai/trainings/generate`, {
        method: "POST",
        body: JSON.stringify({
          goal,
          daysPerWeek: Number(daysPerWeek),
          level,
          sessionMinutes: Number(sessionMinutes),
          focus: focus || undefined,
          restrictions: restrictions || undefined,
        }),
      });

      setDraft(res);
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar treino");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!draft) return;

    setLoading(true);
    setError(null);

    try {
      // 1) cria o treino (SEM exercises)
      const created = await apiFetch<{ _id: string }>(`/trainings`, {
        method: "POST",
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
        }),
      });

      const trainingId = created?._id;
      if (!trainingId) {
        throw new Error("Não consegui obter o ID do treino criado.");
      }

      // 2) adiciona os exercícios um por um
      for (const ex of orderedExercises) {
        await apiFetch(`/trainings/${trainingId}/exercises`, {
          method: "POST",
          body: JSON.stringify({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            technique: ex.technique,
            order: ex.order,
            targetWeight: ex.targetWeight,
          }),
        });
      }

      // 3) volta pra lista
      window.location.href = "/trainings";
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar treino");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Gerar treino com IA</h1>
        <Link href="/trainings" className="text-sm text-gray-600 hover:underline">
          Voltar
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="text-gray-600 mb-1">Objetivo</div>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <div className="text-gray-600 mb-1">Dias por semana</div>
            <input
              className="w-full border rounded-xl px-3 py-2"
              type="number"
              min={2}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            />
          </label>

          <label className="text-sm">
            <div className="text-gray-600 mb-1">Nível</div>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <div className="text-gray-600 mb-1">Minutos por sessão</div>
            <input
              className="w-full border rounded-xl px-3 py-2"
              type="number"
              min={20}
              max={120}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
            />
          </label>
        </div>

        <label className="text-sm block">
          <div className="text-gray-600 mb-1">Foco (opcional)</div>
          <input
            className="w-full border rounded-xl px-3 py-2"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Ex: peito, costas, glúteos..."
          />
        </label>

        <label className="text-sm block">
          <div className="text-gray-600 mb-1">Restrições (opcional)</div>
          <input
            className="w-full border rounded-xl px-3 py-2"
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            placeholder="Ex: dor no ombro, evitar agachamento livre..."
          />
        </label>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-xl bg-black text-white py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Gerando..." : "Gerar treino"}
        </button>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {draft && (
        <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{draft.name}</div>
              {draft.description && (
                <div className="text-sm text-gray-600 mt-1">{draft.description}</div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar treino"}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {orderedExercises.map((ex) => (
              <div key={ex.order} className="rounded-xl border p-3">
                <div className="font-medium">
                  {ex.order + 1}. {ex.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {ex.sets} séries • {ex.reps}
                  {ex.technique ? ` • ${ex.technique}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
