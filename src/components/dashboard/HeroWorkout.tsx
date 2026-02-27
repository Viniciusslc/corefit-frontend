"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

import { CFCard } from "@/components/ui/CFCard";
import { CFButton } from "@/components/ui/CFButton";

type Props = {
  trainingId?: string;
  workoutName: string;
  workoutType: string;
  exerciseCount: number;
  isActive: boolean;
  onStarted?: () => void;
};

/* =========================
   Helpers (JWT -> user name)
========================= */
function decodeJwtPayload(token: string): any | null {
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
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(json);
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
  return email ? email : null;
}

function firstNameFromFullName(full: string | null): string | null {
  if (!full) return null;
  const cleaned = full.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;
  return cleaned.split(" ")[0] ?? null;
}

function prettyName(first: string | null): string | null {
  if (!first) return null;

  const lowered = first.toLowerCase();
  if (lowered === "usuário" || lowered === "usuario") return "Atleta";

  return first.charAt(0).toUpperCase() + first.slice(1);
}

function pickEmoji() {
  const emojis = ["😁", "💪", "🔥", "🚀", "🏋️‍♂️", "😎", "⚡", "🥇", "👊", "🤝"];
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

  const greetingName = useMemo(() => {
    const full = getUserNameFromStorage();
    const first = firstNameFromFullName(full);
    return prettyName(first);
  }, []);

  const emoji = useMemo(() => pickEmoji(), []);

  async function onStart() {
    if (isActive) {
      router.push("/workouts/active");
      return;
    }

    if (!trainingId) {
      alert("Nenhum treino selecionado para iniciar.");
      return;
    }

    await apiFetch(`/workouts/start/${trainingId}`, { method: "POST" });

    if (onStarted) onStarted();
    else router.push("/workouts/active");
  }

  return (
    <CFCard
      className="card-hero p-4 p-md-5 hero-animate hero-delay-1"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="d-flex align-items-center gap-2 mb-2">
        <span className="badge badge-today">HOJE</span>
      </div>

      <h2 className="h3 fw-bold mb-1">
        Olá,{" "}
        <span style={{ color: "var(--cf-green)" }}>
          {greetingName ?? "Atleta"}
        </span>{" "}
        {emoji} Pronto para mais um treino?
      </h2>

      <div className="text-muted-soft">
        <b>{workoutType}</b> • {workoutName} • {exerciseCount} exercícios
      </div>

      <div className="mt-3" style={{ position: "relative", zIndex: 2 }}>
        <CFButton onClick={onStart}>
          ▶ Iniciar treino
        </CFButton>
      </div>
    </CFCard>
  );
}