"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { auth, db } from "../../lib/firebase";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [dateTime, setDateTime] =
    useState<Date | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    setDateTime(new Date());

    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          return;
        }

        setIsAuthenticated(true);

        try {
          const adminSnapshot = await getDoc(
            doc(db, "admins", user.uid)
          );

          const adminData = adminSnapshot.data();

          setIsAdmin(
            adminSnapshot.exists() &&
              adminData?.active === true
          );
        } catch (error) {
          console.error(
            "No se pudo verificar el acceso administrativo:",
            error
          );

          setIsAdmin(false);
        }
      }
    );

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const formattedDate = dateTime
    ? new Intl.DateTimeFormat("es-CO", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(dateTime)
    : "Cargando fecha...";

  const formattedTime = dateTime
    ? new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(dateTime)
    : "--:--:--";

  function getLinkClasses(path: string) {
    const isActive =
      path === "/"
        ? pathname === "/"
        : pathname.startsWith(path);

    return isActive
      ? "rounded-xl border border-blue-400/30 bg-blue-500/15 px-4 py-3 text-center text-sm font-semibold text-blue-300"
      : "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-300";
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await signOut(auth);
      setMenuOpen(false);
      router.replace("/login");
    } catch (error) {
      console.error(
        "No se pudo cerrar la sesión:",
        error
      );

      setLoggingOut(false);
    }
  }

  return (
    <header className="mb-8 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl sm:mb-10 sm:rounded-[28px]">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 sm:gap-4"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-400/30 bg-black/50 shadow-lg shadow-amber-500/10 sm:h-24 sm:w-24">
              <Image
                src="/images/logo-ailanux.png"
                alt="Logo de AILANUX PRO"
                fill
                priority
                sizes="96px"
                className="object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-amber-400 sm:text-xs sm:tracking-[0.35em]">
                AILANUX PRO
              </p>

              <h1 className="mt-1 truncate text-xl font-bold tracking-wide text-white sm:text-3xl">
                AILANUX{" "}
                <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                  CENTER
                </span>
              </h1>

              <p className="mt-1 hidden text-sm text-slate-400 sm:block">
                Automatización y proyección
                inteligente
              </p>
            </div>
          </Link>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() =>
                setMenuOpen((current) => !current)
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={
                menuOpen
                  ? "Cerrar menú"
                  : "Abrir menú"
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white transition hover:border-blue-400/30 hover:text-blue-300 lg:hidden"
            >
              {menuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Fecha y hora
            </p>

            <p className="mt-1 capitalize text-xs font-medium text-slate-300 sm:text-sm">
              {formattedDate}
            </p>

            <p className="mt-1 text-lg font-bold text-white sm:text-xl">
              {formattedTime}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/70">
              Estado de la plataforma
            </p>

            <div className="mt-2 flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />

                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>

              <div>
                <p className="font-bold text-emerald-300">
                  Sistema en línea
                </p>

                <p className="text-xs text-slate-500">
                  Calculadora disponible
                </p>
              </div>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="mt-5 hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-4">
            <Link
              href="/"
              className={getLinkClasses("/")}
            >
              Calculadora y perfil
            </Link>

            <Link
              href="/history"
              className={getLinkClasses("/history")}
            >
              Historial
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
              >
                Panel administrativo
              </Link>
            ) : (
              <div className="hidden lg:block" />
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut
                ? "Cerrando sesión..."
                : "Cerrar sesión"}
            </button>
          </nav>
        )}
      </div>

      {isAuthenticated && menuOpen && (
        <nav
          id="mobile-navigation"
          className="grid gap-3 border-t border-white/10 bg-black/20 p-4 lg:hidden"
        >
          <Link
            href="/"
            className={getLinkClasses("/")}
          >
            Calculadora y perfil
          </Link>

          <Link
            href="/history"
            className={getLinkClasses("/history")}
          >
            Historial de simulaciones
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              Panel administrativo
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut
              ? "Cerrando sesión..."
              : "Cerrar sesión"}
          </button>
        </nav>
      )}
    </header>
  );
}