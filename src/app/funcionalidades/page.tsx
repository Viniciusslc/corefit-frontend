"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Dumbbell,
  Gauge,
  History,
  PlayCircle,
  TimerReset,
} from "lucide-react";

const sectionShell = "mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-10";
const surfaceClass =
  "rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,16,15,0.96)_0%,rgba(8,9,9,0.96)_100%)] shadow-[0_22px_80px_rgba(0,0,0,0.38)]";

const sectionReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

const staggerGrid = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemReveal = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

const featureSpotlights = [
  {
    icon: ClipboardList,
    eyebrow: "Planejamento",
    title: "Treinos organizados",
    description:
      "Monte sessoes com exercicios, series, faixa de reps e alvo de carga sem perder clareza antes de comecar a semana.",
    bullets: ["Estrutura por sessao", "Meta por exercicio", "Ordem pronta para executar"],
    previewTitle: "Treino B montado",
    previewRows: [
      { label: "Agachamento livre", meta: "4x 6-8", value: "85kg" },
      { label: "Leg press", meta: "4x 10", value: "240kg" },
      { label: "Mesa flexora", meta: "3x 12", value: "controle" },
    ],
  },
  {
    icon: PlayCircle,
    eyebrow: "Execucao",
    title: "Registro em tempo real",
    description:
      "Atualize reps e carga durante o treino com fluxo rapido, visual limpo e menos atrito no meio da sessao.",
    bullets: ["Ajuste rapido", "Progresso visivel", "Ritmo mantido na sessao"],
    previewTitle: "Supino reto",
    previewRows: [
      { label: "Serie 1", meta: "10 reps", value: "ok" },
      { label: "Serie 2", meta: "9 reps", value: "+2,5kg" },
      { label: "Serie 3", meta: "8 reps", value: "em linha" },
    ],
  },
  {
    icon: History,
    eyebrow: "Historico",
    title: "Historico inteligente",
    description:
      "Tudo que voce faz vira contexto para o proximo treino, com comparacao clara entre sessoes e leitura rapida do que mudou.",
    bullets: ["Linha do tempo", "Comparacao entre sessoes", "Contexto acumulado"],
    previewTitle: "Ultima comparacao",
    previewRows: [
      { label: "Carga principal", meta: "72,5kg", value: "+5kg" },
      { label: "Volume total", meta: "14.8t", value: "+8%" },
      { label: "Ritmo da semana", meta: "3/4", value: "mantido" },
    ],
  },
  {
    icon: Gauge,
    eyebrow: "Performance",
    title: "Metricas que fazem sentido",
    description:
      "Carga, volume e consistencia aparecem de forma visual para orientar o proximo ajuste e deixar o progresso escaneavel.",
    bullets: ["Tendencia de progresso", "Melhora acumulada", "Leitura objetiva"],
    previewTitle: "Tendencia semanal",
    previewRows: [
      { label: "sem 1", meta: "12.6t", value: "base" },
      { label: "sem 2", meta: "14.1t", value: "+12%" },
      { label: "sem 3", meta: "15.4t", value: "+9%" },
    ],
  },
];

const productSignals = [
  { label: "volume semanal", value: "18.4t", accent: "+12%" },
  { label: "ritmo mantido", value: "92%", accent: "ultimos 30 dias" },
  { label: "sessoes registradas", value: "128", accent: "historico vivo" },
];

const executionCards = [
  { title: "Supino reto", subtitle: "4x 8-10", state: "+2,5kg" },
  { title: "Supino inclinado", subtitle: "3x 10", state: "igualado" },
  { title: "Triceps corda", subtitle: "3x 12", state: "+2 reps" },
];

const previewBars = [
  { label: "sem 1", height: "h-16" },
  { label: "sem 2", height: "h-24" },
  { label: "sem 3", height: "h-28" },
  { label: "sem 4", height: "h-36" },
  { label: "sem 5", height: "h-44" },
];

const workflow = [
  {
    step: "01",
    title: "Planeje com clareza",
    text: "Organize treinos do seu jeito e ja entre na semana com estrutura pronta para executar.",
  },
  {
    step: "02",
    title: "Registre sem quebrar o ritmo",
    text: "Durante a sessao, ajuste reps e carga com rapidez para manter o foco no treino.",
  },
  {
    step: "03",
    title: "Veja o progresso aparecer",
    text: "O que antes era sensacao vira leitura concreta para orientar o proximo passo.",
  },
];

