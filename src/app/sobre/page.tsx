"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Check,
  Compass,
  Eye,
  LineChart,
  Sparkles,
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

const philosophyCards = [
  {
    icon: Activity,
    title: "Execucao",
    text: "Registrar o treino sem atrito para que a disciplina continue fluindo no meio da sessao.",
  },
  {
    icon: Eye,
    title: "Leitura",
    text: "Entender o que mudou de verdade, sem depender de memoria, sensacao ou improviso.",
  },
  {
    icon: Compass,
    title: "Evolucao",
    text: "Decidir o proximo passo com mais clareza, porque o progresso aparece com contexto.",
  },
];

const workflowCards = [
  {
    step: "01",
    title: "Voce registra o que fez",
    text: "Treino, carga, reps e ritmo deixam de ficar soltos e passam a formar um historico util.",
  },
  {
    step: "02",
    title: "O sistema organiza a leitura",
    text: "O Corefit transforma execucao em contexto para que cada sessao converse com a proxima.",
  },
  {
    step: "03",
    title: "A decisao fica mais clara",
    text: "Em vez de treinar no escuro, voce ajusta com base no que realmente melhorou ou travou.",
  },
];

const futureSignals = [
  "Leitura automatica de desempenho com comparacao inteligente entre sessoes.",
  "Sugestoes de ajuste de carga, volume e continuidade baseadas no seu historico.",
  "Camada de IA para pensar o treino junto com voce, nao no seu lugar.",
  "Experiencia premium que une execucao rapida, contexto visual e evolucao guiada por dados.",
];

