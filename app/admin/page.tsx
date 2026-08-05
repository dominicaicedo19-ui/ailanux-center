import Link from "next/link";
import AdminClients from "../components/adminClients";
import AdminGuard from "../components/adminGuard";
import Header from "../components/header";
import LogoutButton from "../components/logoutButton";
import AdminActivity from "../components/adminActivity";

export default function AdminPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#05070a] text-white">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8">
          <Header />

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                Panel administrativo
              </p>

              <h1 className="mt-1 text-3xl font-bold text-white">
                Gestión de clientes
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-blue-400/40 hover:text-blue-300"
              >
                Volver a la calculadora
              </Link>

              <LogoutButton />
            </div>
          </div>

          <AdminClients />
          
          <AdminActivity />

          <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
            AILANUX CENTER · Acceso administrativo privado
          </footer>
        </div>
      </main>
    </AdminGuard>
  );
}