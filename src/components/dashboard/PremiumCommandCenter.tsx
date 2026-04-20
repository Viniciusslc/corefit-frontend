"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Crown, Dumbbell, Sparkles, TrendingUp, Trophy, Zap } from "lucide-react";

import { apiFetch } from "@/lib/apiFetch";

type PerformedSet = {
  reps?: number;
  weight?: number;
};

type PerformedExercise = {
  exerciseName?: string;
  order?: number | string;
  targetWeight?: number;
  setsPerformed?: PerformedSet[];
};

type WorkoutApiItem = {
  id?: string;
  _id?: string;
  status?: "active" | "finished";
  startedAt?: string;
  finishedAt?: string;
  endedAt?: string;
  trainingName?: string;
  performedExercises?: PerformedExercise[];
};

type Training = {
  id?: string;
  _id?: string;
  name: string;
};

type PremiumViewModel = {
  score: number;
  volume30d: number;
  volumeGrowthPct: number;
  sessions30d: number;
  prsThisWeek: number;
  topExercise: string;
  topTraining: string;
  averageSessionVolume: number;
  averageSessionDurationMin: number;
  labels7d: string[];
  values7d: number[];
  recommendationTitle: string;
  recommendationBody: string;
};

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dayKey(dateValue: string | number | Date) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatCompactKg(value: number) {
  return `${Math.round(value).toLocaleString("pt-BR")} kg`;
}

function buildLinePath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  const max = Math.max(1, ...values);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * (height - 16) - 8;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number) {
  const line = buildLinePath(values, width, height);
  return line ? `${line} L ${width} ${height} L 0 ${height} Z` : "";
}

function computeWorkoutVolume(exercises?: PerformedExercise[]) {
  let total = 0;
  for (const exercise of exercises ?? []) {
    for (const set of exercise.setsPerformed ?? []) {
      total += safeNumber(set.reps) * safeNumber(set.weight);
    }
  }
  return Math.round(total);
}

function computeDurationMinutes(workout: WorkoutApiItem) {
  const start = workout.startedAt ? new Date(workout.startedAt).getTime() : 0;
  const endValue = workout.finishedAt ?? workout.endedAt;
  const end = endValue ? new Date(endValue).getTime() : 0;
  if (!start || !end || end <= start) return 0;
  return Math.round((end - start) / 60000);
}

function buildRecommendation(
  volumeGrowthPct: number,
  prsThisWeek: number,
  sessions30d: number,
  averageSessionVolume: number,
): Pick<PremiumViewModel, "recommendationTitle" | "recommendationBody"> {
  if (prsThisWeek >= 2) {
    return {
      recommendationTitle: "Semana com sinal claro de progresso",
      recommendationBody:
        "Voce bateu PRs recentes. Vale manter a estrutura atual e usar a IA para ajustar detalhes, nao para trocar tudo.",
    };
  }

  if (volumeGrowthPct > 12) {
    return {
      recommendationTitle: "Volume subindo bem",
      recommendationBody:
        "Seu volume cresceu nos ultimos 30 dias. O melhor movimento agora e proteger consistencia e evitar mudar o plano cedo demais.",
    };
  }

  if (sessions30d < 6) {
    return {
      recommendationTitle: "Gargalo atual e frequencia",
      recommendationBody:
        "Antes de buscar complexidade, vale estabilizar mais sessoes no mes. O premium ajuda a enxergar isso mais rapido.",
    };
  }

  return {
    recommendationTitle: "Base pronta para refino",
    recommendationBody: `Seu volume medio por sessao esta em ${formatCompactKg(
      averageSessionVolume,
    )}. Agora o ganho premium vem de comparar melhor e decidir com mais contexto.`,
  };
}

