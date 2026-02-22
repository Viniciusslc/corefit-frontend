"use client";

import { useRouter } from "next/navigation";
import { RefreshCcw, PencilLine, Sparkles, TrendingUp } from "lucide-react";

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="card-dark">
      <div className="section-head">
        <div className="section-head-left">
          <span className="section-icon">
            <Sparkles size={16} />
          </span>
          <div>
            <div className="section-title">Ações rápidas</div>
            <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 2 }}>
              Atalhos para acelerar sua evolução.
            </div>
          </div>
        </div>
      </div>

      <div className="qa-grid">
        {/* Novo ciclo */}
        <button
          type="button"
          className="qa-tile qa-tile--primary"
          onClick={() => router.push("/trainings?newCycle=1")}
        >
          <div className="qa-ic">
            <RefreshCcw size={16} />
          </div>
          <div className="qa-tx">
            <b>Novo ciclo</b>
            <span>Iniciar novo plano</span>
          </div>
        </button>

        {/* Editar treino */}
        <button
          type="button"
          className="qa-tile"
          onClick={() => router.push("/trainings")}
        >
          <div className="qa-ic">
            <PencilLine size={16} />
          </div>
          <div className="qa-tx">
            <b>Editar treino</b>
            <span>Ajustar exercícios</span>
          </div>
        </button>

        {/* IA Coach */}
        <button
          type="button"
          className="qa-tile"
          onClick={() => router.push("/ai/generate-training")}
        >
          <div className="qa-ic">
            <Sparkles size={16} />
          </div>
          <div className="qa-tx">
            <b>IA Coach</b>
            <span>Sugestões inteligentes</span>
          </div>
        </button>

        {/* Progresso */}
        <button
          type="button"
          className="qa-tile"
          onClick={() => router.push("/workouts")}
        >
          <div className="qa-ic">
            <TrendingUp size={16} />
          </div>
          <div className="qa-tx">
            <b>Progresso</b>
            <span>Ver evolução</span>
          </div>
        </button>
      </div>
    </div>
  );
}
