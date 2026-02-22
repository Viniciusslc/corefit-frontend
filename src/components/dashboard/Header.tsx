"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, LogOut } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Treinos", href: "/trainings" },
  { label: "Histórico", href: "/workouts" },
  { label: "Perfil", href: "/profile" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <header className="corefit-header">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between" style={{ height: 64 }}>
          {/* Logo */}
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
          </div>

          {/* Desktop nav */}
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

          {/* Desktop logout */}
          <button
            onClick={logout}
            className="btn btn-sm btn-soft d-none d-md-inline-flex align-items-center gap-2"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>

          {/* Mobile button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="btn btn-sm btn-soft d-md-none"
            aria-label="Menu"
          >
            {mobileMenuOpen ? "Fechar" : "Menu"}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="d-md-none py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="d-flex flex-column gap-2">
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
