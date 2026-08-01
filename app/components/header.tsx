"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Header() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());

    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  return (
    <header className="mb-10 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-amber-400/30 bg-black/50 shadow-lg shadow-amber-500/10 sm:h-24 sm:w-24">
            <Image
              src="/images/logo-ailanux.png"
              alt="Logo de AILANUX PRO"
              fill
              priority
              sizes="96px"
              className="object-contain"
            />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400 sm:text-xs">
              AILANUX PRO
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-wide text-white sm:text-3xl">
              AILANUX{" "}
              <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                CENTER
              </span>
            </h1>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Automatización y proyección inteligente
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Fecha y hora
            </p>

            <p className="mt-1 capitalize text-sm font-medium text-slate-300">
              {formattedDate}
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {formattedTime}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/70">
              Estado de la plataforma
            </p>

            <div className="mt-2 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
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
      </div>
    </header>
  );
}