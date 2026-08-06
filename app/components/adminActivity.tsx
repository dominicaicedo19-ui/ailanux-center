"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
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
  const [clients, setClients] = useState<
    ClientActivity[]
  >([]);

  const [simulations, setSimulations] = useState<
    RecentSimulation[]
  >([]);

  const [clientsLoading, setClientsLoading] =
    useState(true);

  const [
    simulationsLoading,
    setSimulationsLoading,
  ] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeClients:
      | (() => void)
      | undefined;

    let unsubscribeSimulations:
      | (() => void)
      | undefined;

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
            const loadedClients =
              snapshot.docs.map((document) => {
                const data = document.data();

                return {
                  id: document.id,
                  name: String(
                    data.name ??
                      "Cliente sin nombre"
                  ),
                  email: String(
                    data.email ?? ""
                  ),
                  lastLoginAt:
                    data.lastLoginAt instanceof
                    Timestamp
                      ? data.lastLoginAt
                      : null,
                } satisfies ClientActivity;
              });

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
            const loadedSimulations =
              snapshot.docs.map((document) => {
                const data = document.data();

                return {
                  id: document.id,
                  userId: String(
                    data.userId ??
                      document.ref.parent.parent
                        ?.id ??
                      ""
                  ),
                  capital: Number(
                    data.capital ?? 0
                  ),
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
                    data.createdAt instanceof
                    Timestamp
                      ? data.createdAt
                      : null,
                } satisfies RecentSimulation;
              });

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
      clients.map((client) => [
        client.id,
        client,
      ])
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

  function formatDate(
    value: Timestamp | null
  ) {
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
    <section>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400 sm:tracking-[0.25em]">
          Monitoreo
        </p>

        <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
          Actividad reciente
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Consulta los últimos accesos y las
          simulaciones guardadas recientemente.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-300"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Últimos accesos */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5">
            <h3 className="font-bold text-white">
              Últimos accesos
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Clientes que ingresaron
              recientemente
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
            <div className="space-y-3 p-4 sm:space-y-0 sm:p-0">
              {recentClients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b sm:border-white/[0.06] sm:bg-transparent sm:px-5 sm:py-4 sm:last:border-b-0"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-white">
                        {client.name}
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {client.email}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

                        <p className="text-xs text-slate-500">
                          {formatDate(
                            client.lastLoginAt
                          )}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/client/${client.id}`}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 sm:w-auto sm:shrink-0"
                    >
                      Ver historial
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Últimas simulaciones */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5">
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
              Todavía no hay simulaciones
              guardadas.
            </div>
          ) : (
            <div className="space-y-4 p-4 sm:space-y-0 sm:p-0">
              {simulations.map((simulation) => {
                const client = clientsById.get(
                  simulation.userId
                );

                return (
                  <article
                    key={`${simulation.userId}-${simulation.id}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b sm:border-white/[0.06] sm:bg-transparent sm:px-5 sm:py-4 sm:last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-white">
                          {client?.name ??
                            "Cliente sin nombre"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            simulation.createdAt
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                        {simulation.percentage}%
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Capital inicial
                        </p>

                        <p className="mt-2 break-words text-sm font-bold text-white">
                          {formatMoney(
                            simulation.capital
                          )}{" "}
                          {simulation.currency}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Proyectado
                        </p>

                        <p className="mt-2 break-words text-sm font-bold text-amber-300">
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
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 sm:w-auto"
                      >
                        Abrir cliente
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}