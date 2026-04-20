"use client";

import "./ai.css";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brain, LineChart, ShieldCheck, Sparkles, Route, Layers3, History, TimerReset } from "lucide-react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { apiFetch } from "@/lib/apiFetch";

type AiDraftExercise = {
  name: string;
  sets: number;
  reps: string;
  technique?: string;
  order: number;
  targetWeight?: number;
};

type AiTrainingDraft = {
  name: string;
  description?: string;
  exercises: AiDraftExercise[];
};

type AiUsageStatus = {
  monthKey: string;
  limit: number;
  used: number;
  remaining: number;
  blocked: boolean;
  lastGeneratedAt?: string | null;
};

type AiGenerateResponse = {
  draft: AiTrainingDraft;
  drafts?: AiTrainingDraft[];
  usage: AiUsageStatus;
  source: "gemini" | "fallback";
  meta?: {
    mode: AiGenerationMode;
    draftCount: number;
    expectedDraftCount: number;
    usedHistory: boolean;
    trainingsRead: number;
    sessionMinutes?: number | null;
    qualityGuardsApplied: boolean;
    coachLens: string;
    remainingAfterGeneration: number;
  };
};

type AiGenerationMode = "single" | "split" | "adjust";

type TrainingItem = {
  id?: string;
  _id?: string;
  name: string;
};

function formatMonthKey(monthKey?: string) {
  if (!monthKey) return "este mes";
  const [year, month] = monthKey.split("-");
  if (!year || !month) return "este mes";
  return `${month}/${year}`;
}

function formatGenerationCount(value: number) {
  return value === 1 ? "1 geracao" : `${value} geracoes`;
}

