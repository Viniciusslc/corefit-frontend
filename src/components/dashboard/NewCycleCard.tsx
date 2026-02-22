"use client";

import { useRouter } from "next/navigation";

export default function NewCycleCard() {
  const router = useRouter();

  function startNewCycle() {
    router.push("/trainings?newCycle=1");
  }

  function editCurrentPlan() {
    router.push("/trainings");
  }

  return (
    <div className="card-dark">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <p className="text-muted-soft mb-1" style={{ fontSize: 12 }}>
            Treino
          </p>

          <h3 className="h6 mb-1" style={{ fontWeight: 900 }}>
            Novo ciclo ou ajuste o plano atual
          </h3>

          <div className="text-muted-soft" style={{ fontSize: 12, lineHeight: 1.3 }}>
            <div>• Novo ciclo: apaga treinos atuais e você cria do zero.</div>
            <div>• Editar: mantém seu ciclo e permite ajustar treinos/exercícios.</div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-green btn-sm" onClick={startNewCycle}>
          Criar novo ciclo
        </button>

        <button className="btn btn-soft btn-sm" onClick={editCurrentPlan}>
          Editar treino atual
        </button>
      </div>
    </div>
  );
}
