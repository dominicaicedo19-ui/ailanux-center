"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Currency = "USD" | "USC";

type Simulation = {
  id: string;
  capital: number;
  currency: Currency;
  percentage: number;
  lot: number;
  finalCapital: number;
  createdAt: Timestamp | null;
};

export default function SimulationHistory() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeSimulations: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeSimulations?.();

      if (!user) {
        setSimulations([]);
        setLoading(false);
        return;
      }

      const simulationsQuery = query(
        collection(db, "users", user.uid, "simulations"),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      unsubscribeSimulations = onSnapshot(
        simulationsQuery,
        (snapshot) => {
          const loadedSimulations = snapshot.docs.map((document) => {
            const data = document.data();

            return {
              id: document.id,
              capital: Number(data.capital ?? 0),
              currency: data.currency === "USC" ? "USC" : "USD",
              percentage: Number(data.percentage ?? 0),
              lot: Number(data.lot ?? 0),
              finalCapital: Number(data.finalCapital ?? 0),
              createdAt: data.createdAt ?? null,
            } satisfies Simulation;
          });

          setSimulations(loadedSimulations);
          setError("");
          setLoading(false);
        },
        () => {
          setError("No se pudo cargar el historial de simulaciones.");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSimulations?.();
    };
  }, []);

  function formatMoney(value: number) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(value: Timestamp | null) {
    if (!value) {
      return "Procesando fecha...";
    }

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value.toDate());
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
        Cargando historial...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">
        {error}
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="font-semibold text-white">
          Todavía no tienes simulaciones guardadas.
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Guarda una simulación desde la calculadora para verla aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
          Historial
        </p>

        <h2 className="mt-1 text-2xl font-bold text-white">
          Mis simulaciones
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-white/10 bg-black/20">
            <tr className="text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4">Fecha</th>
              <th className="px-5 py-4">Capital</th>
              <th className="px-5 py-4">Perfil</th>
              <th className="px-5 py-4">Lotaje</th>
              <th className="px-5 py-4">Capital a 12 meses</th>
            </tr>
          </thead>

          <tbody>
            {simulations.map((simulation) => (
              <tr
                key={simulation.id}
                className="border-b border-white/[0.06] last:border-0"
              >
                <td className="px-5 py-4 text-sm text-slate-400">
                  {formatDate(simulation.createdAt)}
                </td>

                <td className="px-5 py-4 font-semibold text-white">
                  {formatMoney(simulation.capital)} {simulation.currency}
                </td>

                <td className="px-5 py-4 font-semibold text-emerald-300">
                  {simulation.percentage}%
                </td>

                <td className="px-5 py-4 font-semibold text-blue-300">
                  {simulation.lot.toFixed(2)}
                </td>

                <td className="px-5 py-4 font-bold text-amber-300">
                  {formatMoney(simulation.finalCapital)}{" "}
                  {simulation.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}