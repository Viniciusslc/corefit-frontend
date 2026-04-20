"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Crown, LockKeyhole, Ruler, Target, UserRound, Weight } from "lucide-react";

import { CFBadge, CFButton, CFInput, CFSection } from "@/components/corefit/primitives";
import { ApiError, apiFetch } from "@/lib/apiFetch";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const GOALS = [3, 4, 5, 6] as const;

type Gender = "male" | "female" | "other";

type MeResponse = {
  id: string;
  name: string;
  email: string;
  weeklyGoalDays: number;
  role?: "user" | "admin";
  plan?: "free" | "premium";
  planUpdatedAt?: string | null;
  isInternal?: boolean;
  subscriptionStatus?: string;
  billingProvider?: string;
  billingCurrentPeriodEnd?: string | null;
  billingCanceledAt?: string | null;
  billingStartedAt?: string | null;
  planSource?: string;
  hasPremiumAccess?: boolean;
  gender?: Gender;
  weightKg?: number | null;
  heightCm?: number | null;
  avatarUrl?: string;
};

type BillingStatus = {
  plan: string;
  hasPremiumAccess: boolean;
  isInternal: boolean;
  subscriptionStatus: string;
  billingProvider: string;
  billingCurrentPeriodEnd: string | null;
  billingCanceledAt: string | null;
  planSource: string;
  stripeConfigured: boolean;
  checkoutReady: boolean;
  canManageBilling: boolean;
};

type FormState = {
  weeklyGoalDays: number;
  gender: Gender;
  weightKg: string;
  heightCm: string;
  avatarUrl: string;
};

function initialsFromName(name?: string) {
  const value = String(name ?? "").trim();
  if (!value) return "CF";
  const parts = value.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "C";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] ?? "F";
  return (first + second).toUpperCase();
}