export function PremiumCommandCenter() {
  const [loading, setLoading] = useState(true);
  const [vm, setVm] = useState<PremiumViewModel | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const [workoutsRaw, trainingsRaw] = await Promise.all([
          apiFetch<WorkoutApiItem[] | { items: WorkoutApiItem[] }>("/workouts"),
          apiFetch<Training[]>("/trainings").catch(() => [] as Training[]),
        ]);

        const workouts = Array.isArray(workoutsRaw)
          ? workoutsRaw
          : Array.isArray((workoutsRaw as { items?: WorkoutApiItem[] })?.items)
          ? ((workoutsRaw as { items: WorkoutApiItem[] }).items ?? [])
          : [];

        const finished = workouts
          .filter((workout) => workout.status === "finished" || workout.finishedAt || workout.endedAt)
          .map((workout) => {
            const finishedAt = workout.finishedAt ?? workout.endedAt ?? workout.startedAt ?? null;
            return {
              ...workout,
              finishedAt,
              volume: computeWorkoutVolume(workout.performedExercises),
              duration: computeDurationMinutes(workout),
            };
          })
          .filter((workout) => workout.finishedAt)
          .sort((a, b) => new Date(b.finishedAt as string).getTime() - new Date(a.finishedAt as string).getTime());

        const now = Date.now();
        const dayMs = 86400000;
        const last30d = finished.filter(
          (workout) => new Date(workout.finishedAt as string).getTime() >= now - dayMs * 30,
        );
        const prev30d = finished.filter((workout) => {
          const time = new Date(workout.finishedAt as string).getTime();
          return time < now - dayMs * 30 && time >= now - dayMs * 60;
        });

        const volume30d = last30d.reduce((total, workout) => total + workout.volume, 0);
        const prevVolume30d = prev30d.reduce((total, workout) => total + workout.volume, 0);
        const volumeGrowthPct =
          prevVolume30d > 0 ? ((volume30d - prevVolume30d) / prevVolume30d) * 100 : volume30d > 0 ? 100 : 0;
        const sessions30d = last30d.length;
        const averageSessionVolume = sessions30d > 0 ? volume30d / sessions30d : 0;
        const averageSessionDurationMin =
          sessions30d > 0
            ? Math.round(last30d.reduce((total, workout) => total + workout.duration, 0) / sessions30d)
            : 0;

        const dayLabels: string[] = [];
        const dayValues: number[] = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
          const ref = new Date(now - dayMs * offset);
          const key = dayKey(ref);
          const total = finished
            .filter((workout) => dayKey(workout.finishedAt as string) === key)
            .reduce((sum, workout) => sum + workout.volume, 0);
          dayLabels.push(
            ref.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }).replace("/", "-"),
          );
          dayValues.push(total);
        }

        const exerciseFrequency = new Map<string, number>();
        const trainingFrequency = new Map<string, number>();
        const previousMaxByExercise = new Map<string, number>();
        let prsThisWeek = 0;
        const weekStart = now - dayMs * 7;

        const oldestFirst = [...finished].reverse();
        for (const workout of oldestFirst) {
          const workoutTime = new Date(workout.finishedAt as string).getTime();
          const localSeenThisWorkout = new Set<string>();

          for (const exercise of workout.performedExercises ?? []) {
            const name = String(exercise.exerciseName ?? "").trim();
            if (!name) continue;

            exerciseFrequency.set(name, (exerciseFrequency.get(name) ?? 0) + 1);

            const currentMax = Math.max(
              0,
              ...(exercise.setsPerformed ?? []).map((set) => safeNumber(set.weight)),
            );

            const previousMax = previousMaxByExercise.get(name) ?? 0;
            if (workoutTime >= weekStart && currentMax > previousMax && !localSeenThisWorkout.has(name)) {
              prsThisWeek += 1;
              localSeenThisWorkout.add(name);
            }

            if (currentMax > previousMax) {
              previousMaxByExercise.set(name, currentMax);
            }
          }

          const trainingName = String(workout.trainingName ?? "").trim();
          if (trainingName) {
            trainingFrequency.set(trainingName, (trainingFrequency.get(trainingName) ?? 0) + 1);
          }
        }

        const topExercise =
          [...exerciseFrequency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Sem dados suficientes";

        const topTraining =
          [...trainingFrequency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
          trainingsRaw?.[0]?.name ||
          "Sem treino dominante";

        const activeDays14 = new Set(
          finished
            .filter((workout) => new Date(workout.finishedAt as string).getTime() >= now - dayMs * 14)
            .map((workout) => dayKey(workout.finishedAt as string)),
        ).size;

        const score = Math.round(
          Math.max(
            0,
            Math.min(
              100,
              activeDays14 * 4 + Math.min(40, sessions30d * 3) + Math.min(20, prsThisWeek * 4),
            ),
          ),
        );

        const recommendation = buildRecommendation(
          volumeGrowthPct,
          prsThisWeek,
          sessions30d,
          averageSessionVolume,
        );

        if (!mounted) return;

        setVm({
          score,
          volume30d,
          volumeGrowthPct,
          sessions30d,
          prsThisWeek,
          topExercise,
          topTraining,
          averageSessionVolume,
          averageSessionDurationMin,
          labels7d: dayLabels,
          values7d: dayValues,
          recommendationTitle: recommendation.recommendationTitle,
          recommendationBody: recommendation.recommendationBody,
        });
      } catch {
        if (!mounted) return;
        setVm({
          score: 0,
          volume30d: 0,
          volumeGrowthPct: 0,
          sessions30d: 0,
          prsThisWeek: 0,
          topExercise: "Sem dados suficientes",
          topTraining: "Sem treino dominante",
          averageSessionVolume: 0,
          averageSessionDurationMin: 0,
          labels7d: ["--", "--", "--", "--", "--", "--", "--"],
          values7d: [0, 0, 0, 0, 0, 0, 0],
          recommendationTitle: "Camada premium pronta",
          recommendationBody:
            "Assim que voce acumular mais sessoes, essa leitura premium vai ganhar mais densidade automaticamente.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const linePath = useMemo(() => buildLinePath(vm?.values7d ?? [], 420, 180), [vm]);
  const areaPath = useMemo(() => buildAreaPath(vm?.values7d ?? [], 420, 180), [vm]);

  if (loading) {
    return (
      <section className="premium-command-center premium-command-center--loading">
        <div className="premium-command-head">
          <div>
            <div className="premium-command-kicker">Premium layer</div>
            <h2 className="premium-command-title">Carregando leitura premium...</h2>
          </div>
        </div>
      </section>
    );
  }

  if (!vm) return null;

  return (
    <section className="premium-command-center">
      <div className="premium-command-head">
        <div>
          <div className="premium-command-kicker">
            <Crown size={14} />
            Dashboard premium
          </div>
          <h2 className="premium-command-title">Leitura avancada do seu treino, nao so o registro.</h2>
          <p className="premium-command-subtitle">
            Essa camada existe para transformar historico em contexto, tendencia e decisao melhor.
          </p>
        </div>

        <Link href="/trainings/ai" className="premium-command-link">
          Abrir IA Coach
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="premium-command-grid">
        <div className="premium-score-card">
          <div className="premium-score-ring">
            <div className="premium-score-ring-inner">
              <span>{vm.score}</span>
              <small>score</small>
            </div>
          </div>

          <div className="premium-score-copy">
            <div className="premium-mini-kicker">Leitura 7 dias</div>
            <h3>Consistencia com contexto</h3>
            <p>
              Volume recente, frequencia e PRs ja estao virando leitura premium em uma mesma camada.
            </p>
          </div>
        </div>

        <div className="premium-graph-card">
          <div className="premium-graph-head">
            <div>
              <div className="premium-mini-kicker">Atividade recente</div>
              <h3>Volume dos ultimos 7 dias</h3>
            </div>
            <div className="premium-graph-metric">
              <b>{formatCompactKg(vm.volume30d)}</b>
              <span>30 dias</span>
            </div>
          </div>

          <div className="premium-graph-shell">
            <svg viewBox="0 0 420 180" className="premium-graph-svg">
              <defs>
                <linearGradient id="premiumArea" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(74,222,128,0.26)" />
                  <stop offset="100%" stopColor="rgba(74,222,128,0)" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3].map((index) => {
                const y = 20 + index * 38;
                return (
                  <line
                    key={index}
                    x1="0"
                    y1={y}
                    x2="420"
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="6 8"
                  />
                );
              })}

              <path d={areaPath} fill="url(#premiumArea)" />
              <path d={linePath} fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
            </svg>

            <div className="premium-graph-labels">
              {vm.labels7d.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="premium-metric-list">
          <PremiumMiniStat
            icon={<TrendingUp size={15} />}
            label="Volume 30d"
            value={formatCompactKg(vm.volume30d)}
            helper={`${vm.volumeGrowthPct >= 0 ? "+" : ""}${vm.volumeGrowthPct.toFixed(0)}% vs periodo anterior`}
          />
          <PremiumMiniStat
            icon={<Dumbbell size={15} />}
            label="Sessoes"
            value={String(vm.sessions30d)}
            helper="treinos concluidos em 30 dias"
          />
          <PremiumMiniStat
            icon={<Trophy size={15} />}
            label="PRs / semana"
            value={String(vm.prsThisWeek)}
            helper="quebras de recorde detectadas"
          />
          <PremiumMiniStat
            icon={<Sparkles size={15} />}
            label="Sessao media"
            value={formatCompactKg(vm.averageSessionVolume)}
            helper={`${vm.averageSessionDurationMin} min por sessao`}
          />
        </div>

        <div className="premium-insight-card">
          <div className="premium-mini-kicker">Insight do coach</div>
          <h3>{vm.recommendationTitle}</h3>
          <p>{vm.recommendationBody}</p>
          <div className="premium-insight-tags">
            <span>Exercicio lider: {vm.topExercise}</span>
            <span>Treino dominante: {vm.topTraining}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PremiumMiniStat({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="premium-mini-stat">
      <div className="premium-mini-stat-top">
        <span className="premium-mini-stat-icon">{icon}</span>
        <span className="premium-mini-kicker">{label}</span>
      </div>
      <b>{value}</b>
      <small>{helper}</small>
    </div>
  );
}
