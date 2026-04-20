"use client";

import { useRouter } from "next/navigation";
import { Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { CFButton } from "@/components/corefit/primitives";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";

export function MembershipSpotlight() {
  const router = useRouter();
  const { hasPremiumAccess, session } = usePremiumAccess();
  const isAdmin = session?.role === "admin";
  const subscriptionStatus = String(session?.subscriptionStatus ?? "inactive");
  const planSource = String(session?.planSource ?? "system");

  const statusLabel =
    subscriptionStatus === "active"
      ? "Premium ativo"
      : subscriptionStatus === "trialing"
      ? "Periodo de teste"
      : hasPremiumAccess
      ? "Acesso premium"
      : "Plano free";

  const sourceLabel =
    planSource === "checkout"
      ? "Liberado via checkout"
      : planSource === "admin"
      ? "Liberado pelo admin"
      : planSource === "founder"
      ? "Conta founder"
      : "Camada padrao do produto";

  return (
    <section
      className={`membership-spotlight ${
        hasPremiumAccess ? "membership-spotlight--premium" : "membership-spotlight--free"
      }`}
    >
      <div className="membership-spotlight-copy">
        <div className="membership-spotlight-kicker">
          {hasPremiumAccess ? <Crown size={14} /> : <Zap size={14} />}
          {statusLabel}
        </div>

        <h3 className="membership-spotlight-title">
          {hasPremiumAccess
            ? "Sua conta ja esta na camada premium."
            : "Seu dashboard free sustenta a rotina. O premium entra para transformar isso em leitura."}
        </h3>

        <p className="membership-spotlight-subtitle">
          {hasPremiumAccess
            ? "IA, leitura avancada e camada de assinatura ja estao conectadas ao seu acesso. Agora o foco e usar isso no fluxo do produto."
            : "Voce ja tem rotina, historico e controle operacional. O premium adiciona score, comparacoes, insight e uma camada de IA que deixa o progresso muito mais visivel."}
        </p>

        <div className="membership-spotlight-meta">
          <span>{sourceLabel}</span>
          {isAdmin ? (
            <span className="membership-spotlight-admin">
              <ShieldCheck size={12} />
              Conta admin
            </span>
          ) : null}
        </div>
      </div>

      <div className="membership-spotlight-side">
        <div className="membership-spotlight-grid">
          <div className="membership-spotlight-stat">
            <span>Plano</span>
            <b>{hasPremiumAccess ? "Premium" : "Free"}</b>
            <small>{hasPremiumAccess ? "Camada ativa no token" : "Base principal do produto"}</small>
          </div>

          <div className="membership-spotlight-stat">
            <span>Leitura</span>
            <b>{hasPremiumAccess ? "IA liberada" : "Upgrade disponivel"}</b>
            <small>{hasPremiumAccess ? "Fluxo premium pronto para uso" : "Pronto para checkout quando quiser"}</small>
          </div>
        </div>

        <div className="membership-spotlight-actions">
          {hasPremiumAccess ? (
            <>
              <CFButton
                type="button"
                className="d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => router.push("/trainings/ai")}
              >
                <Sparkles size={15} />
                Abrir IA Coach
              </CFButton>

              <CFButton
                type="button"
                variant="secondary"
                className="d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => router.push("/profile")}
              >
                Gerenciar assinatura
              </CFButton>
            </>
          ) : (
            <>
              <CFButton
                type="button"
                className="membership-upgrade-cta d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => router.push("/planos?source=dashboard-membership")}
              >
                <Crown size={15} />
                Desbloquear leitura premium
              </CFButton>

              <CFButton
                type="button"
                variant="secondary"
                className="d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => router.push("/profile")}
              >
                Ver meu plano
              </CFButton>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
