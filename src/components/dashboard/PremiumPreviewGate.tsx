"use client";

import Link from "next/link";
import { ArrowUpRight, Crown, Lock, Sparkles, TrendingUp } from "lucide-react";

const lockedStats = [
  { label: "score premium", value: "40", helper: "consistencia com contexto" },
  { label: "volume semanal", value: "18.4t", helper: "comparacao automatica" },
  { label: "insight do coach", value: "IA", helper: "recomendacao guiada" },
];

export function PremiumPreviewGate() {
  return (
    <section className="premium-preview-gate">
      <div className="premium-preview-head">
        <div>
          <div className="premium-command-kicker">
            <Lock size={14} />
            Premium insight
          </div>
          <h2 className="premium-command-title">O free organiza. O premium interpreta.</h2>
          <p className="premium-command-subtitle">
            Sua base ja esta viva. O proximo salto e abrir a leitura inteligente:
            score, tendencias, comparacoes e insight acionavel dentro do dashboard.
          </p>
        </div>

        <Link href="/planos?source=dashboard-premium-gate" className="premium-preview-link">
          Ver premium agora
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="premium-preview-grid">
        <div className="premium-preview-shell">
          <div className="premium-preview-overlay">
            <div className="premium-preview-badge">
              <Lock size={13} />
              Desbloqueie no premium
            </div>
          </div>

          <div className="premium-preview-cards">
            {lockedStats.map((item) => (
              <div key={item.label} className="premium-preview-card">
                <span>{item.label}</span>
                <b>{item.value}</b>
                <small>{item.helper}</small>
              </div>
            ))}
          </div>

          <div className="premium-preview-graph">
            <div className="premium-preview-line" />
          </div>
        </div>

        <div className="premium-preview-copy">
          <div className="premium-preview-list">
            <div className="premium-preview-item">
              <span className="premium-preview-item-icon">
                <TrendingUp size={15} />
              </span>
              <div>
                <b>Leitura mais clara do progresso</b>
                <small>Score, volume e consistencia deixam de ficar espalhados.</small>
              </div>
            </div>

            <div className="premium-preview-item">
              <span className="premium-preview-item-icon">
                <Sparkles size={15} />
              </span>
              <div>
                <b>Insight premium com contexto</b>
                <small>Voce entende o que fazer a seguir, nao so o que registrou.</small>
              </div>
            </div>

            <div className="premium-preview-item">
              <span className="premium-preview-item-icon">
                <Crown size={15} />
              </span>
              <div>
                <b>Upgrade mais obvio dentro do fluxo</b>
                <small>IA Coach, comparacoes e camada de decisao aparecem no mesmo lugar.</small>
              </div>
            </div>
          </div>

          <div className="premium-preview-actions">
            <Link href="/planos?source=dashboard-membership" className="premium-preview-primary">
              Ver o que o premium libera
            </Link>
            <Link href="/trainings/ai" className="premium-preview-secondary">
              Explorar IA Coach
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
