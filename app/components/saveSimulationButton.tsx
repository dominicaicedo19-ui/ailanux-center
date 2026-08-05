"use client";

import { useState } from "react";
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Currency = "USD" | "USC";

type Projection = {
  month: number;
  projectedCapital: number;
  estimatedProfit: number;
};

type SaveSimulationButtonProps = {
  capital: number;
  currency: Currency;
  percentage: number;
  lot: number;
  estimatedProfit: number;
  finalCapital: number;
  projections: Projection[];
};

export default function SaveSimulationButton({
  capital,
  currency,
  percentage,
  lot,
  estimatedProfit,
  finalCapital,
  projections,
}: SaveSimulationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setMessage("");
    setError("");

    const user = auth.currentUser;

    if (!user) {
      setError(
        "Debes iniciar sesión para guardar la simulación."
      );
      return;
    }

    if (capital <= 0 || percentage <= 0) {
      setError(
        "El capital y el porcentaje deben ser mayores que cero."
      );
      return;
    }

    setLoading(true);

    try {
      const simulationReference = doc(
        collection(
          db,
          "users",
          user.uid,
          "simulations"
        )
      );

      const userReference = doc(
        db,
        "users",
        user.uid
      );

      const batch = writeBatch(db);

      batch.set(simulationReference, {
        userId: user.uid,
        capital,
        currency,
        percentage,
        lot,
        estimatedProfit,
        finalCapital,
        projections,
        createdAt: serverTimestamp(),
      });

      batch.update(userReference, {
        simulationCount: increment(1),
      });

      await batch.commit();

      setMessage(
        "Simulación guardada correctamente."
      );
    } catch (saveError) {
      console.error(
        "Error guardando simulación:",
        saveError
      );

      setError(
        "No se pudo guardar la simulación."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="w-full rounded-xl border border-blue-400/30 bg-blue-500/15 px-5 py-3 font-bold text-blue-300 transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Guardando..."
          : "Guardar simulación"}
      </button>

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}