export default function FuncionalidadesPage() {
  return (
    <main className="relative isolate overflow-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 -z-20">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-landing.png')",
            backgroundPosition: "center top",
            filter: "brightness(0.28) contrast(1.05) saturate(1.02)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(34,197,94,0.18),transparent_16%),radial-gradient(circle_at_76%_14%,rgba(34,197,94,0.14),transparent_22%),linear-gradient(180deg,rgba(4,4,4,0.78)_0%,rgba(4,4,4,0.72)_26%,rgba(4,4,4,0.94)_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:120px_120px]" />
      </div>

      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionReveal}
        className="relative z-10 border-b border-white/6"
      >
        <div className={`${sectionShell} pb-20 pt-32 sm:pt-36 xl:pt-40`}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:items-center xl:gap-12">
            <div className="max-w-[42rem]">
              <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-green-300">
                Produto, leitura, evolucao
              </div>

              <h1 className="mt-7 max-w-[10ch] text-[3.15rem] font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-[4.3rem] xl:text-[5.15rem]">
                Evolucao nao e sorte.
                <br />
                <span className="text-green-400">E sistema.</span>
              </h1>

              <p className="mt-7 max-w-[38rem] text-[1.02rem] leading-8 text-zinc-300 sm:text-[1.06rem]">
                O Corefit transforma treino em dados, consistencia em progresso e
                disciplina em resultado real. Cada tela foi pensada para reduzir
                atrito, manter contexto e mostrar o que realmente mudou.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center rounded-[1.45rem] bg-green-500 px-7 py-4 text-base font-semibold text-black shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 hover:shadow-green-500/40 active:scale-[0.985]"
                >
                  Criar minha conta gratis
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-[1.45rem] border border-white/14 bg-white/[0.04] px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-white/22 hover:bg-white/[0.07] active:scale-[0.985]"
                >
                  Entrar e continuar treinando
                </Link>
              </div>

              <motion.div
                variants={staggerGrid}
                initial="hidden"
                animate="visible"
                className="mt-10 grid max-w-[40rem] gap-4 sm:grid-cols-3"
              >
                {productSignals.map((signal) => (
                  <motion.div
                    key={signal.label}
                    variants={itemReveal}
                    whileHover={{ y: -4, scale: 1.018 }}
                    className="rounded-[1.55rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-5 shadow-xl shadow-black/40 transition-all duration-300 hover:border-white/20 hover:bg-[linear-gradient(180deg,rgba(34,197,94,0.06),rgba(255,255,255,0.02))]"
                  >
                    <div className="flex items-end justify-between gap-3">
                      <div className="text-[1.95rem] font-black tracking-[-0.05em] text-white">
                        {signal.value}
                      </div>
                      <div className="text-xs font-semibold text-green-300">
                        {signal.accent}
                      </div>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-zinc-400">
                      {signal.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 42 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.68, ease: "easeOut", delay: 0.12 }}
              className="relative"
            >
              <motion.div
                className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-green-500/10 blur-[90px]"
                animate={{ opacity: [0.28, 0.48, 0.28], scale: [1, 1.06, 1] }}
                transition={{ duration: 7.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-green-500/10 blur-[110px]"
                animate={{ opacity: [0.24, 0.42, 0.24], scale: [1, 1.05, 1] }}
                transition={{ duration: 8.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.8 }}
              />

              <motion.div
                whileHover={{ y: -5, scale: 1.006 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`relative overflow-hidden p-5 sm:p-6 ${surfaceClass}`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[24rem]">
                    <div className="inline-flex items-center rounded-full border border-green-500/18 bg-green-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                      Funcionalidades em tela
                    </div>
                    <h2 className="mt-4 text-[1.55rem] font-bold tracking-[-0.04em] text-white sm:text-[1.75rem]">
                      Execucao, historico e evolucao na mesma tela
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      O preview agora mostra o que importa de verdade: treino em
                      andamento, comparacao com a ultima sessao e leitura semanal.
                    </p>
                  </div>

                  <div className="rounded-[1.35rem] border border-green-500/20 bg-green-500/10 px-4 py-3 text-right">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-green-300">
                      Meta
                    </div>
                    <div className="mt-1 text-2xl font-black tracking-[-0.05em] text-white">
                      +3%
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-300">Treino em execucao</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                          peito + triceps
                        </p>
                      </div>

                      <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                        Ativo
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {executionCards.map((card) => (
                        <motion.div
                          key={card.title}
                          whileHover={{ x: 4, scale: 1.01 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="rounded-[1.3rem] border border-white/8 bg-black/24 px-4 py-3 transition-all duration-300 hover:border-white/16 hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{card.title}</div>
                              <div className="mt-1 text-xs text-zinc-500">{card.subtitle}</div>
                            </div>

                            <span className="text-xs font-semibold text-green-300">
                              {card.state}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-5">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        Historico + evolucao
                      </div>
                      <div className="mt-4 rounded-[1.2rem] border border-white/8 bg-black/24 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">
                              Ultima sessao
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              volume 14.8t
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-green-300">
                            +8%
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-end gap-3">
                        {previewBars.map((bar) => (
                          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                            <div
                              className={`w-full rounded-t-[1rem] rounded-b-md bg-[linear-gradient(180deg,rgba(74,222,128,0.96),rgba(22,163,74,0.28))] ${bar.height}`}
                            />
                            <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              {bar.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-green-500/10 p-3 text-green-300">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-white">
                            Veja o que melhorou sem adivinhar
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            Voce compara execucao, contexto e tendencia da semana sem
                            abrir cinco telas diferentes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.35rem] border border-green-500/14 bg-[linear-gradient(90deg,rgba(8,28,13,0.86),rgba(14,48,22,0.66),rgba(8,28,13,0.86))] px-4 py-4 text-sm leading-6 text-zinc-100">
                  Voce ve execucao, contexto e evolucao na mesma tela.
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionReveal}
        className="relative z-10"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.04)_0%,rgba(4,4,4,0.1)_48%,rgba(4,4,4,0.16)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="mx-auto max-w-[56rem] text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
              Funcionalidades principais
            </div>
            <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
              Cada bloco resolve uma parte real do treino.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Depois da primeira dobra, a pagina deixa de repetir a home e passa a
              mostrar areas especificas do produto com mini-previews proprios.
            </p>
          </div>

          <motion.div
            variants={staggerGrid}
            className="mt-14 grid gap-6 xl:grid-cols-2"
          >
            {featureSpotlights.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.title}
                  variants={itemReveal}
                  whileHover={{ y: -6, scale: 1.016 }}
                  className={`${surfaceClass} p-7 transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.52)]`}
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.88fr)] lg:items-start">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                            {feature.eyebrow}
                          </div>
                          <h3 className="mt-4 max-w-[16ch] text-[1.5rem] font-black leading-[1] tracking-[-0.04em] text-white">
                            {feature.title}
                          </h3>
                        </div>

                        <div className="rounded-[1.1rem] border border-green-500/18 bg-green-500/10 p-3 text-green-300">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <p className="mt-4 text-[0.98rem] leading-7 text-zinc-400">
                        {feature.description}
                      </p>

                      <div className="mt-6 space-y-3">
                        {feature.bullets.map((bullet) => (
                          <div key={bullet} className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/12 text-green-300">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-4">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        {feature.previewTitle}
                      </div>

                      {index === 3 ? (
                        <div className="mt-5 flex items-end gap-3">
                          {previewBars.map((bar) => (
                            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                              <div
                                className={`w-full rounded-t-[1rem] rounded-b-md bg-[linear-gradient(180deg,rgba(74,222,128,0.96),rgba(22,163,74,0.28))] ${bar.height}`}
                              />
                              <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                                {bar.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {feature.previewRows.map((row) => (
                            <div
                              key={row.label}
                              className="rounded-[1.15rem] border border-white/8 bg-black/24 px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">{row.label}</div>
                                  <div className="mt-1 text-xs text-zinc-500">{row.meta}</div>
                                </div>
                                <span className="text-xs font-semibold text-green-300">
                                  {row.value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 rounded-[1.1rem] border border-green-500/10 bg-[linear-gradient(90deg,rgba(8,28,13,0.78),rgba(14,48,22,0.5),rgba(8,28,13,0.78))] px-4 py-3 text-sm leading-6 text-zinc-200">
                        {index === 0
                          ? "Treino pronto antes da execucao."
                          : index === 1
                          ? "Registro rapido sem quebrar o ritmo."
                          : index === 2
                          ? "Voce entende o que mudou na ultima sessao."
                          : "A evolucao aparece de forma visual."}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionReveal}
        className="relative z-10"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.05)_0%,rgba(4,4,4,0.1)_52%,rgba(4,4,4,0.16)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
            <motion.div variants={staggerGrid} className="grid gap-5">
              {workflow.map((item) => (
                <motion.div
                  key={item.step}
                  variants={itemReveal}
                  whileHover={{ y: -4, scale: 1.014 }}
                  className={`${surfaceClass} grid gap-5 p-6 transition-all duration-300 hover:border-white/14 hover:shadow-[0_20px_56px_rgba(0,0,0,0.46)] sm:grid-cols-[92px_1fr]`}
                >
                  <div className="text-4xl font-black tracking-[-0.06em] text-green-400">
                    {item.step}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold tracking-[-0.03em] text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-zinc-400">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid gap-6">
              <div className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,32,17,0.26)_0%,rgba(10,10,10,0.98)_100%)] p-8 sm:p-10">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                  O que essa pagina precisa comunicar
                </div>
                <h2 className="mt-5 max-w-[11ch] text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                  Menos documentacao. Mais produto.
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                  Quando a pagina de funcionalidades fica visual, escaneavel e com
                  atmosfera de produto, ela vende melhor e prepara melhor o usuario
                  para cadastro.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                  whileHover={{ y: -4, scale: 1.012 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className={`${surfaceClass} p-7 text-lg leading-8 text-zinc-200 transition-all duration-300 hover:border-white/18 hover:shadow-[0_20px_56px_rgba(0,0,0,0.42)]`}
                >
                  "Quem entra entende rapido o que o Corefit faz, por que ele parece
                  premium e como isso vira valor no treino."
                </motion.div>

                <motion.div
                  whileHover={{ y: -4, scale: 1.012 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className={`${surfaceClass} p-7 text-lg leading-8 text-zinc-200 transition-all duration-300 hover:border-white/18 hover:shadow-[0_20px_56px_rgba(0,0,0,0.42)]`}
                >
                  "A pagina deixa de parecer uma lista tecnica e passa a parecer um
                  sistema que vale usar."
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionReveal}
        className="relative z-10"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.04)_0%,rgba(4,4,4,0.08)_44%,rgba(4,4,4,0.14)_100%)]" />
        <div className={`${sectionShell} pb-24 pt-4`}>
          <div className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="rounded-[2.3rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,34,18,0.96),rgba(16,16,16,0.96))] p-8 shadow-[0_22px_80px_rgba(0,0,0,0.38)] sm:p-10">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                Fechamento com impacto
              </div>

              <h2 className="mt-5 max-w-[13ch] text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Funcionalidade forte vende antes do onboarding.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
                O usuario precisa olhar a pagina e sentir que existe metodo, leitura
                e profundidade no produto. Esse e o tipo de pagina que prepara bem a
                conversao.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-[1.45rem] bg-white px-6 py-4 text-sm font-semibold text-black shadow-[0_16px_34px_rgba(255,255,255,0.06)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_38px_rgba(255,255,255,0.10)] active:scale-[0.985]"
                >
                  Quero comecar agora
                </Link>

                <Link
                  href="/planos"
                  className="inline-flex items-center justify-center rounded-[1.45rem] border border-white/12 bg-black/20 px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-black/30 active:scale-[0.985]"
                >
                  Ver planos
                </Link>
              </div>
            </div>

            <div className="grid gap-6">
              <div className={`${surfaceClass} p-7`}>
                <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  O produto em uma frase
                </div>
                <div className="mt-5 flex items-start gap-4">
                  <div className="rounded-2xl bg-green-500/10 p-3 text-green-300">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <p className="text-lg leading-8 text-zinc-200">
                    O Corefit organiza o treino, ajuda a registrar com rapidez e
                    transforma disciplina em progresso visual.
                  </p>
                </div>
              </div>

              <div className={`${surfaceClass} p-7 text-lg leading-8 text-zinc-200`}>
                "Quando a promessa visual conversa com a experiencia do produto, a
                pagina deixa de explicar demais e passa a convencer melhor."
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
