"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, PencilLine, RefreshCcw, Sparkles, TrendingUp } from "lucide-react";

import { CFSection } from "@/components/corefit/primitives";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";

export function QuickActions() {
  const router = useRouter();
  const { hasPremiumAccess } = usePremiumAccess();

  return (
    <CFSection tone="default" padding="md" className="dashboard-panel-card">
      <div className="section-head">
        <div className="section-head-left">
          <span className="section-icon">
            <Sparkles size={16} />
          </span>
          <div>
            <div className="section-title">Acoes rapidas</div>
            <div className="text-muted-soft">Entradas simples para continuar evoluindo.</div>
          </div>
        </div>
      </div>

      <div className="qa-rows">
        <button type="button" className="qa-row qa-row--primary" onClick={() => router.push("/trainings")}>
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <RefreshCcw size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">Novo ciclo</div>
              <div className="qa-row-sub">Criar ou reiniciar seu plano atual</div>
            </div>
          </div>
          <span className="qa-row-right">
            <ChevronRight size={18} />
          </span>
        </button>

        <button type="button" className="qa-row" onClick={() => router.push("/trainings")}>
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <PencilLine size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">Editar treino</div>
              <div className="qa-row-sub">Ajustar exercicios e organizacao</div>
            </div>
          </div>
          <span className="qa-row-right">
            <ChevronRight size={18} />
          </span>
        </button>

        <button type="button" className="qa-row" onClick={() => router.push("/workouts")}>
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <TrendingUp size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">Ver progresso</div>
              <div className="qa-row-sub">Abrir historico e comparar sessoes</div>
            </div>
          </div>
          <span className="qa-row-right">
            <ChevronRight size={18} />
          </span>
        </button>

        <button
          type="button"
          className="qa-row"
          onClick={() => router.push(hasPremiumAccess ? "/trainings/ai" : "/planos?source=dashboard-quick-actions")}
        >
          <div className="qa-row-left">
            <span className="qa-row-ic">
              <Sparkles size={16} />
            </span>
            <div className="qa-row-txt">
              <div className="qa-row-title">IA Coach</div>
              <div className="qa-row-sub">
                {hasPremiumAccess
                  ? "Gerar treino inteligente e usar a camada premium"
                  : "Desbloquear IA, leitura avancada e camada premium"}
              </div>
            </div>
          </div>
          <span className="qa-row-right">
            {hasPremiumAccess ? "Abrir" : "Upgrade"}
          </span>
        </button>
      </div>
    </CFSection>
  );
}
