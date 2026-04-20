"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crown, Dumbbell, LogOut, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { clearStoredToken, getAuthSession } from "@/lib/auth-session";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const session = useMemo(() => getAuthSession(), []);
  const isAdmin = session?.role === "admin";
  const hasPremium = Boolean(session?.hasPremiumAccess);

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Treinos", href: "/trainings" },
    { label: "Historico", href: "/workouts" },
    { label: "Planos", href: "/planos" },
    { label: "Perfil", href: "/profile" },
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  function logout() {
    clearStoredToken();
    router.push("/login");
  }

  return (
    <header className="corefit-header">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between" style={{ height: 64 }}>
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center justify-content-center glow"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "#22c55e",
                color: "#03150a",
              }}
            >
              <Dumbbell size={18} />
            </div>

            <div style={{ fontWeight: 900, letterSpacing: -0.3 }}>
              CORE<span style={{ color: "#22c55e" }}>FIT</span>
            </div>

            <div className="d-none d-md-flex align-items-center gap-2" style={{ marginLeft: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: hasPremium
                    ? "1px solid rgba(34,197,94,0.24)"
                    : "1px solid rgba(255,255,255,0.10)",
                  background: hasPremium ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                  color: hasPremium ? "rgba(134,239,172,0.96)" : "rgba(229,231,235,0.78)",
                }}
              >
                <Crown size={12} />
                {hasPremium ? "Premium" : "Free"}
              </span>

              {isAdmin ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    border: "1px solid rgba(250,204,21,0.20)",
                    background: "rgba(250,204,21,0.08)",
                    color: "rgba(253,224,71,0.96)",
                  }}
                >
                  <ShieldCheck size={12} />
                  Admin
                </span>
              ) : null}
            </div>
          </div>

          <nav className="d-none d-md-flex align-items-center gap-4">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-decoration-none"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: active ? "#22c55e" : "rgba(229,231,235,0.65)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="btn btn-sm btn-soft d-none d-md-inline-flex align-items-center gap-2"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="btn btn-sm btn-soft d-md-none"
            aria-label="Menu"
          >
            {mobileMenuOpen ? "Fechar" : "Menu"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="d-md-none py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center gap-2" style={{ marginBottom: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    border: hasPremium
                      ? "1px solid rgba(34,197,94,0.24)"
                      : "1px solid rgba(255,255,255,0.10)",
                    background: hasPremium ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                    color: hasPremium ? "rgba(134,239,172,0.96)" : "rgba(229,231,235,0.78)",
                  }}
                >
                  <Crown size={12} />
                  {hasPremium ? "Premium" : "Free"}
                </span>

                {isAdmin ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      border: "1px solid rgba(250,204,21,0.20)",
                      background: "rgba(250,204,21,0.08)",
                      color: "rgba(253,224,71,0.96)",
                    }}
                  >
                    <ShieldCheck size={12} />
                    Admin
                  </span>
                ) : null}
              </div>

              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-decoration-none py-2"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: active ? "#22c55e" : "rgba(229,231,235,0.65)",
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button onClick={logout} className="btn btn-soft d-inline-flex align-items-center gap-2 mt-2">
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
