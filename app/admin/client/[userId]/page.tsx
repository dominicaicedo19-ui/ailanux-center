"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import AdminGuard from "../../../components/adminGuard";
import Header from "../../../components/header";
import SimulationHistory from "../../../components/simulationHistory";
import { db } from "../../../../lib/firebase";

type ClientProfile = {
  name: string;
  email: string;
  status: string;
};

export default function AdminClientHistoryPage() {
  const parameters = useParams();
  const userId = String(parameters.userId ?? "");

  const [client, setClient] =
    useState<ClientProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClient() {
      if (!userId) {
        setError("No se encontró el cliente.");
        setLoading(false);
        return;
      }

      try {
        const clientSnapshot = await getDoc(
          doc(db, "users", userId)
        );

        if (!clientSnapshot.exists()) {
          setError("El cliente no existe.");
          return;
        }

        const data = clientSnapshot.data();

        setClient({
          name: String(
            data.name ?? "Cliente sin nombre"
          ),
          email: String(data.email ?? ""),
          status: String(
            data.status ?? "unknown"
          ),
        });

        setError("");
      } catch (clientError) {
        console.error(
          "Error cargando cliente:",
          clientError
        );

        setError(
          "No se pudo cargar la información del cliente."
        );
      } finally {
        setLoading(false);
      }
    }

    loadClient();
  }, [userId]);

  function getStatusLabel(status: string) {
    if (status === "active") {
      return "Activo";
    }

    if (status === "blocked") {
      return "Bloqueado";
    }

    if (status === "pending-verification") {
      return "Pendiente de verificación";
    }

    return status;
  }

  function getStatusClasses(status: string) {
    if (status === "active") {
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    }

    if (status === "blocked") {
      return "border-red-400/20 bg-red-500/10 text-red-300";
    }

    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  return (
    <AdminGuard>
      <main className="min-h-screen overflow-x-hidden bg-[#05070a] text-white">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
          <Header />

          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-300"
            >
              ← Volver al panel administrativo
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
              Cargando cliente...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">
              {error}
            </div>
          ) : client ? (
            <>
              <section className="mb-6 overflow-hidden rounded-[24px] border border-amber-400/20 bg-amber-500/[0.05] p-5 sm:mb-8 sm:rounded-3xl sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400 sm:tracking-[0.25em]">
                      Cliente seleccionado
                    </p>

                    <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
                      {client.name}
                    </h1>

                    <p className="mt-2 break-all text-sm text-slate-400 sm:text-base">
                      {client.email}
                    </p>
                  </div>

                  <span
                    className={`w-fit shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClasses(
                      client.status
                    )}`}
                  >
                    {getStatusLabel(client.status)}
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Identificador del cliente
                  </p>

                  <p className="mt-2 break-all font-mono text-xs text-slate-400">
                    {userId}
                  </p>
                </div>
              </section>

              <SimulationHistory
                userId={userId}
                title={`Simulaciones de ${client.name}`}
                emptyTitle="Este cliente no tiene simulaciones guardadas."
                emptyDescription="Cuando guarde una simulación, aparecerá aquí."
              />
            </>
          ) : null}

          <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
            AILANUX CENTER · Historial administrativo
            de clientes
          </footer>
        </div>
      </main>
    </AdminGuard>
  );
}