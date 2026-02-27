"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dumbbell, LogOut } from "lucide-react";

const publicNav = [
  { label: "Funcionalidades", href: "/funcionalidades" },
  { label: "Planos", href: "/planos" },
  { label: "Sobre", href: "/sobre" },
];

const privateNav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Treinos", href: "/trainings" },
  { label: "Histórico", href: "/workouts" },
  { label: "Perfil", href: "/profile" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [logged, setLogged] = useState(false);

  useEffect(() => {
    setLogged(!!localStorage.getItem("token"));
  }, [pathname]);

  function logout() {
    localStorage.removeItem("token");
    setLogged(false);
    router.push("/login");
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const navItems = logged ? privateNav : publicNav;

  return (
    <header className="corefit-topbar">
      <div className="corefit-container">
        <div className="corefit-topbar-inner">
          {/* LOGO */}
          <Link
            href={logged ? "/dashboard" : "/"}
            className="corefit-brand"
            style={{ textDecoration: "none", color: "inherit" }}
          >
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
            <span style={{ fontWeight: 900, letterSpacing: -0.3 }}>
              CORE<span style={{ color: "#22c55e" }}>FIT</span>
            </span>
          </Link>

          {/* NAV */}
          <nav className="corefit-nav">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* AÇÃO DIREITA */}
          {!logged ? (
            <Link
              href="/login"
              className="btn btn-soft"
              style={{ padding: "8px 12px", fontSize: 13 }}
            >
              Entrar
            </Link>
          ) : (
            <button
              onClick={logout}
              className="btn btn-soft d-inline-flex align-items-center gap-2"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}