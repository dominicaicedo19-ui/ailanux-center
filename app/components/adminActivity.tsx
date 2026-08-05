"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  collectionGroup,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type ClientActivity = {
  id: string;
  name: string;
  email: string;
  lastLoginAt: Timestamp | null;
};

type RecentSimulation = {
  id: string;
  userId: string;
  capital: number;
  currency: "USD" | "USC";
  percentage: number;
  finalCapital: number;
  createdAt: Timestamp | null;
};

export default function AdminActivity() {
  const [clients, setClients] = useState<ClientActivity[]>([]);
  const [simulations, setSimulations] = useState<
    RecentSimulation[]
  >([]);

  const [clientsLoading, setClientsLoading] = useState(true);
  const [simulationsLoading, setSimulationsLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeClients: (() => void) | undefined;
    let unsubscribeSimulations: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeClients?.();
        unsubscribeSimulations?.();

        if (!user) {
          setClients([]);
          setSimulations([]);
          setClientsLoading(false);
          setSimulationsLoading(false);
          return;
        }

        setError("");
        setClientsLoading(true);
        setSimulationsLoading(true);

        unsubscribeClients = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            const loadedClients = snapshot.docs.map(
              (document) => {
                const data = document.data();

                return {
                  id: document.id,
                  name: String(
                    data.name ?? "Cliente sin nombre"
                  ),
                  email: String(data.email ?? ""),
                  lastLoginAt:
                    data.lastLoginAt instanceof Timestamp
                      ? data.lastLoginAt
                      : null,
                } satisfies ClientActivity;
              }
            );

            setClients(loadedClients);
            setClientsLoading(false);
          },
          (snapshotError) => {
            console.error(
              "Error cargando accesos recientes:",
              snapshotError
            );

            setError(
              "No se pudo cargar toda la actividad reciente."
            );

            setClientsLoading(false);
          }
        );

        const simulationsQuery = query(
          collectionGroup(db, "simulations"),
          orderBy("createdAt", "desc"),
          limit(8)
        );

        unsubscribeSimulations = onSnapshot(
          simulationsQuery,
          (snapshot) => {
            const loadedSimulations = snapshot.docs.map(
              (document) => {
                const data = document.data();

                return {
                  id: document.id,
                  userId: String(
                    data.userId ??
                      document.ref.parent.parent?.id ??
                      ""
                  ),
                  capital: Number(data.capital ?? 0),
                  currency:
                    data.currency === "USC"
                      ? "USC"
                      : "USD",
                  percentage: Number(
                    data.percentage ?? 0
                  ),
                  finalCapital: Number(
                    data.finalCapital ?? 0
                  ),
                  createdAt:
                    data.createdAt instanceof Timestamp
                      ? data.createdAt
                      : null,
                } satisfies RecentSimulation;
              }
            );

            setSimulations(loadedSimulations);
            setSimulationsLoading(false);
          },
          (snapshotError) => {
            console.error(
              "Error cargando simulaciones recientes:",
              snapshotError
            );

            setError(
              "No se pudo cargar toda la actividad reciente."
            );

            setSimulationsLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeClients?.();
      unsubscribeSimulations?.();
    };
  }, []);

  const clientsById = useMemo(() => {
    return new Map(
      clients.map((client) => [client.id, client])
    );
  }, [clients]);

  const recentClients = useMemo(() => {
    return [...clients]
      .filter(
        (client) =>
          client.lastLoginAt !== null &&
          client.id !== auth.currentUser?.uid
      )
      .sort((first, second) => {
        const firstDate =
          first.lastLoginAt?.toMillis() ?? 0;

        const secondDate =
          second.lastLoginAt?.toMillis() ?? 0;

        return secondDate - firstDate;
      })
      .slice(0, 6);
  }, [clients]);

  function formatDate(value: Timestamp | null) {
    if (!value) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value.toDate());
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <section className="mt-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
          Monitoreo
        </p>

        <h2 className="mt-1 text-2xl font-bold text-white">
          Actividad reciente
        </h2>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="font-bold text-white">
              Últimos accesos
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Clientes que ingresaron recientemente
            </p>
          </div>

          {clientsLoading ? (
            <div className="p-8 text-center text-slate-400">
              Cargando accesos...
            </div>
          ) : recentClients.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Todavía no hay accesos registrados.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {client.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {client.email}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {formatDate(client.lastLoginAt)}
                    </p>
                  </div>

                  <Link
                    href={`/admin/client/${client.id}`}
                    className="text-sm font-semibold text-blue-300 hover:text-blue-200"
                  >
                    Ver historial →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="font-bold text-white">
              Últimas simulaciones
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Simulaciones guardadas recientemente
            </p>
          </div>

          {simulationsLoading ? (
            <div className="p-8 text-center text-slate-400">
              Cargando simulaciones...
            </div>
          ) : simulations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Todavía no hay simulaciones guardadas.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {simulations.map((simulation) => {
                const client = clientsById.get(
                  simulation.userId
                );

                return (
                  <div
                    key={`${simulation.userId}-${simulation.id}`}
                    className="px-5 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {client?.name ??
                            "Cliente sin nombre"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {formatMoney(
                            simulation.capital
                          )}{" "}
                          {simulation.currency}
                          {" · "}
                          Perfil {simulation.percentage}%
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {formatDate(
                            simulation.createdAt
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-500">
                          Capital proyectado
                        </p>

                        <p className="font-bold text-amber-300">
                          {formatMoney(
                            simulation.finalCapital
                          )}{" "}
                          {simulation.currency}
                        </p>
                      </div>
                    </div>

                    {simulation.userId && (
                      <Link
                        href={`/admin/client/${simulation.userId}`}
                        className="mt-2 inline-block text-xs font-semibold text-blue-300 hover:text-blue-200"
                      >
                        Abrir cliente →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}