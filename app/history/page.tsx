import Link from "next/link";
import AuthGuard from "../components/authGuard";
import Header from "../components/header";
import LogoutButton from "../components/logoutButton";
import SimulationHistory from "../components/simulationHistory";

export default function HistoryPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#05070a] text-white">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto min-h-screen max-w-6xl px-5 py-8 sm:px-8">
          <Header />

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-blue-400/40 hover:text-blue-300"
            >
              ← Volver a la calculadora
            </Link>

            <LogoutButton />
          </div>

          <SimulationHistory />

          <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
            AILANUX CENTER · Historial privado de simulaciones
          </footer>
        </div>
      </main>
    </AuthGuard>
  );
}