function safeNumberOrNull(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function formatDate(value?: string | null) {
  if (!value) return "Sem registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function mapSubscriptionStatus(status?: string) {
  switch (status) {
    case "active":
      return "Ativa";
    case "trialing":
      return "Teste";
    case "past_due":
      return "Pagamento pendente";
    case "canceled":
      return "Cancelada";
    case "paused":
      return "Pausada";
    case "grace_period":
      return "Periodo de graca";
    default:
      return "Inativa";
  }
}

function readPlanSource(value?: string | null) {
  switch (value) {
    case "checkout":
      return "Checkout";
    case "admin":
      return "Admin";
    case "founder":
      return "Founder";
    case "manual":
      return "Manual";
    default:
      return "Sistema";
  }
}

export default function ProfilePage() {
  useRequireAuth();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [form, setForm] = useState<FormState>({
    weeklyGoalDays: 4,
    gender: "other",
    weightKg: "",
    heightCm: "",
    avatarUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [billingLoading, setBillingLoading] = useState(true);
  const [billingBusy, setBillingBusy] = useState<"checkout" | "portal" | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setBillingLoading(true);
      setError(null);
      setSaved(false);

      try {
        const [profileData, billingData] = await Promise.all([
          apiFetch<MeResponse>("/users/me"),
          apiFetch<BillingStatus>("/billing/status").catch(() => null),
        ]);

        setMe(profileData);
        setBilling(billingData);

        setForm({
          weeklyGoalDays: Number(profileData.weeklyGoalDays ?? 4),
          gender: (profileData.gender ?? "other") as Gender,
          weightKg: profileData.weightKg == null ? "" : String(profileData.weightKg),
          heightCm: profileData.heightCm == null ? "" : String(profileData.heightCm),
          avatarUrl: String(profileData.avatarUrl ?? ""),
        });
      } catch (e: any) {
        setError(String(e?.message ?? "Erro ao carregar perfil"));
        setMe(null);
        setBilling(null);
      } finally {
        setLoading(false);
        setBillingLoading(false);
      }
    }

    load();
  }, []);

  const avatar = form.avatarUrl.trim();
  const showAvatar = avatar.length > 6;
  const initials = initialsFromName(me?.name);
  const goalLabel = useMemo(() => `${form.weeklyGoalDays} dias/semana`, [form.weeklyGoalDays]);

  const hasChanges = useMemo(() => {
    if (!me) return false;

    const formWeight = safeNumberOrNull(form.weightKg);
    const formHeight = safeNumberOrNull(form.heightCm);

    return (
      Number(me.weeklyGoalDays ?? 4) !== Number(form.weeklyGoalDays) ||
      (me.gender ?? "other") !== form.gender ||
      (me.weightKg ?? null) !== formWeight ||
      (me.heightCm ?? null) !== formHeight ||
      String(me.avatarUrl ?? "") !== form.avatarUrl
    );
  }, [form, me]);

  const subscriptionLabel = mapSubscriptionStatus(billing?.subscriptionStatus ?? me?.subscriptionStatus);

  function setGoal(goal: number) {
    setForm((prev) => ({ ...prev, weeklyGoalDays: goal }));
    setSaved(false);
  }

  async function saveAll() {
    if (!me) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload = {
        weeklyGoalDays: form.weeklyGoalDays,
        gender: form.gender,
        avatarUrl: form.avatarUrl,
        weightKg: safeNumberOrNull(form.weightKg),
        heightCm: safeNumberOrNull(form.heightCm),
      };

      await apiFetch("/users/me", { method: "PATCH", body: payload });

      setMe((prev) =>
        prev
          ? {
              ...prev,
              weeklyGoalDays: form.weeklyGoalDays,
              gender: form.gender,
              avatarUrl: form.avatarUrl,
              weightKg: payload.weightKg,
              heightCm: payload.heightCm,
            }
          : prev,
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(String(e?.message ?? "Erro ao salvar alteracoes"));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setPwError(null);
    setPwSaved(false);

    if (!currentPassword || !newPassword) {
      setPwError("Preencha a senha atual e a nova senha.");
      return;
    }

    if (newPassword.length < 6) {
      setPwError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("A confirmacao da nova senha nao confere.");
      return;
    }

    setPwSaving(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });

      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 2500);
    } catch (e: any) {
      setPwError(String(e?.message ?? "Erro ao alterar senha"));
    } finally {
      setPwSaving(false);
    }
  }

  async function handleStartCheckout(priceKey: "monthly" | "annual") {
    setBillingBusy("checkout");
    setBillingMessage(null);

    try {
      const response = await apiFetch<{ checkoutUrl: string }>("/billing/checkout-session", {
        method: "POST",
        body: { priceKey },
      });

      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      setBillingMessage("Nao foi possivel abrir o checkout agora.");
    } catch (e: any) {
      setBillingMessage(String(e?.message ?? "Erro ao iniciar checkout."));
    } finally {
      setBillingBusy(null);
    }
  }

  async function handleOpenPortal() {
    setBillingBusy("portal");
    setBillingMessage(null);

    try {
      const response = await apiFetch<{ portalUrl: string }>("/billing/portal", { method: "POST" });
      if (response?.portalUrl) {
        window.location.href = response.portalUrl;
        return;
      }
      setBillingMessage("Nao foi possivel abrir o portal de assinatura.");
    } catch (e: any) {
      if (e instanceof ApiError) {
        setBillingMessage(e.message);
      } else {
        setBillingMessage("Nao foi possivel abrir o portal de assinatura.");
      }
    } finally {
      setBillingBusy(null);
    }
  }

  const profileHighlights = [
    {
      icon: Target,
      label: "Meta atual",
      value: goalLabel,
      helper: "Ritmo semanal configurado no seu perfil.",
    },
    {
      icon: Weight,
      label: "Peso",
      value: form.weightKg.trim() ? `${form.weightKg} kg` : "Nao informado",
      helper: "Base para leitura corporal e contexto futuro.",
    },
    {
      icon: Ruler,
      label: "Altura",
      value: form.heightCm.trim() ? `${form.heightCm} cm` : "Nao informada",
      helper: "Ajuda a enriquecer sua camada de leitura pessoal.",
    },
  ];

  const membershipStats = [
    {
      label: "Plano",
      value: me?.plan === "premium" ? "Premium" : "Free",
      hint: "Camada principal",
    },
    {
      label: "Status",
      value: subscriptionLabel,
      hint: "Estado da assinatura",
    },
    {
      label: "Origem",
      value: readPlanSource(billing?.planSource ?? me?.planSource),
      hint: "Como o acesso nasceu",
    },
    {
      label: "Renovacao",
      value: formatDate(billing?.billingCurrentPeriodEnd),
      hint: "Proximo marco de billing",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-landing.png')",
            backgroundPosition: "center top",
            filter: "brightness(0.24) contrast(1.04) saturate(1.02)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(34,197,94,0.18),transparent_16%),radial-gradient(circle_at_78%_12%,rgba(34,197,94,0.14),transparent_22%),linear-gradient(180deg,rgba(4,4,4,0.82)_0%,rgba(4,4,4,0.76)_28%,rgba(4,4,4,0.94)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-28">
        <CFSection tone="accent" padding="lg" className="hero-animate hero-delay-1">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <CFBadge className="w-fit">
                <UserRound size={14} />
                Centro da conta
              </CFBadge>
              <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl">
                Seu perfil precisa sustentar
                <span className="block text-green-400">consistencia e contexto.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                Aqui ficam suas preferencias, sua leitura principal e a base pessoal que alimenta
                o restante do Corefit. Menos ajuste solto. Mais clareza sobre quem esta treinando.
              </p>
            </div>

            {me ? (
              <div className="w-full max-w-sm rounded-[2rem] border border-white/12 bg-black/18 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-[2px]">
                <div className="flex items-center gap-4">
                  <div
                    className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-green-500/28 bg-green-500/12 shadow-[0_0_0_1px_rgba(34,197,94,0.12)]"
                    title={me.name}
                  >
                    {showAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-lg font-black text-green-200">{initials}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-lg font-black text-white">{me.name}</div>
                    <div className="truncate text-sm text-zinc-400">{me.email}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {profileHighlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
                          <Icon size={13} />
                          {item.label}
                        </div>
                        <div className="mt-3 text-xl font-black tracking-[-0.04em] text-white">
                          {item.value}
                        </div>
                        <div className="mt-2 text-xs leading-6 text-zinc-500">{item.helper}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </CFSection>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <CFSection padding="lg" className="hero-animate hero-delay-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                  Preferencias pessoais
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
                  Ajustes do seu perfil
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                  Atualize sua base pessoal e mantenha a leitura do app alinhada ao seu momento.
                </p>
              </div>

              <CFBadge variant={hasChanges ? "warning" : "neutral"}>
                {loading
                  ? "Carregando"
                  : saved
                  ? "Alteracoes salvas"
                  : hasChanges
                  ? "Mudancas pendentes"
                  : "Tudo em dia"}
              </CFBadge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="profile-avatar" className="text-sm text-green-400">
                  Foto do perfil (URL)
                </label>
                <p className="mt-1 text-xs leading-6 text-zinc-500">
                  Cole o link da imagem. Depois podemos trocar isso por upload real.
                </p>
                <CFInput
                  id="profile-avatar"
                  value={form.avatarUrl}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, avatarUrl: event.target.value }));
                    setSaved(false);
                  }}
                  placeholder="https://..."
                  className="mt-2"
                  disabled={loading || !me}
                />
              </div>

              <div>
                <label htmlFor="profile-gender" className="text-sm text-green-400">
                  Sexo
                </label>
                <p className="mt-1 text-xs leading-6 text-zinc-500">
                  Usado para estatisticas e personalizacao.
                </p>
                <select
                  id="profile-gender"
                  value={form.gender}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, gender: event.target.value as Gender }));
                    setSaved(false);
                  }}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800/95 px-5 py-4 text-base text-white transition focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading || !me}
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label htmlFor="profile-weight" className="text-sm text-green-400">
                  Peso (kg)
                </label>
                <p className="mt-1 text-xs leading-6 text-zinc-500">Ex.: 84.5</p>
                <CFInput
                  id="profile-weight"
                  inputMode="decimal"
                  value={form.weightKg}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, weightKg: event.target.value }));
                    setSaved(false);
                  }}
                  placeholder="-"
                  className="mt-2"
                  disabled={loading || !me}
                />
              </div>

              <div>
                <label htmlFor="profile-height" className="text-sm text-green-400">
                  Altura (cm)
                </label>
                <p className="mt-1 text-xs leading-6 text-zinc-500">Ex.: 178</p>
                <CFInput
                  id="profile-height"
                  inputMode="numeric"
                  value={form.heightCm}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, heightCm: event.target.value }));
                    setSaved(false);
                  }}
                  placeholder="-"
                  className="mt-2"
                  disabled={loading || !me}
                />
              </div>
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-white">Meta semanal</div>
                  <div className="mt-1 text-xs leading-6 text-zinc-500">
                    Defina quantos dias por semana voce quer treinar.
                  </div>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-green-300">
                  {goalLabel}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {GOALS.map((goal) => (
                  <CFButton
                    key={goal}
                    type="button"
                    variant={form.weeklyGoalDays === goal ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setGoal(goal)}
                    disabled={saving || loading || !me}
                    aria-pressed={form.weeklyGoalDays === goal}
                  >
                    {goal}x
                  </CFButton>
                ))}
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-[1.4rem] border border-red-400/18 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-zinc-400">
                {loading
                  ? "Carregando seus dados..."
                  : hasChanges
                  ? "Voce tem alteracoes nao salvas."
                  : "Seus ajustes principais estao sincronizados."}
              </div>

              <CFButton
                type="button"
                onClick={saveAll}
                disabled={saving || loading || !me || !hasChanges}
              >
                {saving ? "Salvando..." : "Salvar alteracoes"}
              </CFButton>
            </div>
          </CFSection>

          <div className="grid gap-6">
            <CFSection padding="lg" className="hero-animate hero-delay-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                    <CreditCard size={13} />
                    Assinatura
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                    Sua camada de acesso
                  </h2>
                </div>
                <CFBadge variant={me?.hasPremiumAccess ? "accent" : "neutral"}>
                  {me?.hasPremiumAccess ? "Premium ativo" : "Plano free"}
                </CFBadge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {membershipStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      {item.label}
                    </div>
                    <div className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                      {item.value}
                    </div>
                    <div className="mt-2 text-xs leading-6 text-zinc-500">{item.hint}</div>
                  </div>
                ))}
              </div>

              <div
                className={`mt-5 rounded-[1.4rem] border p-4 ${
                  me?.hasPremiumAccess
                    ? "border-green-400/18 bg-green-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="text-sm font-black text-white">
                  {billingLoading
                    ? "Lendo camada de billing..."
                    : me?.hasPremiumAccess
                    ? "Sua conta ja esta com acesso premium."
                    : "Seu acesso atual continua no plano free."}
                </div>
                <div className="mt-2 text-sm leading-7 text-zinc-400">
                  {billingLoading
                    ? "Buscando status da assinatura e preparo do checkout."
                    : me?.isInternal
                    ? "Como conta interna/admin, seu premium nao entra nas metricas de receita."
                    : me?.hasPremiumAccess
                    ? "Se essa assinatura estiver vinculada ao Stripe, voce ja pode abrir o portal de gestao."
                    : billing?.checkoutReady
                    ? "Quando quiser, voce pode subir para premium e liberar a camada de inteligencia do Corefit."
                    : "O checkout ainda nao esta configurado neste ambiente. A base ja esta pronta para ser conectada."}
                </div>
              </div>

              <div className="mt-5 text-sm text-zinc-400">
                {billingMessage
                  ? billingMessage
                  : me?.hasPremiumAccess
                  ? "Voce ja tem a camada premium habilitada."
                  : "O plano free continua ativo ate voce decidir subir de nivel."}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {!me?.hasPremiumAccess ? (
                  <>
                    <CFButton
                      type="button"
                      onClick={() => handleStartCheckout("monthly")}
                      disabled={billingBusy !== null || billing?.checkoutReady === false || billingLoading}
                    >
                      {billingBusy === "checkout" ? "Abrindo checkout..." : "Assinar premium mensal"}
                    </CFButton>
                    <CFButton
                      type="button"
                      variant="secondary"
                      onClick={() => handleStartCheckout("annual")}
                      disabled={billingBusy !== null || billing?.checkoutReady === false || billingLoading}
                    >
                      Premium anual
                    </CFButton>
                  </>
                ) : (
                  <CFButton
                    type="button"
                    variant="secondary"
                    onClick={handleOpenPortal}
                    disabled={billingBusy !== null || !billing?.canManageBilling}
                    title={
                      !billing?.canManageBilling
                        ? "Portal disponivel quando houver customer Stripe vinculado."
                        : undefined
                    }
                  >
                    {billingBusy === "portal" ? "Abrindo portal..." : "Gerenciar assinatura"}
                  </CFButton>
                )}

                <CFButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    window.location.href = "/planos?source=profile-membership";
                  }}
                >
                  Ver planos
                </CFButton>
              </div>
            </CFSection>

            <CFSection padding="lg">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-300">
                    <LockKeyhole size={13} />
                    Seguranca
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                    Atualize sua senha
                  </h2>
                </div>
                {pwSaved ? <CFBadge>Senha atualizada</CFBadge> : null}
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label htmlFor="current-password" className="text-sm text-green-400">
                    Senha atual
                  </label>
                  <CFInput
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="********"
                    className="mt-2"
                    disabled={pwSaving || loading}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="new-password" className="text-sm text-green-400">
                      Nova senha
                    </label>
                    <CFInput
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="min. 6 caracteres"
                      className="mt-2"
                      disabled={pwSaving || loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="text-sm text-green-400">
                      Confirmar nova senha
                    </label>
                    <CFInput
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="repita a nova senha"
                      className="mt-2"
                      disabled={pwSaving || loading}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className={`text-sm ${pwError ? "text-red-200" : "text-zinc-400"}`}>
                  {pwError ? pwError : "Dica: use uma senha forte e unica."}
                </div>
                <CFButton type="button" onClick={changePassword} disabled={pwSaving || loading}>
                  {pwSaving ? "Alterando..." : "Alterar senha"}
                </CFButton>
              </div>
            </CFSection>
          </div>
        </div>
      </div>
    </main>
  );
}
