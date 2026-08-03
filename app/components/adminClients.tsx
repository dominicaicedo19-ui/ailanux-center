"use client";

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
  createdAt: Timestamp | null;
};

export default function AdminClients() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingClientId, setUpdatingClientId] = useState("");

  useEffect(() => {
    let unsubscribeClients: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeClients?.();

      if (!user) {
        setClients([]);
        setLoading(false);
        return;
      }

      unsubscribeClients = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          const loadedClients = snapshot.docs.map((document) => {
            const data = document.data();

            return {
              id: document.id,
              name: String(data.name ?? "Cliente sin nombre"),
              email: String(data.email ?? ""),
              status: String(data.status ?? "unknown"),
              role: String(data.role ?? "client"),
              createdAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt
                  : null,
            };
          });

          loadedClients.sort((first, second) => {
            const firstDate = first.createdAt?.toMillis() ?? 0;
            const secondDate = second.createdAt?.toMillis() ?? 0;

            return secondDate - firstDate;
          });

          setClients(loadedClients);
          setLoadError("");
          setLoading(false);
        },
        () => {
          setLoadError(
            "No se pudo cargar la lista de clientes. Verifica tu acceso administrativo."
          );
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeClients?.();
    };
  }, []);

  const filteredClients = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) {
      return clients;
    }

    return clients.filter((client) => {
      return (
        client.name.toLowerCase().includes(cleanSearch) ||
        client.email.toLowerCase().includes(cleanSearch)
      );
    });
  }, [clients, search]);

  function formatDate(value: Timestamp | null) {
    if (!value) {
      return "Sin fecha";
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

  async function changeClientStatus(client: ClientData) {
    setActionError("");
    setActionMessage("");

    const currentAdmin = auth.currentUser;

    if (!currentAdmin) {
      setActionError("La sesión administrativa no está disponible.");
      return;
    }

    if (currentAdmin.uid === client.id) {
      setActionError(
        "No puedes bloquear tu propia cuenta administrativa."
      );
      return;
    }

    const newStatus =
      client.status === "blocked" ? "active" : "blocked";

    const actionText =
      newStatus === "blocked" ? "bloquear" : "activar";

    const confirmed = window.confirm(
      `¿Seguro que deseas ${actionText} la cuenta de ${client.name}?`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingClientId(client.id);

    try {
      await updateDoc(doc(db, "users", client.id), {
        status: newStatus,
      });

      setActionMessage(
        newStatus === "blocked"
          ? `La cuenta de ${client.name} fue bloqueada.`
          : `La cuenta de ${client.name} fue activada.`
      );
    } catch (error) {
      console.error("Error actualizando cliente:", error);

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
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
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
                (client) => client.status === "active"
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
                (client) => client.status === "blocked"
              ).length
            }
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

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="mt-5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400"
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No se encontraron clientes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-white/10 bg-black/20">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Correo</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Registro</th>
                  <th className="px-5 py-4">Acción</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => {
                  const isCurrentAdmin =
                    auth.currentUser?.uid === client.id;

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
                          {getStatusLabel(client.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-blue-300">
                        {client.role}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(client.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        {isCurrentAdmin ? (
                          <span className="text-xs text-slate-500">
                            Protegida
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              changeClientStatus(client)
                            }
                            disabled={isUpdating}
                            className={
                              client.status === "blocked"
                                ? "rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                : "rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            }
                          >
                            {isUpdating
                              ? "Procesando..."
                              : client.status === "blocked"
                                ? "Activar"
                                : "Bloquear"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}