function formatLastGeneratedAt(value?: string | null) {
  if (!value) return "Ainda nao houve geracao neste ciclo.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ainda nao houve geracao neste ciclo.";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCoachInsight(
  mode: AiGenerationMode,
  draftCount: number,
  hasHistory: boolean,
  sessionMinutes?: number | null,
) {
  if (mode === "split") {
    return `O IA Coach organizou ${draftCount} treino(s) para distribuir melhor o estimulo da sua semana e transformar frequencia em progresso mais visivel.`;
  }

  if (mode === "adjust") {
    return hasHistory
      ? "O coach usou seu historico para ajustar a rota com mais contexto, sem parecer um recomeço do zero."
      : "O coach montou um ajuste mais seguro para voce sair de uma base simples para uma rotina mais coerente.";
  }

  if (sessionMinutes && sessionMinutes <= 45) {
    return "O coach enxugou a estrutura para caber no seu tempo sem perder a logica da sessao.";
  }

  return "O coach buscou uma sessao clara, treinavel e com leitura suficiente para voce executar com mais confianca.";
}

function getResultValueLine(
  mode: AiGenerationMode,
  draftCount: number,
  generationSource: "gemini" | "fallback" | null,
) {
  if (generationSource === "fallback") {
    return "Entrega segura do Corefit, pronta para salvar mesmo quando a resposta premium nao vier perfeita.";
  }

  if (mode === "split") {
    return `Pacote semanal com ${draftCount} treino(s) conectado(s), pensado para virar rotina real no app.`;
  }

  if (mode === "adjust") {
    return "Refino de rotina com leitura mais premium do seu momento atual.";
  }

  return "Treino pontual com mais contexto, menos chute e mais clareza de execucao.";
}

function getCoachNextStep(
  mode: AiGenerationMode,
  draftCount: number,
  remainingGenerations: number,
  hasHistory: boolean,
) {
  if (mode === "split") {
    return {
      title: "Proximo passo recomendado",
      copy:
        draftCount > 1
          ? "Salve esse pacote completo e rode pelo menos 7 dias antes de pedir um novo ajuste. Assim o IA Coach passa a ler resposta real, e nao so intencao."
          : "Salve a estrutura e complete sua semana com consistencia antes de abrir uma nova geracao.",
      badge:
        remainingGenerations > 0
          ? `${formatGenerationCount(remainingGenerations)} ainda disponiveis`
          : "Limite mensal usado",
    };
  }

  if (mode === "adjust") {
    return {
      title: "Ajuste com mais valor",
      copy: hasHistory
        ? "Teste esse refino em algumas sessoes e observe carga, conforto e aderencia. O melhor uso do IA Coach vem quando voce ajusta com base no que realmente sentiu no treino."
        : "Salve a nova base, execute algumas sessoes e volte com historico real. A partir dai o ajuste do IA Coach fica bem mais inteligente.",
      badge:
        remainingGenerations > 0
          ? "Use o proximo credito so depois de sentir a resposta do treino"
          : "Agora vale gerar de novo no proximo ciclo mensal",
    };
  }

  return {
    title: "Como tirar mais valor dessa entrega",
    copy:
      "Salve esse treino, execute de verdade e use a proxima geracao quando quiser abrir uma nova frente ou transformar a sessao em rotina completa. O valor cresce quando existe continuidade.",
    badge:
      remainingGenerations > 0
          ? `${formatGenerationCount(remainingGenerations)} prontas para quando fizer sentido`
        : "Seu ciclo do mes ja foi consumido",
  };
}

function getCoachPreview(
  mode: AiGenerationMode,
  goal: string,
  daysPerWeek: number,
  sessionMinutes: number,
  hasHistory: boolean,
  focus: string,
) {
  const focusLabel = focus?.trim() || "foco em leitura equilibrada";

  if (mode === "split") {
    return {
      eyebrow: "Leitura ao vivo do IA Coach",
      title: "A divisao deve nascer como rotina, nao como lista de exercicios.",
      copy: `Com ${daysPerWeek} dia(s) por semana, o IA Coach vai tentar distribuir melhor estimulo, recuperacao e foco em ${focusLabel}. A meta aqui e sair com uma semana treinavel e nao com blocos soltos.`,
      bullets: [
        "Pensando a semana inteira antes de pensar exercicio por exercicio.",
        hasHistory ? "Seu historico ajuda a evitar repeticao burra entre os dias." : "Sem historico ainda: a base sai mais segura e generalista.",
        `${sessionMinutes} min por sessao pede uma divisao realista para manter aderencia.`,
      ],
    };
  }

  if (mode === "adjust") {
    return {
      eyebrow: "Leitura ao vivo do IA Coach",
      title: "Ajustar bem costuma render mais do que recomecar do zero.",
      copy: hasHistory
        ? `O IA Coach vai ler o que voce ja faz hoje e tentar refinar sua rota com base em ${goal || "seu objetivo atual"}, respeitando ${sessionMinutes} min por sessao e foco em ${focusLabel}.`
        : `Como ainda nao existe uma base real salva, o IA Coach vai montar um ajuste mais conservador, olhando ${goal || "seu objetivo atual"} e foco em ${focusLabel}.`,
      bullets: [
        hasHistory ? "Leitura com continuidade: o treino novo tenta conversar com sua base atual." : "Sem continuidade ainda: o ajuste vira quase uma nova base.",
        "A ideia e corrigir rota, excesso ou desequilibrio sem perder usabilidade.",
        `${daysPerWeek} dia(s) por semana entram como limite real da decisao.`,
      ],
    };
  }

  return {
    eyebrow: "Leitura ao vivo do IA Coach",
    title: "Uma sessao boa nasce do contexto certo, nao do chute mais bonito.",
    copy: `O IA Coach vai montar uma sessao com foco em ${goal || "seu objetivo atual"}, olhando ${sessionMinutes} min disponiveis, ${daysPerWeek} dia(s) por semana e ${focusLabel} como direcao principal.`,
    bullets: [
      "Leitura de tempo real para a sessao caber no seu dia.",
      hasHistory ? "Seu historico ajuda a dar mais contexto para a escolha dos exercicios." : "Sem historico, a sessao sai mais universal e segura.",
      "O objetivo e salvar algo claro, treinavel e pronto para virar execucao.",
    ],
  };
}

function getResultPresentation(
  mode: AiGenerationMode,
  draftCount: number,
  generationSource: "gemini" | "fallback" | null,
) {
  if (mode === "split") {
    return {
      eyebrow: "Pacote entregue pelo IA Coach",
      title:
        draftCount > 1
          ? "Sua semana ganhou uma estrutura com leitura premium."
          : "Sua divisao saiu com base mais inteligente.",
      signature:
        generationSource === "gemini"
          ? "Pacote montado com leitura de semana, distribuicao de foco e coerencia entre sessoes."
          : "Pacote fechado com fallback seguro do Corefit para voce nao sair sem estrutura.",
    };
  }

  if (mode === "adjust") {
    return {
      eyebrow: "Refino entregue pelo IA Coach",
      title: "Seu proximo passo saiu mais calibrado.",
      signature:
        generationSource === "gemini"
          ? "Ajuste pensado para melhorar rota, aderencia e continuidade."
          : "Refino seguro entregue pelo Corefit para preservar consistencia da rotina.",
    };
  }

  return {
    eyebrow: "Treino entregue pelo IA Coach",
    title: "Sua sessao saiu com mais leitura do que impulso.",
    signature:
      generationSource === "gemini"
        ? "Sessao pensada para caber no seu contexto e virar execucao real."
        : "Sessao segura do Corefit, pronta para salvar quando a camada premium nao responder como deveria.",
  };
}

function getCoachVoiceInsight(
  mode: AiGenerationMode,
  draftCount: number,
  hasHistory: boolean,
  sessionMinutes?: number | null,
) {
  if (mode === "split") {
    return `O IA Coach organizou ${draftCount} treino(s) para distribuir melhor o estimulo da sua semana e transformar frequencia em progresso mais visivel.`;
  }

  if (mode === "adjust") {
    return hasHistory
      ? "O IA Coach leu seu historico para ajustar a rota com mais contexto, sem transformar seu treino em um recomeco do zero."
      : "O IA Coach montou um ajuste mais seguro para voce sair de uma base simples para uma rotina mais coerente.";
  }

  if (sessionMinutes && sessionMinutes <= 45) {
    return "O IA Coach enxugou a estrutura para caber no seu tempo sem perder a logica da sessao.";
  }

  return "O IA Coach buscou uma sessao clara, treinavel e com leitura suficiente para voce executar com mais confianca.";
}

export default function GenerateTrainingAiPage() {
  useRequireAuth();
  const { hasPremiumAccess } = usePremiumAccess();
  const [isHydrated, setIsHydrated] = useState(false);

  const [mode, setMode] = useState<AiGenerationMode>("single");
  const [goal, setGoal] = useState("hipertrofia");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [level, setLevel] = useState("intermediario");
  const [sessionMinutes, setSessionMinutes] = useState<number>(60);
  const [focus, setFocus] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [trainingIntent, setTrainingIntent] = useState("");
  const [splitPreference, setSplitPreference] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<AiTrainingDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [usage, setUsage] = useState<AiUsageStatus | null>(null);
  const [generationSource, setGenerationSource] = useState<"gemini" | "fallback" | null>(null);
  const [generationMeta, setGenerationMeta] = useState<AiGenerateResponse["meta"] | null>(null);
  const [hasExistingTrainings, setHasExistingTrainings] = useState(false);
  const [trainingsLoading, setTrainingsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  const canUsePremium = isHydrated && hasPremiumAccess;

  const normalizedDrafts = useMemo(() => {
    return drafts.map((draft) => ({
      ...draft,
      exercises: [...draft.exercises].sort((a, b) => a.order - b.order),
    }));
  }, [drafts]);

  const loadingMessages = useMemo(() => {
    if (mode === "split") {
      return [
        "O IA Coach esta desenhando a logica da sua semana.",
        "Distribuindo volume, foco e recuperacao entre os dias.",
        "Fechando um pacote de treinos com cara de rotina real.",
      ];
    }

    if (mode === "adjust") {
      return [
        "O IA Coach esta lendo sua rotina atual antes de ajustar.",
        "Buscando um proximo passo mais inteligente para o seu contexto.",
        "Refinando seu treino para evoluir sem perder coerencia.",
      ];
    }

    return [
      "O IA Coach esta montando sua proxima sessao com contexto.",
      "Equilibrando foco, tempo e nivel para algo realmente treinavel.",
      "Preparando uma estrutura clara para salvar e executar.",
    ];
  }, [mode]);

  const loadingTitle =
    mode === "split"
      ? "Montando sua divisao com IA Coach"
      : mode === "adjust"
        ? "Refinando sua rotina com IA Coach"
        : "Criando seu treino com IA Coach";

  const loadingSupport =
    mode === "split"
      ? "O IA Coach esta pensando como distribuir sua semana para voce sair com varios treinos conectados."
      : mode === "adjust"
        ? "O IA Coach esta lendo o que voce ja faz para ajustar melhor o proximo passo."
        : "O IA Coach esta organizando objetivo, tempo e foco para entregar uma sessao realmente util.";

  const loadingMicroHints = useMemo(() => {
    if (mode === "split") {
      return [
        "A ideia aqui nao e gerar texto. E fechar uma semana mais inteligente.",
        "Menos repeticao burra. Mais distribuicao de estimulo entre os dias.",
        "O pacote final ja sai pensado para salvar e usar no Corefit.",
      ];
    }

    if (mode === "adjust") {
      return [
        "Ajustar bem costuma valer mais do que recomecar do zero.",
        "O IA Coach tenta manter continuidade sem carregar excesso.",
        "Seu historico entra como contexto antes da decisao final.",
      ];
    }

    return [
      "Uma boa sessao nao precisa ser aleatoria para parecer intensa.",
      "O IA Coach cruza foco, nivel e tempo antes de montar a estrutura.",
      "A meta e sair daqui com algo claro para executar hoje.",
    ];
  }, [mode]);

  const smartQuestionLabel =
    mode === "single"
      ? "O que voce quer resolver nessa geracao?"
      : mode === "split"
        ? "Qual sensacao voce quer nessa divisao?"
        : "O que mais esta pedindo ajuste hoje?";

  const smartQuestionPlaceholder =
    mode === "single"
      ? "Ex: quero um treino forte para hoje, com foco em peito e triceps"
      : mode === "split"
        ? "Ex: quero uma rotina equilibrada, sem repeticao burra e com pernas bem distribuidas"
        : "Ex: quero tirar excesso de peito, encaixar mais costas e aliviar ombro";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUsage() {
      if (!canUsePremium) return;

      try {
        const response = await apiFetch<AiUsageStatus>("/ai/trainings/usage");
        if (!active) return;
        setUsage(response);
      } catch {
        if (!active) return;
        setUsage(null);
      }
    }

    void loadUsage();

    return () => {
      active = false;
    };
  }, [canUsePremium]);

  useEffect(() => {
    let active = true;

    async function loadTrainings() {
      try {
        const response = await apiFetch<TrainingItem[]>("/trainings");
        if (!active) return;
        setHasExistingTrainings(Array.isArray(response) && response.length > 0);
      } catch {
        if (!active) return;
        setHasExistingTrainings(false);
      } finally {
        if (!active) return;
        setTrainingsLoading(false);
      }
    }

    void loadTrainings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!generating) {
      setLoadingStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % loadingMessages.length);
    }, 1700);

    return () => window.clearInterval(interval);
  }, [generating, loadingMessages.length]);

  useEffect(() => {
    setTrainingIntent("");
    setSplitPreference("");
    setContextNotes("");
  }, [mode]);

  async function handleGenerate() {
    if (!canUsePremium) {
      setError("A geracao de treino com IA fica disponivel apenas no plano premium.");
      return;
    }

    setGenerating(true);
    setError(null);
    setStatusMessage(null);
    setDrafts([]);
    setGenerationMeta(null);

    try {
      const res = await apiFetch<AiGenerateResponse>("/ai/trainings/generate", {
        method: "POST",
        body: {
          mode,
          goal,
          daysPerWeek: Number(daysPerWeek),
          level,
          sessionMinutes: Number(sessionMinutes),
          focus: focus || undefined,
          restrictions: restrictions || undefined,
          trainingIntent: trainingIntent || undefined,
          splitPreference: splitPreference || undefined,
          contextNotes: contextNotes || undefined,
        },
      });

      const nextDrafts =
        Array.isArray(res.drafts) && res.drafts.length > 0
          ? res.drafts
          : res.draft
            ? [res.draft]
            : [];

      setDrafts(nextDrafts);
      setUsage(res.usage);
      setGenerationSource(res.source);
      setGenerationMeta(res.meta ?? null);
      setStatusMessage(
        nextDrafts.length > 1
          ? `Pacote pronto: ${nextDrafts.length} treinos gerados. Agora voce pode revisar e salvar tudo de uma vez.`
          : "Treino pronto. Revise a leitura do IA Coach e salve quando fizer sentido.",
      );
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar treino");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!normalizedDrafts.length || !canUsePremium) return;

    setSaving(true);
    setError(null);
    setStatusMessage("Salvando sua entrega no Corefit...");

    try {
      for (const draft of normalizedDrafts) {
        const created = await apiFetch<{ _id: string }>("/trainings", {
          method: "POST",
          body: {
            name: draft.name,
            description: draft.description,
          },
        });

        const trainingId = created?._id;
        if (!trainingId) {
          throw new Error("Nao consegui obter o ID do treino criado.");
        }

        for (const ex of draft.exercises) {
          await apiFetch(`/trainings/${trainingId}/exercises`, {
            method: "POST",
            body: {
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              technique: ex.technique,
              order: ex.order,
              targetWeight: ex.targetWeight,
            },
          });
        }
      }

      window.location.href = "/trainings";
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar treino");
      setStatusMessage(null);
    } finally {
      setSaving(false);
    }
  }

  function handleResetDraft() {
    setDrafts([]);
    setGenerationSource(null);
    setGenerationMeta(null);
    setError(null);
    setStatusMessage("Leitura limpa. Ajuste o contexto e gere novamente quando quiser.");
  }

  const modeCards = [
    {
      id: "single" as AiGenerationMode,
      title: "Treino avulso",
      subtitle: "Uma sessao precisa para resolver o que importa agora.",
      icon: <Sparkles size={16} />,
      disabled: false,
    },
    {
      id: "split" as AiGenerationMode,
      title: "Rotina completa",
      subtitle: "Pacote com varios treinos conectados para a semana.",
      icon: <Layers3 size={16} />,
      disabled: false,
    },
    {
      id: "adjust" as AiGenerationMode,
      title: "Ajustar rotina",
      subtitle: hasExistingTrainings
        ? "Le o que voce ja faz e refina o proximo passo."
        : trainingsLoading
          ? "Lendo sua base atual..."
          : "Disponivel quando voce ja tiver treinos salvos.",
      icon: <History size={16} />,
      disabled: !hasExistingTrainings,
    },
  ];

  const resultTitle =
    normalizedDrafts.length > 1 ? "Pacote premium de treinos IA Coach" : normalizedDrafts[0]?.name;
  const resultCoachInsight = getCoachVoiceInsight(
    mode,
    normalizedDrafts.length,
    hasExistingTrainings,
    generationMeta?.sessionMinutes ?? sessionMinutes,
  );
  const resultValueLine = getResultValueLine(mode, normalizedDrafts.length, generationSource);
  const coachNextStep = getCoachNextStep(
    mode,
    normalizedDrafts.length,
    usage?.remaining ?? generationMeta?.remainingAfterGeneration ?? 0,
    hasExistingTrainings,
  );
  const coachPreview = getCoachPreview(
    mode,
    goal,
    daysPerWeek,
    sessionMinutes,
    hasExistingTrainings,
    focus,
  );
  const resultPresentation = getResultPresentation(mode, normalizedDrafts.length, generationSource);
  const generateDisabledReason = !canUsePremium
    ? "Esse fluxo fica disponivel apenas no premium."
    : usage?.blocked
      ? "Seu limite mensal atual foi usado. Vale voltar no proximo ciclo ou salvar o que ja foi criado."
      : mode === "adjust" && !hasExistingTrainings
        ? "O modo ajustar rotina precisa de treinos salvos para a IA ler sua base."
        : "Quanto mais claro o contexto, melhor a geracao.";

  return (
    <main className="corefit-bg">
      {generating ? (
        <div className="ai-coach-overlay">
          <div className="ai-coach-overlay__backdrop" />
          <div className="ai-coach-overlay__panel hero-animate">
            <div className="ai-coach-overlay__logo">
              <Sparkles size={18} />
            </div>

            <div className="ai-coach-overlay__eyebrow">Corefit IA Coach</div>
            <div className="ai-coach-overlay__title">{loadingTitle}</div>
            <div className="ai-coach-overlay__support">{loadingSupport}</div>
            <div className="ai-coach-overlay__message">{loadingMessages[loadingStep]}</div>

            <div className="ai-coach-overlay__progress">
              <div
                className="ai-coach-overlay__progress-bar"
                style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
              />
            </div>

            <div className="ai-coach-overlay__steps">
              {[
                {
                  icon: <Brain size={14} />,
                  label: "Leitura do objetivo",
                },
                {
                  icon: <LineChart size={14} />,
                  label: mode === "split" ? "Montando divisao" : "Montando estrutura",
                },
                {
                  icon: <ShieldCheck size={14} />,
                  label: mode === "split" ? "Fechando pacote de treinos" : "Preparando versao final",
                },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={`ai-coach-overlay__step ${index <= loadingStep ? "is-active" : ""}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="ai-coach-overlay__hints">
              {loadingMicroHints.map((hint) => (
                <div key={hint} className="ai-coach-overlay__hint">
                  {hint}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="corefit-container ai-page">
        <section className="card-dark glow-green hero-animate hero-delay-1 ai-page__hero">
          <div className="ai-page__hero-grid">
            <div className="ai-page__hero-copy">
              <div className="ai-page__eyebrow">
                <Sparkles size={14} />
                IA Coach premium
              </div>

              <h1 className="ai-page__title">
                Seu proximo treino
                <br />
                pode nascer com contexto.
              </h1>

              <p className="ai-page__description">
                O IA Coach do Corefit transforma objetivo, frequencia, historico e intencao em uma estrutura
                treinavel. Menos chute. Mais leitura do seu momento.
              </p>

              <div className="ai-page__hero-badges">
                <span className="hero-pill">Fluxo premium</span>
                <span className="hero-pill">Historico aplicado</span>
                <span className="hero-pill">Estrutura pronta para salvar</span>
                {canUsePremium ? <span className="hero-pill">2 geracoes por mes nesta fase</span> : null}
              </div>
            </div>

            <div className="ai-page__hero-side">
              <div className="ai-page__hero-panel">
                <div className="ai-page__panel-title">Leitura rapida do IA Coach</div>

                {canUsePremium ? (
                  <div className="ai-page__hero-stats">
                    <div className="ai-page__stat-card">
                      <div className="ai-page__stat-label">Geracoes do mes</div>
                      <div className="ai-page__stat-value">{usage?.limit ?? 2}</div>
                      <div className="ai-page__stat-note">
                        Total liberado em {formatMonthKey(usage?.monthKey)}
                      </div>
                    </div>

                    <div className="ai-page__stat-card">
                      <div className="ai-page__stat-label">Creditos usados</div>
                      <div className="ai-page__stat-value">{usage?.used ?? 0}</div>
                      <div className="ai-page__stat-note">
                        Cada geracao usa 1 credito do IA Coach
                      </div>
                    </div>

                    <div className="ai-page__stat-card ai-page__stat-card--accent">
                      <div className="ai-page__stat-label">Geracoes restantes</div>
                      <div className="ai-page__stat-value">{usage?.remaining ?? 2}</div>
                      <div className="ai-page__stat-note">
                        {`${formatGenerationCount(usage?.remaining ?? 2)} restantes neste mes. Use com estrategia quando quiser evoluir com mais contexto.`}
                      </div>
                    </div>

                    <div className="ai-page__stat-card">
                      <div className="ai-page__stat-label">Ultima leitura</div>
                      <div className="ai-page__stat-value ai-page__stat-value--compact">
                        {usage?.lastGeneratedAt ? "Feita" : "Sem uso"}
                      </div>
                      <div className="ai-page__stat-note">
                        {formatLastGeneratedAt(usage?.lastGeneratedAt)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ai-page__hero-stats">
                    <div className="ai-page__stat-card ai-page__stat-card--accent">
                      <div className="ai-page__stat-label">Camada premium</div>
                      <div className="ai-page__stat-value">IA</div>
                      <div className="ai-page__stat-note">Geracao com contexto, historico e estrutura pronta</div>
                    </div>
                  </div>
                )}

                <div className="ai-page__hero-actions">
                  <Link href="/trainings" className="btn btn-soft">Voltar para treinos</Link>
                  {!canUsePremium ? (
                    <Link href="/planos?source=ai-gate" className="btn btn-green">Ver premium</Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {!canUsePremium ? (
            <div
              className="ai-page__premium-gate"
            >
              <div className="ai-page__premium-title">Camada premium do IA Coach</div>
              <div className="text-muted-soft" style={{ lineHeight: 1.8, fontSize: 13 }}>
                A geracao automatica do IA Coach faz parte da camada premium do Corefit. O plano free
                continua com criacao manual completa e historico operacional.
              </div>

              <div className="d-flex gap-2 flex-wrap mt-3">
                <Link href="/planos?source=ai-gate" className="btn btn-green">
                  Ver premium
                </Link>
                <Link href="/trainings" className="btn btn-soft">
                  Continuar no modo manual
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        {canUsePremium ? (
          <section className="ai-page__workspace hero-animate hero-delay-2">
            <div className="card-dark ai-page__workspace-main">
              <div className="ai-page__section-head">
                <div>
                  <div className="ai-page__section-eyebrow">Modo de geracao</div>
                  <h2 className="ai-page__section-title">Monte do seu jeito, com leitura de coach</h2>
                </div>
                <div className="ai-page__section-kicker">
                  {mode === "single" ? "Sessao unica" : mode === "split" ? "Pacote semanal" : "Refino contextual"}
                </div>
              </div>

            <div className="ai-page__live-preview">
              <div className="ai-page__live-preview-eyebrow">{coachPreview.eyebrow}</div>
              <div className="ai-page__live-preview-title">{coachPreview.title}</div>
              <div className="text-muted-soft ai-page__live-preview-copy">{coachPreview.copy}</div>

              <div className="ai-page__live-preview-grid">
                {coachPreview.bullets.map((item) => (
                  <div key={item} className="ai-page__live-preview-card">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-page__mode-grid">
              {modeCards.map((item) => {
                const active = mode === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ai-page__mode-card ${active ? "is-active" : ""}`}
                    onClick={() => setMode(item.id)}
                    disabled={item.disabled || generating || saving}
                  >
                    <div className="ai-page__mode-icon">{item.icon}</div>
                    <div className="ai-page__mode-copy">
                      <div className="ai-page__mode-title">{item.title}</div>
                      <div className="ai-page__mode-subtitle">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="ai-page__form-grid">
              <label className="ai-page__field">
                <div className="register-label ai-page__field-label">Objetivo (ex: hipertrofia, secar, voltar ao ritmo)</div>
                <input
                  className="input-dark"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={generating || saving}
                  placeholder="Ex: hipertrofia"
                />
              </label>

              <label className="ai-page__field">
                <div className="register-label ai-page__field-label">Dias por semana (quantos dias voce consegue manter)</div>
                <input
                  className="input-dark"
                  type="number"
                  min={2}
                  max={7}
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  disabled={generating || saving}
                />
              </label>

              <label className="ai-page__field">
                <div className="register-label ai-page__field-label">Nivel (ex: iniciante, intermediario, avancado)</div>
                <input
                  className="input-dark"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  disabled={generating || saving}
                  placeholder="Ex: intermediario"
                />
              </label>

              <label className="ai-page__field">
                <div className="register-label ai-page__field-label">Minutos por sessao (tempo real que voce tem)</div>
                <input
                  className="input-dark"
                  type="number"
                  min={20}
                  max={120}
                  value={sessionMinutes}
                  onChange={(e) => setSessionMinutes(Number(e.target.value))}
                  disabled={generating || saving}
                />
              </label>

              <label className="ai-page__field ai-page__field--full">
                <div className="register-label ai-page__field-label">
                  {mode === "split"
                    ? "Foco principal da divisao (ex: superior, posterior, peito)"
                    : "Foco (ex: peito, costas, gluteo)"}
                </div>
                <input
                  className="input-dark"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder={
                    mode === "split"
                      ? "Ex: superior, posterior, gluteos, peito..."
                      : "Ex: peito, costas, gluteos..."
                  }
                  disabled={generating || saving}
                />
              </label>

              <label className="ai-page__field ai-page__field--full">
                <div className="register-label ai-page__field-label">
                  {mode === "adjust"
                    ? "O que voce quer ajustar? (ex: menos peito, mais costas, aliviar ombro)"
                    : "Restricoes (ex: dor no ombro, evitar agachamento livre)"}
                </div>
                <input
                  className="input-dark"
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder={
                    mode === "adjust"
                      ? "Ex: quero trocar a divisao, focar mais em peito, aliviar ombro..."
                      : "Ex: dor no ombro, evitar agachamento livre..."
                  }
                  disabled={generating || saving}
                />
              </label>

              <label className="ai-page__field ai-page__field--full">
                <div className="register-label ai-page__field-label">{smartQuestionLabel}</div>
                <textarea
                  className="input-dark ai-page__textarea"
                  value={trainingIntent}
                  onChange={(e) => setTrainingIntent(e.target.value)}
                  placeholder={smartQuestionPlaceholder}
                  disabled={generating || saving}
                  rows={3}
                />
              </label>

              {mode === "split" ? (
                <label className="ai-page__field ai-page__field--full">
                  <div className="register-label ai-page__field-label">Preferencia de divisao (ex: push/pull/legs, superior/inferior)</div>
                  <input
                    className="input-dark"
                    value={splitPreference}
                    onChange={(e) => setSplitPreference(e.target.value)}
                    placeholder="Ex: push/pull/legs, superior/inferior, peito-costas-pernas-ombro..."
                    disabled={generating || saving}
                  />
                </label>
              ) : null}

              <label className="ai-page__field ai-page__field--full">
                <div className="register-label ai-page__field-label">Observacoes extras (o que ajuda o IA Coach a te entender melhor)</div>
                <textarea
                  className="input-dark ai-page__textarea"
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder={
                    mode === "adjust"
                      ? "Ex: treino atual ficou repetitivo, quero mais costas e menos volume em peito"
                      : "Ex: treino para academia simples, quero algo objetivo e facil de manter"
                  }
                  disabled={generating || saving}
                  rows={3}
                />
              </label>
            </div>

            <div className="ai-page__coach-brief">
              <div className="ai-page__coach-brief-icon">
                {mode === "single" ? <Sparkles size={16} /> : mode === "split" ? <Route size={16} /> : <TimerReset size={16} />}
              </div>
              <div>
              <div className="ai-page__coach-brief-title">
                {mode === "single"
                  ? "Modo atual: treino avulso"
                  : mode === "split"
                    ? "Modo atual: rotina completa"
                    : "Modo atual: ajustar rotina existente"}
              </div>
              <div className="text-muted-soft ai-page__coach-brief-copy">
                {mode === "single"
                  ? "A IA vai montar um treino unico para uma necessidade pontual."
                  : mode === "split"
                    ? "A IA vai pensar em uma estrutura semanal real, com varios treinos conectados."
                    : "A IA vai considerar que voce ja tem rotina e vai gerar uma versao mais contextual para evolucao."}
              </div>
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap mt-3">
              <button
                onClick={handleGenerate}
                disabled={
                  generating ||
                  saving ||
                  !canUsePremium ||
                  Boolean(usage?.blocked) ||
                  (mode === "adjust" && !hasExistingTrainings)
                }
                className="btn btn-green ai-page__primary-cta"
              >
                <span className="ai-page__primary-cta-icon">
                  <Brain size={16} />
                </span>
                <span>
                  {generating
                    ? "Gerando com IA Coach..."
                    : usage?.blocked
                      ? "Limite mensal atingido"
                      : "Gerar treino com IA Coach"}
                </span>
              </button>

              {normalizedDrafts.length > 0 ? (
                <button
                  type="button"
                  onClick={handleResetDraft}
                  disabled={generating || saving}
                  className="btn btn-soft"
                >
                  Limpar leitura atual
                </button>
              ) : null}
            </div>

            <div className="ai-page__helper-note">{generateDisabledReason}</div>
            {statusMessage ? <div className="ai-page__status-box">{statusMessage}</div> : null}
            {error ? <div className="ai-page__error-box">{error}</div> : null}
            </div>

            <aside className="card-dark ai-page__workspace-side">
              <div className="ai-page__section-eyebrow">Leitura premium</div>
              <div className="ai-page__side-title">O que o IA Coach considera antes de gerar</div>

              <div className="ai-page__side-stack">
                <div className="ai-page__side-card">
                  <div className="ai-page__side-card-title">Objetivo e frequencia</div>
                  <div className="text-muted-soft">A estrutura muda com a meta, dias disponiveis e tempo de sessao.</div>
                </div>
                <div className="ai-page__side-card">
                  <div className="ai-page__side-card-title">Historico recente</div>
                  <div className="text-muted-soft">
                    {hasExistingTrainings
                      ? "Sua base ja existe, entao o IA Coach tenta evitar repeticao burra."
                      : "Se for seu primeiro treino, ele monta uma base mais segura e clara."}
                  </div>
                </div>
                <div className="ai-page__side-card">
                  <div className="ai-page__side-card-title">Guardrails do Corefit</div>
                  <div className="text-muted-soft">A resposta passa por ajustes internos para manter leitura, volume e usabilidade.</div>
                </div>
                <div className="ai-page__side-card">
                  <div className="ai-page__side-card-title">Uso mais inteligente do credito</div>
                  <div className="text-muted-soft">
                    Melhor usar a proxima geracao depois de executar algo real, e nao so para iterar sem contexto.
                  </div>
                </div>
              </div>
            </aside>
          </section>
        ) : null}

        {normalizedDrafts.length > 0 && canUsePremium ? (
          <section className="card-dark hero-animate hero-delay-3 ai-page__result">
            <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
              <div>
                <div className="ai-page__section-eyebrow">{resultPresentation.eyebrow}</div>
                <div className="ai-page__result-title">
                  {resultPresentation.title}
                </div>
                <div className="ai-page__result-value">{resultValueLine}</div>
                <div className="ai-page__result-signature">{resultPresentation.signature}</div>

                {normalizedDrafts.length > 1 ? (
                  <div className="text-muted-soft ai-page__result-subtitle">
                    A IA montou {normalizedDrafts.length} treinos conectados para compor sua divisao semanal.
                  </div>
                ) : normalizedDrafts[0].description ? (
                  <div className="text-muted-soft ai-page__result-subtitle">
                    {normalizedDrafts[0].description}
                  </div>
                ) : null}
              </div>

              <button onClick={handleSave} disabled={saving || generating} className="btn btn-green">
                {saving
                  ? "Salvando..."
                  : normalizedDrafts.length > 1
                    ? "Salvar pacote de treinos"
                    : "Salvar treino"}
              </button>
            </div>

            {generationMeta ? (
              <div className={`ai-page__generation-meta ${generationSource === "fallback" ? "is-fallback" : ""}`}>
                <div className="ai-page__generation-meta-title">Leitura da geracao</div>

                <div className="d-flex gap-2 flex-wrap">
                  <span className="hero-pill">
                    {generationMeta.usedHistory
                      ? `Historico considerado (${generationMeta.trainingsRead})`
                      : "Primeira leitura da conta"}
                  </span>
                  <span className="hero-pill">
                    {generationMeta.expectedDraftCount > 1
                      ? `Pacote ${generationMeta.draftCount}/${generationMeta.expectedDraftCount}`
                      : "Sessao unica"}
                  </span>
                  {generationMeta.sessionMinutes ? (
                    <span className="hero-pill">{generationMeta.sessionMinutes} min por sessao</span>
                  ) : null}
                  <span className="hero-pill">
                    {generationSource === "gemini" ? "Fonte: Gemini" : "Fonte: Corefit fallback"}
                  </span>
                  <span className="hero-pill">
                    {formatGenerationCount(generationMeta.remainingAfterGeneration)} restantes
                  </span>
                </div>

                <div className="text-muted-soft ai-page__generation-meta-copy">
                  {generationSource === "gemini"
                    ? `O IA Coach gerou esse resultado pensando em ${generationMeta.coachLens}, com guardrails de qualidade aplicados antes da entrega.`
                    : "A Gemini nao respondeu de forma utilizavel nesse ciclo, entao o Corefit entregou uma versao segura e estruturada com fallback interno."}
                </div>
              </div>
            ) : null}

            <div className="ai-page__coach-insight">
              <div className="ai-page__coach-insight-title">Leitura do IA Coach sobre essa entrega</div>
              <div className="text-muted-soft ai-page__coach-insight-copy">{resultCoachInsight}</div>
            </div>

            <div className="ai-page__result-identity">
              <div className="ai-page__result-identity-card">
                <div className="ai-page__result-identity-label">Nome salvo</div>
                <div className="ai-page__result-identity-value">{resultTitle}</div>
              </div>

              <div className="ai-page__result-identity-card">
                <div className="ai-page__result-identity-label">Formato</div>
                <div className="ai-page__result-identity-value">
                  {normalizedDrafts.length > 1 ? `${normalizedDrafts.length} treinos conectados` : "Sessao unica pronta para salvar"}
                </div>
              </div>

              <div className="ai-page__result-identity-card">
                <div className="ai-page__result-identity-label">Leitura premium</div>
                <div className="ai-page__result-identity-value">
                  {generationSource === "gemini" ? "Gemini + guardrails Corefit" : "Fallback Corefit estruturado"}
                </div>
              </div>
            </div>

            <div className="ai-page__next-step">
              <div className="ai-page__next-step-head">
                <div>
                  <div className="ai-page__next-step-title">{coachNextStep.title}</div>
                  <div className="text-muted-soft ai-page__next-step-copy">{coachNextStep.copy}</div>
                </div>
                <span className="hero-pill ai-page__next-step-badge">{coachNextStep.badge}</span>
              </div>

              <div className="ai-page__next-step-grid">
                <div className="ai-page__next-step-card">
                  <div className="ai-page__next-step-card-label">Agora</div>
                  <div className="ai-page__next-step-card-copy">
                    {normalizedDrafts.length > 1
                      ? "Salvar o pacote e conectar a semana no app."
                      : "Salvar o treino e executar sem deixar esfriar."}
                  </div>
                </div>

                <div className="ai-page__next-step-card">
                  <div className="ai-page__next-step-card-label">Depois</div>
                  <div className="ai-page__next-step-card-copy">
                    {mode === "adjust"
                      ? "Observar resposta real do ajuste antes de pedir outro refino."
                      : "Voltar com historico real para o IA Coach ler progresso, nao so objetivo."}
                  </div>
                </div>

                <div className="ai-page__next-step-card">
                  <div className="ai-page__next-step-card-label">Uso premium</div>
                  <div className="ai-page__next-step-card-copy">
                    Cada geracao vira mais valiosa quando entra para destravar um novo passo, e nao so repetir tentativa.
                  </div>
                </div>
              </div>
            </div>

            <div className="ai-page__draft-grid">
              {normalizedDrafts.map((draft, draftIndex) => (
                <div key={`${draft.name}-${draftIndex}`} className="ai-page__draft-card">
                  <div className="ai-page__draft-head">
                    <div>
                      <div className="ai-page__draft-title">{draft.name}</div>

                      {draft.description ? <div className="text-muted-soft ai-page__draft-copy">{draft.description}</div> : null}
                    </div>
                    <span className="hero-pill">{draft.exercises.length} exercicios</span>
                  </div>

                  <div className="ai-page__exercise-list">
                    {draft.exercises.map((ex) => (
                      <div key={`${draft.name}-${ex.order}`} className="ai-page__exercise-card">
                        <div className="ai-page__exercise-top">
                          <div className="ai-page__exercise-index">{ex.order + 1}</div>
                          <div>
                            <div className="ai-page__exercise-name">{ex.name}</div>

                            <div className="text-muted-soft ai-page__exercise-meta">
                              {ex.sets} series | {ex.reps}
                            </div>
                          </div>
                        </div>

                        {ex.technique ? <div className="text-muted-soft ai-page__exercise-technique">{ex.technique}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
