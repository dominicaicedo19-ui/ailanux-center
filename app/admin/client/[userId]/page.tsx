"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import AdminGuard from "../../../components/adminGuard";
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
          setLoading(false);
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

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/admin"
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-blue-400/30 hover:text-blue-300"
          >
            ← Volver al panel
          </Link>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
              Cargando cliente...
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">
              {error}
            </div>
          ) : client ? (
            <>
              <section className="my-8 rounded-3xl border border-amber-400/20 bg-amber-500/[0.05] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                  Cliente seleccionado
                </p>

                <h1 className="mt-2 text-3xl font-bold text-white">
                  {client.name}
                </h1>

                <p className="mt-2 text-slate-400">
                  {client.email}
                </p>

                <p className="mt-3 text-sm text-slate-500">
                  Estado:{" "}
                  <span className="font-semibold text-blue-300">
                    {client.status}
                  </span>
                </p>
              </section>

              <SimulationHistory
                userId={userId}
                title={`Simulaciones de ${client.name}`}
                emptyTitle="Este cliente no tiene simulaciones guardadas."
                emptyDescription="Cuando guarde una simulación, aparecerá aquí."
              />
            </>
          ) : null}
        </div>
      </main>
    </AdminGuard>
  );
}