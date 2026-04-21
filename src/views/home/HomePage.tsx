"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const proofItems = [
  { label: "carga total registrada", value: "+16,2 kg" },
  { label: "volume em 30 dias", value: "+5,1%" },
  { label: "sessões concluídas", value: "128" },
];

const benefitCards = [
  {
    eyebrow: "Registro vivo",
    title: "Seu treino deixa rastro.",
    text: "Cada série vira histórico real. Você enxerga carga, volume e consistência sem depender da memória.",
  },
  {
    eyebrow: "Leitura clara",
    title: "A evolução aparece sem achismo.",
    text: "O Corefit transforma treino solto em progresso visível, com contexto suficiente para entender se você está avançando ou travando.",
  },
  {
    eyebrow: "Ritmo mantido",
    title: "Disciplina vira sistema.",
    text: "Entre, registre, compare e volte melhor no próximo treino. Menos atrito, mais constância.",
  },
];

const flowSteps = [
  {
    index: "01",
    title: "Monte seu plano",
    text: "Crie treinos do seu jeito, organize exercícios e deixe cada sessão pronta para execução.",
  },
  {
    index: "02",
    title: "Execute com contexto",
    text: "Durante o treino, registre reps, carga e desempenho sem quebrar o ritmo da sessão.",
  },
  {
    index: "03",
    title: "Veja o que mudou",
    text: "O que era sensacao vira dado: mais carga, mais volume, mais consistencia e mais resultado.",
  },
];

const quoteCards = [
  "Não é só log de treino. É clareza para saber se você realmente está evoluindo.",
  "Quando o histórico fica organizado, treinar deixa de ser aleatório e passa a ter direção.",
];

const previewExercises = [
  { name: "Supino reto", meta: "4x 8-10", result: "+2,5kg" },
  { name: "Supino inclinado", meta: "3x 10", result: "igualado" },
  { name: "Triceps corda", meta: "3x 12", result: "+2 reps" },
];

const sectionShell = "mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-10";
const surfaceClass =
  "rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,16,15,0.96)_0%,rgba(8,9,9,0.96)_100%)] shadow-[0_22px_80px_rgba(0,0,0,0.38)]";
const softSurfaceClass =
  "rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,16,14,0.90)_0%,rgba(8,10,9,0.94)_100%)]";

const rhythmItems = [
  "Planeja sem perder simplicidade",
  "Registra sem quebrar o treino",
  "Lê de volta o que realmente mudou",
];

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

