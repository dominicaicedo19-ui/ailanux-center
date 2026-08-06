import AdminActivity from "../components/adminActivity";
import AdminClients from "../components/adminClients";
import AdminGuard from "../components/adminGuard";
import Header from "../components/header";

export default function AdminPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen overflow-x-hidden bg-[#05070a] text-white">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
          <Header />

          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 sm:tracking-[0.25em]">
              Panel administrativo
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Gestión de clientes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Consulta clientes, revisa sus simulaciones y administra el estado
              de cada cuenta.
            </p>
          </div>

          <AdminClients />

          <div className="mt-8">
            <AdminActivity />
          </div>

          <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
            AILANUX CENTER · Acceso administrativo privado
          </footer>
        </div>
      </main>
    </AdminGuard>
  );
}