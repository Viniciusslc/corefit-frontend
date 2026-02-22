"use client";

import { useRouter } from "next/navigation";
import { PencilLine, RefreshCcw } from "lucide-react";

export function NewTrainingCard() {
  const router = useRouter();

  function handleNewCycle() {
    // 👉 fluxo simples: manda pra tela de treinos com um parâmetro
    // (se você já tem lógica lá, você adapta o nome do param depois)
    router.push("/trainings?newCycle=1");
  }

  function handleEditCurrent() {
    // 👉 fluxo simples: editar = ir pra treinos
    router.push("/trainings");
  }

  return (
    <div className="card-dark">
      <div className="section-head">
        <div className="section-head-left">
          <span className="section-icon">
            <RefreshCcw size={16} />
          </span>
          <div>
            <div className="section-title">Treino</div>
            <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 2 }}>
              Comece um novo ciclo ou ajuste o plano atual.
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 flex-wrap">
        <button onClick={handleNewCycle} className="btn btn-green d-inline-flex align-items-center gap-2">
          <RefreshCcw size={16} />
          Criar novo ciclo
        </button>

        <button onClick={handleEditCurrent} className="btn btn-soft d-inline-flex align-items-center gap-2">
          <PencilLine size={16} />
          Editar treino atual
        </button>
      </div>

      <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.45 }}>
        • <b>Novo ciclo</b>: reinicia seu plano (você pode implementar a lógica depois). <br />
        • <b>Editar</b>: mantém seu ciclo e ajusta treinos/exercícios.
      </div>
    </div>
  );
}