export default function SobrePage() {
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
          <div className="mx-auto max-w-[64rem] text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-green-300">
              Ideia, posicionamento, visao
            </div>

            <h1 className="mx-auto mt-7 max-w-[10ch] text-[3.15rem] font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-[4.3rem] xl:text-[5.2rem]">
              Treinar sem clareza
              <br />
              <span className="text-green-400">e treinar no escuro.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-[44rem] text-[1.02rem] leading-8 text-zinc-300 sm:text-[1.08rem]">
              O Corefit nasce para transformar execucao em leitura, e consistencia
              em evolucao real. Nao e so sobre registrar treino. E sobre entender o
              que esta mudando e decidir melhor o proximo passo.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center rounded-[1.45rem] bg-green-500 px-7 py-4 text-base font-semibold text-black shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 hover:shadow-green-500/40 active:scale-[0.985]"
              >
                Criar minha conta gratis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/funcionalidades"
                className="inline-flex items-center justify-center rounded-[1.45rem] border border-white/14 bg-white/[0.04] px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-white/22 hover:bg-white/[0.07] active:scale-[0.985]"
              >
                Ver funcionalidades
              </Link>
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.04)_0%,rgba(4,4,4,0.1)_46%,rgba(4,4,4,0.16)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="mx-auto max-w-[56rem] text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
              O problema por tras do produto
            </div>
            <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
              O problema nunca foi falta de treino.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Foi falta de leitura. As pessoas treinam, se esforcam, repetem semana
              apos semana, mas quase sempre sem clareza suficiente para saber se
              estao realmente evoluindo.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-[64rem]">
            <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,32,17,0.24)_0%,rgba(10,10,10,0.98)_100%)] p-8 text-center shadow-[0_22px_80px_rgba(0,0,0,0.38)] sm:p-10">
              <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-green-500/12 via-green-500/4 to-transparent" />
              <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-green-500/10 blur-[70px]" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/18 bg-green-500/10 text-green-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mx-auto mt-6 max-w-[50rem] text-xl leading-9 text-zinc-200 sm:text-2xl sm:leading-10">
                O Corefit existe para tirar o treino do campo da sensacao e levar
                para o campo da leitura. Menos achismo. Mais contexto. Mais
                continuidade.
              </p>
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.05)_0%,rgba(4,4,4,0.1)_52%,rgba(4,4,4,0.16)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="mx-auto max-w-[58rem] text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
              Como o Corefit pensa
            </div>
            <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
              A ideia se sustenta em tres pilares.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Nao e sobre empilhar telas. E sobre criar uma experiencia que faz
              sentido para quem quer treinar melhor com mais clareza.
            </p>
          </div>

          <motion.div
            variants={staggerGrid}
            className="mt-14 grid gap-6 md:grid-cols-3"
          >
            {philosophyCards.map((card) => {
              const Icon = card.icon;

              return (
                <motion.article
                  key={card.title}
                  variants={itemReveal}
                  whileHover={{ y: -6, scale: 1.016 }}
                  className={`${surfaceClass} relative overflow-hidden p-7 text-center transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.52)]`}
                >
                  <div className="absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-green-500/40 to-transparent" />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/18 bg-green-500/10 text-green-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-[1.55rem] font-black tracking-[-0.04em] text-white">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-[0.98rem] leading-7 text-zinc-400">
                    {card.text}
                  </p>
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.04)_0%,rgba(4,4,4,0.08)_46%,rgba(4,4,4,0.14)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
            <div className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,32,17,0.26)_0%,rgba(10,10,10,0.98)_100%)] p-8 sm:p-10">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                Como funciona de verdade
              </div>
              <h2 className="mt-5 max-w-[11ch] text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Menos explicacao tecnica. Mais narrativa de produto.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                O Corefit foi pensado para acompanhar a jornada inteira: da
                execucao ao entendimento, e do entendimento a proxima decisao.
              </p>
            </div>

            <motion.div variants={staggerGrid} className="grid gap-5">
              {workflowCards.map((card) => (
                <motion.div
                  key={card.step}
                  variants={itemReveal}
                  whileHover={{ y: -4, scale: 1.014 }}
                  className={`${surfaceClass} group relative overflow-hidden grid gap-5 p-6 transition-all duration-300 hover:border-white/14 hover:shadow-[0_24px_60px_rgba(0,0,0,0.48)] sm:grid-cols-[120px_1fr]`}
                >
                  <motion.div
                    className="absolute left-10 top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-green-500/10 via-green-400/70 to-transparent sm:block"
                    animate={{ opacity: [0.42, 0.82, 0.42] }}
                    transition={{ duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />

                  <div className="relative flex items-start sm:justify-center">
                    <div className="text-5xl font-black tracking-[-0.08em] text-green-400 drop-shadow-[0_0_18px_rgba(74,222,128,0.22)] transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_26px_rgba(74,222,128,0.34)] sm:text-6xl">
                      {card.step}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold tracking-[-0.03em] text-white">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-zinc-400">
                      {card.text}
                    </p>
                  </div>
                </motion.div>
              ))}
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.04)_0%,rgba(4,4,4,0.1)_52%,rgba(4,4,4,0.16)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
            <div className="rounded-[2.3rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,34,18,0.96),rgba(16,16,16,0.96))] p-8 shadow-[0_22px_80px_rgba(0,0,0,0.38)] sm:p-10">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                Visao de futuro
              </div>

              <h2 className="mt-5 max-w-[13ch] text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                O Corefit não é só registro.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
                Estamos construindo um sistema que pensa junto com voce. Um produto
                que une leitura automatica, sugestoes inteligentes e evolucao guiada
                por dados para deixar o treino mais claro, mais consistente e mais
                util ao longo do tempo.
              </p>

              <div className="mt-8 flex items-start gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5">
                <div className="rounded-2xl bg-green-500/10 p-3 text-green-300">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <p className="text-base leading-7 text-zinc-200">
                  Estamos construindo um sistema que pensa junto com voce, reduz
                  atrito e aumenta clareza desde o primeiro treino.
                </p>
              </div>
            </div>

            <motion.div variants={staggerGrid} className="grid gap-5">
              {futureSignals.map((item) => (
                <motion.div
                  key={item}
                  variants={itemReveal}
                  whileHover={{ y: -4, scale: 1.012 }}
                  className={`${surfaceClass} relative overflow-hidden flex items-start gap-4 p-6 transition-all duration-300 hover:border-white/18 hover:shadow-[0_20px_56px_rgba(0,0,0,0.42)]`}
                >
                  <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-green-500/8 via-transparent to-transparent" />
                  <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500/12 text-green-300">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-base leading-7 text-zinc-300">{item}</p>
                </motion.div>
              ))}
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.02)_0%,rgba(4,4,4,0.08)_44%,rgba(4,4,4,0.14)_100%)]" />
        <div className={`${sectionShell} pb-24 pt-4`}>
          <div className="mx-auto max-w-[64rem] rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,11,0.96)_0%,rgba(8,9,9,0.98)_100%)] px-8 py-12 text-center shadow-[0_22px_80px_rgba(0,0,0,0.42)] sm:px-12 sm:py-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/18 bg-green-500/10 text-green-300">
              <LineChart className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
              Comece simples. Evolua com clareza.
            </h2>

            <p className="mx-auto mt-6 max-w-[40rem] text-lg leading-8 text-zinc-300">
              Se a ideia faz sentido para voce, o proximo passo e transformar treino
              em leitura desde agora. O Corefit foi feito para isso.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center rounded-[1.45rem] bg-green-500 px-7 py-4 text-base font-semibold text-black shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 hover:shadow-green-500/40 active:scale-[0.985]"
              >
                Criar minha conta gratis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/planos"
                className="inline-flex items-center justify-center rounded-[1.45rem] border border-white/14 bg-white/[0.04] px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-white/22 hover:bg-white/[0.07] active:scale-[0.985]"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
