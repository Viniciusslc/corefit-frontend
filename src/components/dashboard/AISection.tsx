"use client";

import { useEffect, useMemo, useState } from "react";
import { Wand2, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

type DashboardStats = {
  currentTrainingAgeDays: number | null;
};

export function AISection() {
  const router = useRouter();

  const [days, setDays] = useState<number | null>(null);

  // ==========================
  // Busca stats do dashboard
  // ==========================
  useEffect(() => {
    let mounted = true;

    apiFetch<DashboardStats>("/workouts/dashboard-stats")
      .then((data) => {
        if (!mounted) return;
        setDays(
          typeof data?.currentTrainingAgeDays === "number"
            ? data.currentTrainingAgeDays
            : null
        );
      })
      .catch(() => {
        // Segurança: não quebra UI se falhar
        if (!mounted) return;
        setDays(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================
  // Mensagens variáveis 30 / 45 dias
  // ==========================
  const changeHint = useMemo(() => {
    if (days == null) return null;

    const suggestMessages = [
      `Seu treino atual já tem ${days} dias. Você já pode trocar se quiser.`,
      `Já fazem ${days} dias com esse treino. Talvez seja um bom momento para mudar.`,
      `Você está há ${days} dias com o mesmo treino. Se quiser variar, agora é uma boa hora.`,
    ];

    const recommendMessages = [
      `Seu treino atual já tem ${days} dias. Recomendamos trocar para continuar evoluindo.`,
      `Já são ${days} dias com o mesmo treino. Uma troca agora pode destravar novos resultados.`,
      `Depois de ${days} dias, mudar o treino costuma trazer melhores estímulos.`,
    ];

    function pickRandom(arr: string[]) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    if (days >= 45) {
      return {
        level: "recommend" as const,
        text: pickRandom(recommendMessages),
      };
    }

    if (days >= 30) {
      return {
        level: "suggest" as const,
        text: pickRandom(suggestMessages),
      };
    }

    return null;
  }, [days]);

  return (
    <div className="card-dark p-4 glow position-relative overflow-hidden">
      {/* Glow de fundo */}
      <div
        className="position-absolute"
        style={{
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.10), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div className="position-relative">
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="kpi-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="fw-bold">Treinador IA</div>
            <div className="text-muted-soft" style={{ fontSize: 13 }}>
              Quer ajuda com seu treino?
            </div>
          </div>
        </div>

        {/* ✅ Aviso 30 / 45 dias */}
        {changeHint && (
          <div
            className="mb-3"
            style={{
              borderRadius: 10,
              padding: "10px 12px",
              border:
                changeHint.level === "recommend"
                  ? "1px solid rgba(239,68,68,0.25)"
                  : "1px solid rgba(234,179,8,0.25)",
              background:
                changeHint.level === "recommend"
                  ? "rgba(127,29,29,0.30)"
                  : "rgba(113,63,18,0.30)",
              color:
                changeHint.level === "recommend"
                  ? "rgba(252,165,165,0.95)"
                  : "rgba(253,224,71,0.95)",
              fontSize: 13,
              lineHeight: "18px",
            }}
          >
            {changeHint.text}
          </div>
        )}

        {/* Ações */}
        <div className="d-flex flex-column flex-sm-row gap-2">
          <button
            className="btn btn-green flex-fill d-inline-flex align-items-center justify-content-center gap-2 py-3"
            onClick={() => router.push("/ai/generate-training")}
          >
            <Wand2 size={16} />
            Gerar treino com IA
          </button>

          <button
            className="btn btn-soft flex-fill d-inline-flex align-items-center justify-content-center gap-2 py-3"
            onClick={() => router.push("/ai/adjust-training")}
          >
            <Settings2 size={16} />
            Ajustar treino atual
          </button>
        </div>
      </div>
    </div>
  );
}
