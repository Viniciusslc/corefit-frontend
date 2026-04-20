"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Crown, Dumbbell, Play, Zap } from "lucide-react";

import { apiFetch } from "@/lib/apiFetch";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { CFBadge, CFButton, CFSection } from "@/components/corefit/primitives";

type Props = {
  trainingId?: string;
  workoutName: string;
  workoutType: string;
  exerciseCount: number;
  isActive: boolean;
  onStarted?: () => void;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const clean = token.replace(/^Bearer\s+/i, "").trim();
    const parts = clean.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getUserNameFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken");

  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  if (name) return name;

  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  return email || null;
}

function firstNameFromFullName(fullName: string | null): string | null {
  if (!fullName) return null;
  const clean = fullName.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  return clean.split(" ")[0] ?? null;
}

function prettyName(firstName: string | null): string | null {
  if (!firstName) return null;
  const lowered = firstName.toLowerCase();
  if (lowered === "usuario") return "Atleta";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function pickEmoji() {
  const emojis = ["💪", "🔥", "⚡", "🥇", "🚀", "🏋️", "👏"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export function HeroWorkout({
  trainingId,
  workoutName,
  workoutType,
  exerciseCount,
  isActive,
  onStarted,
}: Props) {
  const router = useRouter();
  const { hasPremiumAccess } = usePremiumAccess();

  const greetingName = useMemo(() => {
    const fullName = getUserNameFromStorage();
    const firstName = firstNameFromFullName(fullName);
    return prettyName(firstName);
  }, []);

  const emoji = useMemo(() => pickEmoji(), []);
  const ctaLabel = isActive ? "Continuar treino" : "Iniciar treino";
  const helperTitle = trainingId ? workoutName : "Crie um treino para comecar";
  const helperSubtitle = trainingId
    ? `${workoutType} • ${exerciseCount} exercicios`
    : "Monte seu primeiro treino e volte para acompanhar sua consistencia.";

  async function onStart() {
    if (isActive) {
      router.push("/workouts/active");
      return;
    }

    if (!trainingId) {
      router.push("/trainings");
      return;
    }

    await apiFetch(`/workouts/start/${trainingId}`, { method: "POST" });

    if (onStarted) onStarted();
    router.push("/workouts/active");
  }

  return (
    <CFSection className="card-hero hero-card-shell p-4 p-md-5 hero-animate hero-delay-1">
      <div className="hero-top-row">
        <div className="d-flex align-items-center gap-2 mb-2">
          <CFBadge className="badge-today">Hoje</CFBadge>
        </div>
      </div>

      <div className="hero-layout">
        <div className="hero-copy">
          <h2 className="hero-free-title">
            Ola, <span className="hero-free-name">{greetingName ?? "Atleta"}</span> {emoji}
          </h2>

          <p className="hero-free-subtitle">
            {isActive
              ? "Seu treino ainda esta aberto. Retome agora e mantenha o ritmo."
              : "Tudo pronto para mais uma sessao. Entre sabendo o que fazer e o que superar."}
          </p>

          <div className="hero-free-details">
            <div className="hero-free-detail">
              <div className="hero-free-detail-main">
                <div className="hero-free-detail-copy">
                  <span className="hero-free-detail-kicker">
                    <Dumbbell size={12} strokeWidth={2} />
                    Foco atual
                  </span>
                  <b>{helperTitle}</b>
                  <span>{helperSubtitle}</span>
                </div>
              </div>
            </div>

            <div className="hero-free-detail">
              <div className="hero-free-detail-main">
                <div className="hero-free-detail-copy">
                  <span className="hero-free-detail-kicker">
                    <CalendarDays size={12} strokeWidth={2} />
                    Proximo passo
                  </span>
                  <b>{isActive ? "Treino em andamento" : "Proxima acao"}</b>
                  <span>
                    {isActive
                      ? "Voltar para o treino ativo"
                      : trainingId
                      ? "Entrar, registrar e seguir sua meta semanal"
                      : "Criar um treino para desbloquear o painel completo"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-side-card">
            <div className="hero-side-kicker">
              {hasPremiumAccess ? <Crown size={14} /> : <Zap size={14} />}
              {hasPremiumAccess ? "Resumo premium" : "Resumo rapido"}
            </div>

            <div className="hero-side-grid">
              <div className="hero-side-stat">
                <span>Treino de hoje</span>
                <b>{trainingId ? workoutName : "Monte seu primeiro treino"}</b>
                <small>
                  {trainingId
                    ? helperSubtitle
                    : "Organize seu plano para liberar a proxima sessao."}
                </small>
              </div>

              <div className="hero-side-stat">
                <span>{hasPremiumAccess ? "Plano" : "Status"}</span>
                <b>
                  {hasPremiumAccess
                    ? "Premium ativo"
                    : isActive
                    ? "Em andamento"
                    : trainingId
                    ? `${exerciseCount} exercicios`
                    : "Painel inicial"}
                </b>
                <small>
                  {hasPremiumAccess
                    ? "IA Coach, planos e camada premium ja conectados ao seu acesso."
                    : isActive
                    ? "Seu treino ja comecou. Volte e registre o restante."
                    : trainingId
                    ? `${workoutType} pronto para execucao`
                    : "Crie um treino para comecar a medir sua consistencia."}
                </small>
              </div>
            </div>

            <div className="hero-side-actions">
              <CFButton onClick={onStart} className="d-inline-flex align-items-center gap-2">
                <Play size={15} />
                {ctaLabel}
              </CFButton>

              <CFButton
                type="button"
                variant="secondary"
                className="d-inline-flex align-items-center gap-2"
                onClick={() => router.push(hasPremiumAccess ? "/trainings/ai" : "/trainings")}
              >
                {hasPremiumAccess ? "Abrir IA Coach" : "Ver treinos"}
                <ArrowRight size={15} />
              </CFButton>
            </div>
          </div>
        </div>
      </div>
    </CFSection>
  );
}
