"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { Dumbbell, Play } from "lucide-react";

import { CFCard } from "@/components/ui/CFCard";
import { CFButton } from "@/components/ui/CFButton";

type Training = {
  id?: string;
  _id?: string;
  name: string;
  type?: string;
  exercises?: any[];
};

type ActiveWorkout = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
};

export function WorkoutsList() {
  const router = useRouter();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // 1) Verifica se tem treino ativo
      try {
        const active = await apiFetch<ActiveWorkout | null>("/workouts/active");
        setHasActiveWorkout(!!(active?.id || active?._id));
      } catch {
        setHasActiveWorkout(false);
      }

      // 2) Carrega treinos disponíveis
      try {
        const data = await apiFetch<Training[]>("/trainings");
        setTrainings(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erro ao carregar treinos:", e);
        setTrainings([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const items = useMemo(() => {
    return trainings
      .map((t) => {
        const id = (t as any)?.id ?? (t as any)?._id ?? "";
        const exerciseCount = t.exercises?.length ?? 0;
        const subtitle = `${t.type ?? "Treino"} • ${exerciseCount} exercícios`;
        return { id, name: t.name, subtitle, raw: t, exerciseCount };
      })
      .filter((x) => !!x.id);
  }, [trainings]);

  async function onStart(training: Training) {
    const trainingId = (training as any)?.id ?? (training as any)?._id ?? "";
    if (!trainingId) {
      alert("Treino inválido (sem id).");
      return;
    }

    if (hasActiveWorkout) {
      alert("Você já possui um treino ativo. Vou te levar para ele.");
      router.push("/workouts/active");
      return;
    }

    try {
      setStartingId(trainingId);
      await apiFetch(`/workouts/start/${trainingId}`, { method: "POST" });
      router.push("/workouts/active");
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? "");
      if (msg.toLowerCase().includes("treino ativo")) {
        router.push("/workouts/active");
        return;
      }
      alert(msg || "Erro ao iniciar treino.");
    } finally {
      setStartingId(null);
    }
  }

  if (loading) {
    return (
      <CFCard style={{ padding: 16 }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <b>Seus treinos</b>
          <span className="text-muted-soft" style={{ fontSize: 12 }}>
            Carregando…
          </span>
        </div>

        <div className="d-flex flex-column gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                padding: "14px 14px",
              }}
            >
              <div
                style={{
                  height: 14,
                  width: "70%",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.08)",
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  height: 12,
                  width: "45%",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
          ))}
        </div>
      </CFCard>
    );
  }

  return (
    <CFCard style={{ padding: 16 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <b>Seus treinos</b>

        <Link
          href="/trainings"
          className="text-decoration-none"
          style={{ color: "#22c55e", fontWeight: 700, fontSize: 12 }}
        >
          Ver todos &gt;
        </Link>
      </div>

      {!items.length && (
        <div className="text-muted-soft">Você ainda não cadastrou treinos.</div>
      )}

      <div className="d-flex flex-column gap-2">
        {items.map((t) => {
          const isStarting = startingId === t.id;

          return (
            <div
              key={t.id}
              className="workout-row d-flex align-items-center justify-content-between"
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                padding: "12px 14px",
                transition: "all .15s ease",
              }}
            >
              {/* ESQUERDA */}
              <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                {/* ÍCONE */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(34,197,94,0.10)",
                    border: "1px solid rgba(34,197,94,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(34,197,94,0.95)",
                    flexShrink: 0,
                  }}
                  title="Treino"
                >
                  <Dumbbell size={18} />
                </div>

                {/* TEXTO */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      lineHeight: "16px",
                      color: "rgba(255,255,255,0.95)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 260,
                    }}
                  >
                    {t.name}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: "14px",
                      color: "rgba(255,255,255,0.55)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 260,
                      marginTop: 2,
                    }}
                  >
                    {t.subtitle}
                  </div>
                </div>
              </div>

              {/* PLAY */}
              <CFButton
                variant="soft"
                onClick={() => onStart(t.raw)}
                disabled={isStarting}
                title="Iniciar treino"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isStarting
                    ? "1px solid rgba(255,255,255,0.10)"
                    : "1px solid rgba(34,197,94,0.30)",
                  background: isStarting
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(34,197,94,0.16)",
                  opacity: isStarting ? 0.7 : 1,
                }}
              >
                {isStarting ? (
                  <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 800 }}>
                    …
                  </span>
                ) : (
                  <Play
                    size={18}
                    color="rgba(34,197,94,0.95)"
                    fill="rgba(34,197,94,0.95)"
                  />
                )}
              </CFButton>
            </div>
          );
        })}
      </div>
    </CFCard>
  );
}