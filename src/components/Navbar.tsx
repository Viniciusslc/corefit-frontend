"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

import { CorefitLogo } from "@/components/logo/CorefitLogo";

const AUTH_CTA_BY_PATH: Record<string, { href: string; label: string }> = {
  "/login": { href: "/register", label: "Criar conta" },
  "/register": { href: "/login", label: "Entrar" },
};

const PUBLIC_SHELL_PATHS = new Set([
  "/forgot-password",
  "/reset-password",
  "/login",
  "/register",
]);

const publicNav = [
  { label: "Funcionalidades", href: "/funcionalidades" },
  { label: "Planos", href: "/planos" },
  { label: "Sobre", href: "/sobre" },
];

const privateNav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Treinos", href: "/trainings" },
  { label: "Historico", href: "/workouts" },
  { label: "Perfil", href: "/profile" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [logged, setLogged] = useState(false);

  const forcePublicShell = PUBLIC_SHELL_PATHS.has(pathname);
  const authCta = AUTH_CTA_BY_PATH[pathname];
  const showDualPublicActions = !logged && !authCta;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLogged(!forcePublicShell && !!localStorage.getItem("token"));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [forcePublicShell, pathname]);

  function logout() {
    localStorage.removeItem("token");
    setLogged(false);
    router.push("/login");
  }

  const navItems = logged ? privateNav : publicNav;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/76 via-black/52 to-transparent backdrop-blur-[12px]" />

      <div className="relative mx-auto flex h-20 max-w-[1380px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href={logged ? "/dashboard" : "/"} className="shrink-0">
          <div className="rounded-2xl px-2 py-2 transition duration-200 hover:bg-white/[0.04]">
            <CorefitLogo size="md" />
          </div>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.72),rgba(8,8,8,0.68))] px-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                  isActive
                    ? "bg-white/8 text-white"
                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!logged ? (
          <div className="flex items-center gap-3">
            {authCta ? (
              <Link
                href={authCta.href}
                className="inline-flex items-center justify-center rounded-[1rem] border border-green-400/22 bg-green-500/[0.12] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_0_rgba(34,197,94,0)] transition duration-200 hover:border-green-400/40 hover:bg-green-500/[0.16] hover:shadow-[0_0_26px_rgba(34,197,94,0.16)]"
              >
                {authCta.label}
              </Link>
            ) : showDualPublicActions ? (
              <>
                <Link
                  href="/login"
                  className="hidden items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:border-white/16 hover:bg-white/[0.07] md:inline-flex"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-[1rem] border border-green-400/22 bg-green-500/[0.12] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_0_rgba(34,197,94,0)] transition duration-200 hover:border-green-400/40 hover:bg-green-500/[0.16] hover:shadow-[0_0_26px_rgba(34,197,94,0.16)]"
                >
                  Criar conta
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-[1rem] border border-green-400/22 bg-green-500/[0.12] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_0_rgba(34,197,94,0)] transition duration-200 hover:border-green-400/40 hover:bg-green-500/[0.16] hover:shadow-[0_0_26px_rgba(34,197,94,0.16)]"
              >
                Entrar
              </Link>
            )}
          </div>
        ) : (
          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-black/24 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:border-white/16 hover:bg-white/[0.06]"
          >
            <LogOut size={16} />
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
