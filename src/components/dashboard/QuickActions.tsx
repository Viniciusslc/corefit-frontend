"use client";

import { useRouter } from "next/navigation";
import { RefreshCcw, PencilLine, Sparkles, TrendingUp, ChevronRight } from "lucide-react";

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
            <div className="text-muted-soft">Atalhos para acelerar sua evolução.</div>
          </div>
        </div>
      </div>

      <div className="qa-rows">
        <button
          type="button"
          className="qa-row qa-row--primary"
          onClick={() => router.push("/trainings")}
        >
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <RefreshCcw size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">Novo ciclo</div>
              <div className="qa-row-sub">Iniciar novo plano</div>
            </div>
          </div>
          <span className="qa-row-right">
            <ChevronRight size={18} />
          </span>
        </button>

        <button
          type="button"
          className="qa-row"
          onClick={() => router.push("/trainings")}
        >
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <PencilLine size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">Editar treino</div>
              <div className="qa-row-sub">Ajustar exercícios</div>
            </div>
          </div>
          <span className="qa-row-right">
            <ChevronRight size={18} />
          </span>
        </button>

        <button type="button" className="qa-row" disabled>
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <Sparkles size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">IA Coach</div>
              <div className="qa-row-sub">Em construção</div>
            </div>
          </div>
          <span className="qa-row-right">
            <ChevronRight size={18} />
          </span>
        </button>

        <button
          type="button"
          className="qa-row"
          onClick={() => router.push("/workouts")}
        >
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <TrendingUp size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">Progresso</div>
              <div className="qa-row-sub">Ver evolução</div>
            </div>
          </div>
          <span className="qa-row-right">
            <ChevronRight size={18} />
          </span>
        </button>
      </div>
    </div>
  );
}