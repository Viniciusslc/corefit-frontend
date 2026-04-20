"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Corefit global error boundary:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#040404] text-white">
        <main className="min-h-screen overflow-hidden bg-[#040404] text-white">
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-no-repeat"
              style={{
                backgroundImage: "url('/images/hero-landing.png')",
                backgroundPosition: "center top",
                filter: "brightness(0.18) contrast(1.04) saturate(1.02)",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(239,68,68,0.16),transparent_18%),radial-gradient(circle_at_78%_12%,rgba(34,197,94,0.12),transparent_22%),linear-gradient(180deg,rgba(4,4,4,0.84)_0%,rgba(4,4,4,0.78)_28%,rgba(4,4,4,0.96)_100%)]" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center px-6 py-20">
            <div className="w-full rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,13,13,0.96),rgba(8,8,8,0.98))] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.46)] sm:p-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-red-400/18 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-200">
                <AlertTriangle size={14} />
                Erro inesperado
              </div>

              <h1 className="mt-6 max-w-[12ch] text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl">
                O app saiu da rota
                <span className="block text-green-400">por um instante.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                A tela encontrou uma falha que nao deveria acontecer. Ja deixamos uma camada de
                recuperacao aqui para voce tentar de novo sem ficar preso.
              </p>

              <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-400">
                <div className="font-semibold text-white">Diagnostico rapido</div>
                <div className="mt-2">Mensagem: {error?.message || "Erro nao identificado"}</div>
                {error?.digest ? <div>Digest: {error.digest}</div> : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 py-3.5 text-sm font-semibold text-black shadow-[0_0_36px_rgba(34,197,94,0.22)] transition duration-200 hover:scale-[1.01] hover:bg-green-400 active:scale-[0.99]"
                >
                  <RefreshCw size={16} />
                  Tentar novamente
                </button>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition duration-200 hover:border-white/20 hover:bg-white/8"
                >
                  Voltar ao dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

