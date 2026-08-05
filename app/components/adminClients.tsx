"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type ClientData = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  simulationCount: number;
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
};

type StatusFilter =
  | "all"
  | "active"
  | "blocked"
  | "pending-verification";

type SortOption =
  | "last-login-desc"
  | "created-desc"
  | "name-asc"
  | "simulations-desc";

const CLIENTS_PER_PAGE = 10;

export default function AdminClients() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [sortOption, setSortOption] =
    useState<SortOption>("last-login-desc");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [updatingClientId, setUpdatingClientId] =
    useState("");

  useEffect(() => {
    let unsubscribeClients: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeClients?.();

        if (!user) {
          setClients([]);
          setLoading(false);
          return;
        }

        setLoading(true);

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
                  status: String(
                    data.status ?? "unknown"
                  ),
                  role: String(data.role ?? "client"),
                  simulationCount: Math.max(
                    0,
                    Number(data.simulationCount ?? 0)
                  ),
                  createdAt:
                    data.createdAt instanceof Timestamp
                      ? data.createdAt
                      : null,
                  lastLoginAt:
                    data.lastLoginAt instanceof Timestamp
                      ? data.lastLoginAt
                      : null,
                } satisfies ClientData;
              }
            );

            setClients(loadedClients);
            setLoadError("");
            setLoading(false);
          },
          (error) => {
            console.error(
              "Error cargando clientes:",
              error
            );

            setLoadError(
              "No se pudo cargar la lista de clientes. Verifica tu acceso administrativo."
            );

            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeClients?.();
    };
  }, []);

  const filteredClients = useMemo(() => {
    const cleanSearch = search
      .trim()
      .toLowerCase();

    const matchingClients = clients.filter(
      (client) => {
        const matchesSearch =
          !cleanSearch ||
          client.name
            .toLowerCase()
            .includes(cleanSearch) ||
          client.email
            .toLowerCase()
            .includes(cleanSearch);

        const matchesStatus =
          statusFilter === "all" ||
          client.status === statusFilter;

        return matchesSearch && matchesStatus;
      }
    );

    return [...matchingClients].sort(
      (first, second) => {
        if (sortOption === "last-login-desc") {
          const firstLogin =
            first.lastLoginAt?.toMillis() ?? 0;

          const secondLogin =
            second.lastLoginAt?.toMillis() ?? 0;

          return secondLogin - firstLogin;
        }

        if (sortOption === "created-desc") {
          const firstCreated =
            first.createdAt?.toMillis() ?? 0;

          const secondCreated =
            second.createdAt?.toMillis() ?? 0;

          return secondCreated - firstCreated;
        }

        if (sortOption === "name-asc") {
          return first.name.localeCompare(
            second.name,
            "es",
            {
              sensitivity: "base",
            }
          );
        }

        if (sortOption === "simulations-desc") {
          return (
            second.simulationCount -
            first.simulationCount
          );
        }

        return 0;
      }
    );
  }, [
    clients,
    search,
    statusFilter,
    sortOption,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredClients.length / CLIENTS_PER_PAGE
    )
  );

  const paginatedClients = useMemo(() => {
    const startIndex =
      (currentPage - 1) * CLIENTS_PER_PAGE;

    return filteredClients.slice(
      startIndex,
      startIndex + CLIENTS_PER_PAGE
    );
  }, [filteredClients, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOption]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalSimulations = useMemo(() => {
    return clients.reduce(
      (total, client) =>
        total + client.simulationCount,
      0
    );
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

  function formatLastLogin(
    value: Timestamp | null
  ) {
    if (!value) {
      return "Nunca";
    }

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value.toDate());
  }

  function getStatusLabel(status: string) {
    if (status === "active") {
      return "Activo";
    }

    if (status === "blocked") {
      return "Bloqueado";
    }

    if (status === "pending-verification") {
      return "Pendiente";
    }

    return status;
  }

  function getStatusClasses(status: string) {
    if (status === "active") {
      return "rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300";
    }

    if (status === "blocked") {
      return "rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300";
    }

    return "rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300";
  }

  async function changeClientStatus(
    client: ClientData
  ) {
    setActionError("");
    setActionMessage("");

    const currentAdmin = auth.currentUser;

    if (!currentAdmin) {
      setActionError(
        "La sesión administrativa no está disponible."
      );

      return;
    }

    if (currentAdmin.uid === client.id) {
      setActionError(
        "No puedes bloquear tu propia cuenta administrativa."
      );

      return;
    }

    const newStatus =
      client.status === "blocked"
        ? "active"
        : "blocked";

    const actionText =
      newStatus === "blocked"
        ? "bloquear"
        : "activar";

    const confirmed = window.confirm(
      `¿Seguro que deseas ${actionText} la cuenta de ${client.name}?`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingClientId(client.id);

    try {
      await updateDoc(
        doc(db, "users", client.id),
        {
          status: newStatus,
        }
      );

      setActionMessage(
        newStatus === "blocked"
          ? `La cuenta de ${client.name} fue bloqueada.`
          : `La cuenta de ${client.name} fue activada.`
      );
    } catch (error) {
      console.error(
        "Error actualizando cliente:",
        error
      );

      setActionError(
        "No se pudo cambiar el estado del cliente. Verifica las reglas de Firestore."
      );
    } finally {
      setUpdatingClientId("");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
        Cargando clientes...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">
        {loadError}
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Clientes registrados
          </p>

          <p className="mt-3 text-4xl font-bold text-amber-300">
            {clients.length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Cuentas activas
          </p>

          <p className="mt-3 text-4xl font-bold text-emerald-300">
            {
              clients.filter(
                (client) =>
                  client.status === "active"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Cuentas bloqueadas
          </p>

          <p className="mt-3 text-4xl font-bold text-red-300">
            {
              clients.filter(
                (client) =>
                  client.status === "blocked"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Simulaciones guardadas
          </p>

          <p className="mt-3 text-4xl font-bold text-blue-300">
            {totalSimulations}
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
            Administración
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            Clientes de AILANUX CENTER
          </h2>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por nombre o correo..."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StatusFilter
                )
              }
              className="w-full rounded-xl border border-white/10 bg-[#11151b] px-4 py-3 text-white outline-none focus:border-blue-400"
            >
              <option value="all">
                Todos los estados
              </option>

              <option value="active">
                Solo activos
              </option>

              <option value="blocked">
                Solo bloqueados
              </option>

              <option value="pending-verification">
                Pendientes
              </option>
            </select>

            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value as SortOption
                )
              }
              className="w-full rounded-xl border border-white/10 bg-[#11151b] px-4 py-3 text-white outline-none focus:border-blue-400"
            >
              <option value="last-login-desc">
                Último acceso reciente
              </option>

              <option value="created-desc">
                Registro más reciente
              </option>

              <option value="name-asc">
                Nombre A–Z
              </option>

              <option value="simulations-desc">
                Más simulaciones
              </option>
            </select>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Mostrando{" "}
            {filteredClients.length === 0
              ? 0
              : (currentPage - 1) *
                  CLIENTS_PER_PAGE +
                1}
            {" – "}
            {Math.min(
              currentPage * CLIENTS_PER_PAGE,
              filteredClients.length
            )}{" "}
            de {filteredClients.length} resultados
          </p>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No se encontraron clientes con los filtros
            seleccionados.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-left">
                <thead className="border-b border-white/10 bg-black/20">
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">
                      Cliente
                    </th>

                    <th className="px-5 py-4">
                      Correo
                    </th>

                    <th className="px-5 py-4">
                      Estado
                    </th>

                    <th className="px-5 py-4">
                      Rol
                    </th>

                    <th className="px-5 py-4 text-center">
                      Simulaciones
                    </th>

                    <th className="px-5 py-4">
                      Último acceso
                    </th>

                    <th className="px-5 py-4">
                      Registro
                    </th>

                    <th className="px-5 py-4">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedClients.map((client) => {
                    const isCurrentAdmin =
                      auth.currentUser?.uid ===
                      client.id;

                    const isUpdating =
                      updatingClientId === client.id;

                    return (
                      <tr
                        key={client.id}
                        className="border-b border-white/[0.06] last:border-0"
                      >
                        <td className="px-5 py-4 font-semibold text-white">
                          {client.name}

                          {isCurrentAdmin && (
                            <span className="ml-2 text-xs font-normal text-amber-300">
                              Tu cuenta
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-400">
                          {client.email}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={getStatusClasses(
                              client.status
                            )}
                          >
                            {getStatusLabel(
                              client.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-blue-300">
                          {client.role}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2 font-bold text-blue-300">
                            {client.simulationCount}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {formatLastLogin(
                            client.lastLoginAt
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            client.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/client/${client.id}`}
                              className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
                            >
                              Ver historial
                            </Link>

                            {isCurrentAdmin ? (
                              <span className="px-2 text-xs text-slate-500">
                                Cuenta protegida
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  changeClientStatus(
                                    client
                                  )
                                }
                                disabled={isUpdating}
                                className={
                                  client.status ===
                                  "blocked"
                                    ? "rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    : "rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                }
                              >
                                {isUpdating
                                  ? "Procesando..."
                                  : client.status ===
                                      "blocked"
                                    ? "Activar"
                                    : "Bloquear"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredClients.length >
              CLIENTS_PER_PAGE && (
              <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Página {currentPage} de{" "}
                  {totalPages}
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    disabled={currentPage === 1}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-blue-400/30 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                      )
                    }
                    disabled={
                      currentPage === totalPages
                    }
                    className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}