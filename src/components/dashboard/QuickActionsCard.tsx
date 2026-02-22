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
              Atalhos pra você evoluir mais rápido.
            </div>
          </div>
        </div>
      </div>

      <div className="quick-grid">
        {/* Novo ciclo */}
        <button
          className="quick-tile quick-tile-primary"
          onClick={() => router.push("/trainings?newCycle=1")}
          type="button"
        >
          <div className="quick-ic">
            <RefreshCcw size={16} />
          </div>
          <div className="quick-txt">
            <b>Novo ciclo</b>
            <span>Iniciar novo plano</span>
          </div>
        </button>

        {/* Editar treino */}
        <button
          className="quick-tile"
          onClick={() => router.push("/trainings")}
          type="button"
        >
          <div className="quick-ic">
            <PencilLine size={16} />
          </div>
          <div className="quick-txt">
            <b>Editar treino</b>
            <span>Ajustar exercícios</span>
          </div>
        </button>

        {/* IA Coach */}
        <button
          className="quick-tile"
          onClick={() => router.push("/ai/generate-training")}
          type="button"
        >
          <div className="quick-ic">
            <Sparkles size={16} />
          </div>
          <div className="quick-txt">
            <b>IA Coach</b>
            <span>Sugestões inteligentes</span>
          </div>
        </button>

        {/* Progresso */}
        <button
          className="quick-tile"
          onClick={() => router.push("/workouts")}
          type="button"
        >
          <div className="quick-ic">
            <TrendingUp size={16} />
          </div>
          <div className="quick-txt">
            <b>Progresso</b>
            <span>Ver evolução</span>
          </div>
        </button>
      </div>
    </div>
  );
}
