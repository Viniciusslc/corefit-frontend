"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { CorefitLogo } from "@/components/logo/CorefitLogo";
import { apiFetch } from "@/lib/apiFetch";

type ResetPasswordResponse = {
  ok?: boolean;
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordShell />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Link de recuperação inválido ou incompleto.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch<ResetPasswordResponse>("/auth/reset-password", {
        method: "POST",
        body: {
          token,
          newPassword,
        },
      });

      setSuccess("Senha redefinida com sucesso. Você já pode entrar novamente.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Não foi possível redefinir a senha.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResetPasswordShell>
      {!token && (
        <div className="mb-5 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          Esse link de recuperação está incompleto. Solicite um novo link.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-100">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          id="reset-password"
          label="Nova senha"
          value={newPassword}
          onChange={setNewPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
        />

        <PasswordField
          id="reset-password-confirm"
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
        />

        <button
          type="submit"
          disabled={loading || !token}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 text-lg font-semibold text-black shadow-[0_0_36px_rgba(34,197,94,0.22)] transition duration-200 hover:scale-[1.01] hover:bg-green-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <KeyRound size={18} />
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </ResetPasswordShell>
  );
}

function ResetPasswordShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url('/images/auth/hero-login.webp')",
          backgroundPosition: "center center",
          filter: "brightness(0.48) contrast(1.05)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.84)_0%,rgba(0,0,0,0.62)_45%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_34%,rgba(34,197,94,0.16),transparent_24%),radial-gradient(circle_at_24%_56%,rgba(34,197,94,0.12),transparent_24%)]" />

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
                Segurança + continuidade
              </div>

              <h1 className="mt-7 max-w-[11ch] text-5xl font-black leading-[0.94] tracking-[-0.05em] xl:text-7xl">
                Crie uma senha nova.
                <br />
                <span className="text-green-400">Volte para sua evolução.</span>
              </h1>

              <p className="mt-7 max-w-[38rem] text-lg leading-8 text-zinc-200">
                Defina uma nova senha e recupere seu acesso com segurança. Seu histórico,
                suas cargas e sua consistência continuam guardados no Corefit.
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
                    Redefinir senha
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                    Escolha uma nova senha para entrar novamente.
                  </p>
                </div>

                {children}

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

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  showPassword,
  onTogglePassword,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm text-green-400">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Mínimo de 6 caracteres"
          autoComplete="new-password"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/95 px-5 py-4 pr-14 text-base text-white placeholder:text-zinc-500 transition focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            type="button"
            onClick={onTogglePassword}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
