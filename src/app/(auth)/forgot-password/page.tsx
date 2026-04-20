"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useState } from "react";

import { CorefitLogo } from "@/components/logo/CorefitLogo";
import { apiFetch } from "@/lib/apiFetch";

type ForgotPasswordResponse = {
  ok?: boolean;
  message?: string;
  previewUrl?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isLocalEnvironment =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewUrl(null);

    try {
      const resp = await apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });

      setSuccess(
        resp?.message ||
          "Se existir uma conta com esse email, enviaremos um link para redefinir a senha."
      );
      if (resp?.previewUrl) setPreviewUrl(resp.previewUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Não foi possível solicitar a recuperação.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url('/images/auth/hero-login.webp')",
          backgroundPosition: "center center",
          filter: "brightness(0.52) contrast(1.05)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.58)_45%,rgba(0,0,0,0.78)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_34%,rgba(34,197,94,0.16),transparent_22%),radial-gradient(circle_at_72%_38%,rgba(34,197,94,0.12),transparent_24%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1360px] items-center px-5 py-10 sm:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,520px)]">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <div className="max-w-2xl rounded-[2rem] bg-black/18 px-8 py-10 backdrop-blur-[2px]">
              <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-green-300">
                Acesso recuperado sem atrito
              </div>

              <h1 className="mt-7 max-w-[11ch] text-5xl font-black leading-[0.94] tracking-[-0.05em] xl:text-7xl">
                Volte para o Corefit.
                <br />
                <span className="text-green-400">Sem perder seu histórico.</span>
              </h1>

              <p className="mt-7 max-w-[38rem] text-lg leading-8 text-zinc-200">
                Digite seu email e nós enviamos um link seguro para redefinir sua senha.
                Seu progresso continua salvo, pronto para ser retomado.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto w-full max-w-xl"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-zinc-900/92 via-zinc-900/84 to-zinc-950/88 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.48),0_0_120px_rgba(34,197,94,0.18)] backdrop-blur-xl sm:p-8 lg:p-10">
              <div className="absolute left-0 top-0 h-24 w-full bg-green-500/12 blur-2xl" />
              <div className="relative">
                <div className="mb-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <CorefitLogo size="md" />
                  </div>

                  <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                    Recuperar senha
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                    Enviamos um link seguro para você criar uma nova senha.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-5 rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-100">
                    {success}
                    {previewUrl && isLocalEnvironment && (
                      <div className="mt-3">
                        <a
                          href={previewUrl}
                          className="font-semibold text-green-300 underline underline-offset-4"
                        >
                          Abrir link de recuperação neste ambiente
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="forgot-email" className="text-sm text-green-400">
                      Email da conta
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        autoComplete="email"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/95 px-5 py-4 pl-12 text-base text-white placeholder:text-zinc-500 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500">
                        <Mail size={18} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 text-lg font-semibold text-black shadow-[0_0_36px_rgba(34,197,94,0.22)] transition duration-200 hover:scale-[1.01] hover:bg-green-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Send size={18} />
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                  >
                    <ArrowLeft size={16} />
                    Voltar para login
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