export default function HomePage() {
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
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:120px_120px]" />
      </div>

      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionReveal}
        className="relative z-10 border-b border-white/6"
      >
        <div className={`${sectionShell} pb-20 pt-32 sm:pt-36 lg:pb-20 xl:pt-40`}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(440px,0.98fr)] lg:items-center xl:gap-12">
            <motion.div
              variants={staggerGrid}
              initial="hidden"
              animate="visible"
              className="max-w-[39rem]"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-green-300">
                Sistema visual para treino sério
              </div>

              <h1 className="mt-7 max-w-[10ch] text-[3.15rem] font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-[4.3rem] xl:text-[5.2rem]">
                O shape muda
                <br />
                <span className="text-green-400">quando a evolução aparece.</span>
              </h1>

              <p className="mt-7 max-w-[35rem] text-[1.02rem] leading-8 text-zinc-300 sm:text-[1.06rem]">
                O Corefit transforma treino em leitura clara. Você registra,
                compara, ajusta e vê seu progresso do jeito que deveria ser:
                visível, organizado e impossível de ignorar.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center rounded-[1.45rem] bg-green-500 px-7 py-4 text-base font-semibold text-black shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 hover:shadow-green-500/40 active:scale-[0.985]"
                >
                  Criar minha conta grátis
                  <span className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">
                    -&gt;
                  </span>
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
                className="mt-10 grid max-w-[35rem] gap-4 sm:grid-cols-3"
              >
                {proofItems.map((item) => (
                  <motion.div
                    key={item.label}
                    variants={itemReveal}
                    whileHover={{ y: -4, scale: 1.018 }}
                    className="rounded-[1.55rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-5 shadow-xl shadow-black/40 transition-all duration-300 hover:border-white/20 hover:bg-[linear-gradient(180deg,rgba(34,197,94,0.06),rgba(255,255,255,0.02))]"
                  >
                    <div className="text-[1.95rem] font-black tracking-[-0.05em] text-white">
                      {item.value}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-zinc-400">
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                variants={staggerGrid}
                initial="hidden"
                animate="visible"
                className="mt-8 flex flex-wrap gap-3"
              >
                {rhythmItems.map((item) => (
                  <motion.span
                    key={item}
                    variants={itemReveal}
                    whileHover={{ y: -2, scale: 1.015 }}
                    className="inline-flex items-center rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-4 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/20"
                  >
                    {item}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 42 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.68, ease: "easeOut", delay: 0.14 }}
              className="relative w-full"
            >
              <motion.div
                className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-green-500/10 blur-[90px]"
                animate={{ opacity: [0.28, 0.48, 0.28], scale: [1, 1.06, 1] }}
                transition={{ duration: 7.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -right-8 bottom-12 h-40 w-40 rounded-full bg-green-500/10 blur-[110px]"
                animate={{ opacity: [0.26, 0.44, 0.26], scale: [1, 1.05, 1] }}
                transition={{ duration: 8.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.8 }}
              />

              <motion.div
                whileHover={{ y: -5, scale: 1.006 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`relative overflow-hidden p-5 sm:p-6 ${surfaceClass}`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[26rem]">
                    <div className="inline-flex items-center rounded-full border border-green-500/18 bg-green-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                      Corefit preview
                    </div>
                    <h2 className="mt-4 text-[1.55rem] font-bold tracking-[-0.04em] text-white sm:text-[1.75rem]">
                      Painel de treino com leitura real
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      O hero da plataforma precisa conversar com o produto. Aqui a
                      promessa visual já vira tela, rotina, meta e progresso.
                    </p>
                  </div>

                  <div className="shrink-0 rounded-[1.35rem] border border-green-500/20 bg-green-500/10 px-4 py-3 text-right">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-green-300">
                      Meta
                    </div>
                    <div className="mt-1 text-2xl font-black tracking-[-0.05em] text-white">
                      +3%
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-300">Treino A</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                          Peito + tríceps
                        </p>
                      </div>

                      <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                        Ativo
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {previewExercises.map((exercise) => (
                        <motion.div
                          key={exercise.name}
                          whileHover={{ x: 4, scale: 1.01 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="rounded-[1.3rem] border border-white/8 bg-black/24 px-4 py-3 transition-all duration-300 hover:border-white/16 hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {exercise.name}
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {exercise.meta}
                              </div>
                            </div>

                            <span className="text-xs font-semibold text-green-300">
                              {exercise.result}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-5">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        Volume semanal
                      </div>
                      <div className="mt-3 flex items-start gap-2">
                        <span className="text-[2.2rem] font-black tracking-[-0.05em] text-white">
                          18.4t
                        </span>
                        <span className="mt-2 text-sm font-semibold text-green-300">
                          +12%
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        O desempenho não fica perdido em notas soltas. Ele aparece
                        com contexto suficiente para orientar a próxima sessão.
                      </p>
                    </div>

                    <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-5">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        App no bolso
                      </div>
                      <p className="mt-2 max-w-[18rem] text-sm leading-6 text-zinc-400">
                        Registre no meio do treino sem quebrar o ritmo e volte para a
                        próxima sessão com contexto.
                      </p>

                      <div className="relative mt-5 flex min-h-[164px] items-center justify-center overflow-hidden rounded-[1.3rem] bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.16),transparent_58%)]">
                        <motion.div
                          className="absolute h-28 w-28 rounded-full bg-green-500/12 blur-[45px]"
                          animate={{ opacity: [0.34, 0.56, 0.34], scale: [1, 1.08, 1] }}
                          transition={{ duration: 6.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        />

                        <Image
                          src="/images/phone-mockup.png"
                          alt="Preview do app Corefit"
                          width={170}
                          height={170}
                          className="relative h-auto w-[108px] rotate-[14deg] object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.35rem] border border-green-500/14 bg-[linear-gradient(90deg,rgba(8,28,13,0.86),rgba(14,48,22,0.66),rgba(8,28,13,0.86))] px-4 py-4 text-sm leading-6 text-zinc-100">
                  Você não precisa treinar no escuro. Precisa de um sistema que te
                  mostre quando está ficando mais forte.
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.04)_0%,rgba(4,4,4,0.10)_48%,rgba(4,4,4,0.16)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="grid gap-6">
            <div className={`${softSurfaceClass} p-8 sm:p-10`}>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                Padrão visual e funcional
              </div>
              <h2 className="mt-5 max-w-[13ch] text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                A home precisa vender a mesma clareza que o produto entrega.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                O hero, os cards e a distribuição do conteúdo agora trabalham na
                mesma direção: parecer um sistema premium, organizado e confiável.
              </p>
            </div>

            <motion.div
              variants={staggerGrid}
              className="grid gap-6 lg:grid-cols-3"
            >
              {benefitCards.map((card) => (
                <motion.article
                  key={card.title}
                  variants={itemReveal}
                  whileHover={{ y: -6, scale: 1.018 }}
                  className={`${surfaceClass} p-7 transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                    {card.eyebrow}
                  </div>
                  <h3 className="mt-5 max-w-[12ch] text-[1.65rem] font-black leading-[0.96] tracking-[-0.04em] text-white sm:text-[1.8rem]">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-zinc-400">
                    {card.text}
                  </p>
                </motion.article>
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.05)_0%,rgba(4,4,4,0.10)_52%,rgba(4,4,4,0.16)_100%)]" />
        <div className={`${sectionShell} py-20`}>
          <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
            <motion.div variants={staggerGrid} className="grid gap-5">
              {flowSteps.map((step) => (
                <motion.div
                  key={step.index}
                  variants={itemReveal}
                  whileHover={{ y: -4, scale: 1.014 }}
                  className={`${surfaceClass} grid gap-5 p-6 transition-all duration-300 hover:border-white/14 hover:shadow-[0_20px_56px_rgba(0,0,0,0.46)] sm:grid-cols-[92px_1fr]`}
                >
                  <div className="text-4xl font-black tracking-[-0.06em] text-green-400">
                    {step.index}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold tracking-[-0.03em] text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-zinc-400">
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid gap-6">
              <div className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,32,17,0.26)_0%,rgba(10,10,10,0.98)_100%)] p-8 sm:p-10">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                  Como funciona
                </div>
                <h2 className="mt-5 max-w-[11ch] text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                  Menos tentativa. Mais leitura de evolução.
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                  O Corefit organiza o processo inteiro para que você saiba o que
                  planejou, o que executou e o que realmente melhorou.
                </p>
              </div>

              <motion.div variants={staggerGrid} className="grid gap-6 lg:grid-cols-2">
                {quoteCards.map((quote) => (
                  <motion.div
                    key={quote}
                    variants={itemReveal}
                    whileHover={{ y: -4, scale: 1.012 }}
                    className={`${surfaceClass} p-7 text-lg leading-8 text-zinc-200 transition-all duration-300 hover:border-white/18 hover:shadow-[0_20px_56px_rgba(0,0,0,0.42)]`}
                  >
                    "{quote}"
                  </motion.div>
                ))}
              </motion.div>
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,4,4,0.04)_0%,rgba(4,4,4,0.08)_40%,rgba(4,4,4,0.14)_100%)]" />
        <div className={`${sectionShell} pb-24 pt-4`}>
          <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
            <div className="rounded-[2.3rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,34,18,0.96),rgba(16,16,16,0.96))] p-8 shadow-[0_22px_80px_rgba(0,0,0,0.38)] sm:p-10">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-300">
                Fechamento com direção
              </div>

              <h2 className="mt-5 max-w-[13ch] text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Treino bom e treino que deixa rastro.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
                Resultado não vem só de intensidade. Vem de repetir o que
                funciona, ajustar o que travou e enxergar o progresso antes da
                motivação cair.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="rounded-[1.45rem] bg-white px-6 py-4 text-sm font-semibold text-black shadow-[0_16px_34px_rgba(255,255,255,0.06)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_38px_rgba(255,255,255,0.10)] active:scale-[0.985]"
                >
                  Quero testar esta versão
                </Link>

                <Link
                  href="/login"
                  className="rounded-[1.45rem] border border-white/12 bg-black/20 px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-black/30 active:scale-[0.985]"
                >
                  Ja tenho conta
                </Link>
              </div>
            </div>

            <div className="grid gap-6">
              <div className={`${surfaceClass} p-7`}>
                <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  O que muda na pratica
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {proofItems.map((item) => (
                    <div key={item.label} className="rounded-[1.35rem] border border-white/8 bg-black/20 px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/16">
                      <div className="text-xl font-bold tracking-[-0.04em] text-white">
                        {item.value}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-400">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${surfaceClass} p-7 text-lg leading-8 text-zinc-200`}>
                "Quando o visual, a navegação e a leitura de progresso trabalham juntos,
                o produto parece mais maduro, mais confiável e muito mais profissional."
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
