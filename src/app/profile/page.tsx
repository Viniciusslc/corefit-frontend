"use client";

import { useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/apiFetch";
import { Header } from "@/components/dashboard/Header";

const GOALS = [3, 4, 5, 6] as const;

type Gender = "male" | "female" | "other";

type MeResponse = {
  id: string;
  name: string;
  email: string;
  weeklyGoalDays: number;

  gender?: Gender;
  weightKg?: number | null;
  heightCm?: number | null;
  avatarUrl?: string;
};

type FormState = {
  weeklyGoalDays: number;
  gender: Gender;
  weightKg: string;
  heightCm: string;
  avatarUrl: string;
};

function initialsFromName(name?: string) {
  const n = String(name ?? "").trim();
  if (!n) return "CF";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "C";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] ?? "F";
  return (a + b).toUpperCase();
}

function safeNumberOrNull(v: string) {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function ProfilePage() {
  useRequireAuth();

  const [me, setMe] = useState<MeResponse | null>(null);
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

  // senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const goalLabel = useMemo(() => `${form.weeklyGoalDays} dias/semana`, [form.weeklyGoalDays]);

  const hasChanges = useMemo(() => {
    if (!me) return false;

    const meGender: Gender = (me.gender ?? "other") as Gender;
    const meWeight = me.weightKg ?? null;
    const meHeight = me.heightCm ?? null;
    const meAvatar = me.avatarUrl ?? "";

    const fWeight = safeNumberOrNull(form.weightKg);
    const fHeight = safeNumberOrNull(form.heightCm);

    return (
      Number(me.weeklyGoalDays ?? 4) !== Number(form.weeklyGoalDays) ||
      meGender !== form.gender ||
      meWeight !== fWeight ||
      meHeight !== fHeight ||
      meAvatar !== form.avatarUrl
    );
  }, [me, form]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setSaved(false);

      try {
        const data = await apiFetch<MeResponse>("/users/me");
        setMe(data);

        setForm({
          weeklyGoalDays: Number(data.weeklyGoalDays ?? 4),
          gender: (data.gender ?? "other") as Gender,
          weightKg: data.weightKg == null ? "" : String(data.weightKg),
          heightCm: data.heightCm == null ? "" : String(data.heightCm),
          avatarUrl: String(data.avatarUrl ?? ""),
        });
      } catch (e: any) {
        setError(String(e?.message ?? "Erro ao carregar perfil"));
        setMe(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function setGoal(g: number) {
    setForm((prev) => ({ ...prev, weeklyGoalDays: g }));
    setSaved(false);
  }

  async function saveAll() {
    if (!me) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload: any = {
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
          : prev
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(String(e?.message ?? "Erro ao salvar alterações"));
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
      setPwError("A confirmação da nova senha não confere.");
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

  const avatar = form.avatarUrl?.trim();
  const showImg = avatar.length > 6;
  const initials = initialsFromName(me?.name);

  return (
    <div className="corefit-bg">
      <Header />

      <main style={{ paddingTop: 88, paddingBottom: 28 }}>
        <div className="corefit-container">
          <div className="dashboard-stack">
            {/* Card Perfil */}
            <div style={{ width: "min(860px, 96vw)", margin: "0 auto" }}>
              <div className="card-dark glow-green hero-animate hero-delay-1">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Perfil</h1>
                    <div className="text-muted-soft" style={{ fontSize: 13 }}>
                      Ajuste suas preferências e metas.
                    </div>
                  </div>

                  {me && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          overflow: "hidden",
                          border: "1px solid rgba(34,197,94,0.28)",
                          background: "rgba(34,197,94,0.12)",
                          display: "grid",
                          placeItems: "center",
                          boxShadow: "0 0 0 1px rgba(34,197,94,0.12)",
                        }}
                        title={me.name}
                      >
                        {showImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatar}
                            alt="Avatar"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: 900, color: "rgba(134,239,172,0.95)", fontSize: 14 }}>
                            {initials}
                          </span>
                        )}
                      </div>

                      <div className="text-muted-soft" style={{ fontSize: 13, opacity: 0.9, textAlign: "right" }}>
                        <div style={{ fontWeight: 900, color: "rgba(229,231,235,0.92)" }}>{me.name}</div>
                        <div style={{ opacity: 0.75 }}>{me.email}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>Foto (URL)</div>
                      <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 3, opacity: 0.85 }}>
                        Cole o link da imagem (depois a gente coloca upload).
                      </div>

                      <input
                        className="input-dark"
                        value={form.avatarUrl}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, avatarUrl: e.target.value }));
                          setSaved(false);
                        }}
                        placeholder="https://..."
                        style={{ marginTop: 10 }}
                        disabled={loading || !me}
                      />
                    </div>

                    <div>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>Sexo</div>
                      <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 3, opacity: 0.85 }}>
                        Para estatísticas e personalização.
                      </div>

                      <select
                        className="input-dark"
                        value={form.gender}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, gender: e.target.value as Gender }));
                          setSaved(false);
                        }}
                        style={{ marginTop: 10 }}
                        disabled={loading || !me}
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>Peso (kg)</div>
                      <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 3, opacity: 0.85 }}>
                        Ex.: 84.5
                      </div>

                      <input
                        className="input-dark"
                        inputMode="decimal"
                        value={form.weightKg}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, weightKg: e.target.value }));
                          setSaved(false);
                        }}
                        placeholder="—"
                        style={{ marginTop: 10 }}
                        disabled={loading || !me}
                      />
                    </div>

                    <div>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>Altura (cm)</div>
                      <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 3, opacity: 0.85 }}>
                        Ex.: 178
                      </div>

                      <input
                        className="input-dark"
                        inputMode="numeric"
                        value={form.heightCm}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, heightCm: e.target.value }));
                          setSaved(false);
                        }}
                        placeholder="—"
                        style={{ marginTop: 10 }}
                        disabled={loading || !me}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 14 }}>Meta semanal</div>
                        <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 3, opacity: 0.85 }}>
                          Defina quantos dias por semana você quer treinar.
                        </div>
                      </div>

                      <div className="text-muted-soft" style={{ fontSize: 12, opacity: 0.9 }}>
                        {goalLabel}
                      </div>
                    </div>

                    <div className="d-flex gap-2 flex-wrap mt-3">
                      {GOALS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGoal(g)}
                          disabled={saving || loading || !me}
                          className={`btn ${form.weeklyGoalDays === g ? "btn-green" : "btn-soft"}`}
                          style={{ padding: "8px 12px", fontSize: 13 }}
                          aria-pressed={form.weeklyGoalDays === g}
                        >
                          {g}x
                        </button>
                      ))}
                    </div>

                    <div className="text-muted-soft" style={{ fontSize: 12, marginTop: 10, opacity: 0.75 }}>
                      Você pode alterar essas informações quando quiser.
                    </div>
                  </div>

                  <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div className="text-muted-soft" style={{ fontSize: 12, opacity: 0.85 }}>
                      {loading
                        ? "Carregando…"
                        : saved
                        ? "✅ Alterações salvas"
                        : hasChanges
                        ? "Você tem alterações não salvas"
                        : "Tudo em dia"}
                    </div>

                    <button
                      type="button"
                      className={`btn ${hasChanges ? "btn-green" : "btn-soft"}`}
                      onClick={saveAll}
                      disabled={saving || loading || !me || !hasChanges}
                      style={{ padding: "10px 14px", fontSize: 13, minWidth: 160 }}
                    >
                      {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>

                  {!!error && (
                    <div className="card-dark mt-3" style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
                      <div style={{ fontWeight: 900, marginBottom: 6, color: "#fecaca" }}>Erro</div>
                      <div className="text-muted-soft" style={{ fontSize: 13 }}>{error}</div>
                    </div>
                  )}

                  {loading && (
                    <div className="text-muted-soft" style={{ fontSize: 13, marginTop: 12 }}>
                      Carregando…
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Segurança: Alterar senha */}
            <div style={{ width: "min(860px, 96vw)", margin: "16px auto 0" }}>
              <div className="card-dark hero-animate hero-delay-2">
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>Segurança</div>
                    <div className="text-muted-soft" style={{ fontSize: 13, marginTop: 2 }}>
                      Altere sua senha quando quiser.
                    </div>
                  </div>

                  <div className="text-muted-soft" style={{ fontSize: 12, opacity: 0.85 }}>
                    {pwSaved ? "✅ Senha atualizada" : ""}
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>Senha atual</div>
                    <input
                      className="input-dark"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ marginTop: 8 }}
                      disabled={pwSaving || loading}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>Nova senha</div>
                    <input
                      className="input-dark"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="mín. 6 caracteres"
                      style={{ marginTop: 8 }}
                      disabled={pwSaving || loading}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>Confirmar nova senha</div>
                    <input
                      className="input-dark"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="repita a nova senha"
                      style={{ marginTop: 8 }}
                      disabled={pwSaving || loading}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div className="text-muted-soft" style={{ fontSize: 12, opacity: 0.85 }}>
                    {pwError ? `⚠️ ${pwError}` : "Dica: use uma senha forte e única."}
                  </div>

                  <button
                    type="button"
                    className="btn btn-green"
                    onClick={changePassword}
                    disabled={pwSaving || loading}
                    style={{ padding: "10px 14px", fontSize: 13, minWidth: 160 }}
                  >
                    {pwSaving ? "Alterando..." : "Alterar senha"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
