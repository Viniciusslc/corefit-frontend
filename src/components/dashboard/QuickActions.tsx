"use client";

import { useRouter } from "next/navigation";
import { RefreshCcw, PencilLine, Sparkles, TrendingUp } from "lucide-react";

import { CFCard } from "@/components/ui/CFCard";
import { CFButton } from "@/components/ui/CFButton";

export function QuickActions() {
  const router = useRouter();

  return (
    <CFCard>
      <div className="section-head">
        <div className="section-head-left">
          <span className="section-icon">
            <Sparkles size={16} />
          </span>
          <div>
            <div className="section-title">Ações rápidas</div>
            <div
              className="text-muted-soft"
              style={{ fontSize: 12, marginTop: 2 }}
            >
              Atalhos para acelerar sua evolução.
            </div>
          </div>
        </div>
      </div>

      <div className="qa-grid">
        {/* Novo ciclo */}
        <CFButton
          variant="primary"
          onClick={() => router.push("/trainings?newCycle=1")}
          className="qa-tile"
        >
          <div className="qa-ic">
            <RefreshCcw size={16} />
          </div>
          <div className="qa-tx">
            <b>Novo ciclo</b>
            <span>Iniciar novo plano</span>
          </div>
        </CFButton>

        {/* Editar treino */}
        <CFButton
          variant="soft"
          onClick={() => router.push("/trainings")}
          className="qa-tile"
        >
          <div className="qa-ic">
            <PencilLine size={16} />
          </div>
          <div className="qa-tx">
            <b>Editar treino</b>
            <span>Ajustar exercícios</span>
          </div>
        </CFButton>

        {/* IA Coach */}
        <CFButton
          variant="soft"
          onClick={() => router.push("/ai-coach")}
          className="qa-tile"
        >
          <div className="qa-ic">
            <Sparkles size={16} />
          </div>
          <div className="qa-tx">
            <b>IA Coach</b>
            <span>Em construção</span>
          </div>
        </CFButton>

        {/* Progresso */}
        <CFButton
          variant="soft"
          onClick={() => router.push("/workouts")}
          className="qa-tile"
        >
          <div className="qa-ic">
            <TrendingUp size={16} />
          </div>
          <div className="qa-tx">
            <b>Progresso</b>
            <span>Ver evolução</span>
          </div>
        </CFButton>
      </div>
    </CFCard>
  );
}