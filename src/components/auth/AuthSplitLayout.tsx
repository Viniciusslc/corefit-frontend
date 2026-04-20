"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { CorefitLogo } from "@/components/logo/CorefitLogo";

type AuthMetric = {
  value: string;
  label: string;
};

type AuthHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type AuthSplitLayoutProps = {
  backgroundImage: string;
  backgroundPosition: string;
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  heroHighlights: AuthHighlight[];
  heroMetrics: AuthMetric[];
  heroNote?: string;
  heroMetricsColumns?: 2 | 3;
  heroHighlightsColumns?: 2 | 3;
  panelBadge: string;
  panelTitle: string;
  panelDescription: string;
  children: React.ReactNode;
};

const panelTransition = {
  duration: 0.64,
  ease: "easeOut" as const,
};

const cardReveal = {
  hidden: { opacity: 0, y: 22 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.18 + index * 0.07,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export function AuthSplitLayout({
  backgroundImage,
  backgroundPosition,
  heroEyebrow,
  heroTitle,
  heroAccent,
  heroDescription,
  heroHighlights,
  heroMetrics,
  heroNote,
  heroMetricsColumns = 3,
  heroHighlightsColumns = 3,
  panelBadge,
  panelTitle,
  panelDescription,
  children,
}: AuthSplitLayoutProps) {
  const metricGridClass =
    heroMetricsColumns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  const highlightGridClass =
    heroHighlightsColumns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#040404] text-white">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundPosition,
            filter: "brightness(0.28) contrast(1.05) saturate(1.02)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(34,197,94,0.18),transparent_16%),radial-gradient(circle_at_76%_14%,rgba(34,197,94,0.14),transparent_22%),linear-gradient(180deg,rgba(4,4,4,0.78)_0%,rgba(4,4,4,0.72)_26%,rgba(4,4,4,0.94)_100%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:120px_120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1380px] items-center px-5 pb-14 pt-24 sm:px-8 sm:pt-28 lg:px-10">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)] lg:items-center xl:gap-12">
          <motion.section
            initial={{ opacity: 0, x: -56 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...panelTransition, delay: 0.12 }}
            className="order-2 hidden lg:block"
          >
            <motion.div
              whileHover={{ y: -4, scale: 1.006 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,9,9,0.96)_0%,rgba(4,4,4,0.98)_100%)] px-8 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-[2px] xl:px-10 xl:py-8"
            >
              <motion.div
                className="absolute left-0 top-0 h-20 w-full bg-green-500/6 blur-2xl"
                animate={{ opacity: [0.32, 0.5, 0.32] }}
                transition={{ duration: 6.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <div className="relative">
                <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-green-300">
                  {heroEyebrow}
                </div>

                <h1 className="mt-6 max-w-[11ch] text-[3.15rem] font-black leading-[0.88] tracking-[-0.06em] text-white xl:text-[4.55rem]">
                  {heroTitle}
                  <br />
                  <span className="text-green-400">{heroAccent}</span>
                </h1>

                <p className="mt-6 max-w-[39rem] text-[1.02rem] leading-8 text-zinc-200">
                  {heroDescription}
                </p>

                <div className={`mt-8 grid max-w-[46rem] gap-4 ${metricGridClass}`}>
                  {heroMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={cardReveal}
                      whileHover={{ y: -4, scale: 1.018 }}
                      className="flex min-h-[120px] flex-col rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.010))] px-5 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.34)] transition-all duration-300 hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(34,197,94,0.045),rgba(255,255,255,0.016))]"
                    >
                      <div className="text-[1.35rem] font-black leading-[0.96] tracking-[-0.05em] text-white xl:text-[1.58rem]">
                        {metric.value}
                      </div>
                      <div className="mt-2 max-w-[18rem] text-[0.84rem] leading-6 text-zinc-400">
                        {metric.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className={`mt-8 grid gap-4 ${highlightGridClass}`}>
                  {heroHighlights.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        custom={index + heroMetrics.length}
                        initial="hidden"
                        animate="visible"
                        variants={cardReveal}
                        whileHover={{ y: -6, scale: 1.018 }}
                        className="flex min-h-[136px] flex-col rounded-[1.55rem] border border-white/10 bg-white/[0.03] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.34)] transition-all duration-300 hover:border-white/18 hover:bg-[rgba(255,255,255,0.04)] hover:shadow-[0_18px_44px_rgba(0,0,0,0.42)]"
                      >
                        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/12 text-green-300 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold leading-5 text-white">
                          {item.title}
                        </p>
                        <p className="mt-2 text-[0.88rem] leading-6 text-zinc-400">
                          {item.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {heroNote ? (
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.54, duration: 0.5, ease: "easeOut" }}
                    className="mt-8 rounded-[1.5rem] border border-green-500/10 bg-[linear-gradient(90deg,rgba(7,18,10,0.92),rgba(11,26,15,0.64),rgba(7,18,10,0.92))] px-5 py-4 text-sm leading-6 text-zinc-200"
                  >
                    {heroNote}
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 72 }}
            animate={{ opacity: 1, x: 0 }}
            transition={panelTransition}
            className="order-1 mx-auto w-full max-w-[470px] lg:order-2 lg:ml-auto lg:max-w-[480px] lg:justify-self-end"
          >
            <motion.div
              whileHover={{ y: -4, scale: 1.006 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.90),rgba(0,0,0,0.72))] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-[3px] sm:p-8"
            >
              <motion.div
                className="absolute left-0 top-0 h-20 w-full bg-green-500/7 blur-2xl"
                animate={{ opacity: [0.36, 0.56, 0.36] }}
                transition={{ duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.35 }}
              />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <div className="relative">
                <div className="mb-7 flex items-center justify-between gap-4">
                  <CorefitLogo size="md" />
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-300">
                    {panelBadge}
                  </span>
                </div>

                <div className="mb-8 rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 lg:hidden">
                  <div className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-green-300">
                    {heroEyebrow}
                  </div>
                  <h1 className="mt-4 max-w-[12ch] text-[2.3rem] font-black leading-[0.94] tracking-[-0.05em] text-white">
                    {heroTitle}
                    <br />
                    <span className="text-green-400">{heroAccent}</span>
                  </h1>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    {heroDescription}
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.2rem]">
                    {panelTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-[0.98rem]">
                    {panelDescription}
                  </p>
                </div>

                {children}
              </div>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
