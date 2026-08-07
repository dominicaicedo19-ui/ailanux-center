"use client";

import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { auth, db } from "../../lib/firebase";

type Mt5GrowthChartProps = {
  accountId: string;
  currency: string;
};

type SnapshotData = {
  id: string;
  balance: number;
  equity: number;
  growthPercentage: number;
  equityGrowthPercentage: number;
  recordedAt: Timestamp | null;
};

export default function Mt5GrowthChart({
  accountId,
  currency,
}: Mt5GrowthChartProps) {
  const [snapshots, setSnapshots] = useState<
    SnapshotData[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user || !accountId) {
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const snapshotsQuery = query(
      collection(
        db,
        "users",
        user.uid,
        "mt5Accounts",
        accountId,
        "snapshots"
      ),
      orderBy("recordedAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      snapshotsQuery,
      (snapshot) => {
        const loadedSnapshots =
          snapshot.docs.map((document) => {
            const data = document.data();

            return {
              id: document.id,

              balance: Number(
                data.balance ?? 0
              ),

              equity: Number(
                data.equity ?? 0
              ),

              growthPercentage: Number(
                data.growthPercentage ?? 0
              ),

              equityGrowthPercentage: Number(
                data.equityGrowthPercentage ?? 0
              ),

              recordedAt:
                data.recordedAt instanceof Timestamp
                  ? data.recordedAt
                  : null,
            } satisfies SnapshotData;
          });

        /*
         * Firestore entrega primero los más
         * recientes. Para la gráfica necesitamos
         * mostrarlos del más antiguo al más nuevo.
         */
        loadedSnapshots.reverse();

        setSnapshots(loadedSnapshots);
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        console.error(
          "Error cargando historial MT5:",
          snapshotError
        );

        setError(
          "No se pudo cargar la gráfica de crecimiento."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [accountId]);

  function formatMoney(value: number) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatCompact(value: number) {
    return new Intl.NumberFormat("es-CO", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  function formatChartDate(
    value: Timestamp | null
  ) {
    if (!value) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value.toDate());
  }

  const chartData = snapshots.map(
    (snapshot) => ({
      fecha: formatChartDate(
        snapshot.recordedAt
      ),

      balance: Number(
        snapshot.balance.toFixed(2)
      ),

      equity: Number(
        snapshot.equity.toFixed(2)
      ),

      crecimiento: Number(
        snapshot.growthPercentage.toFixed(2)
      ),
    })
  );

  if (loading) {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
        Cargando crecimiento real...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="font-semibold text-white">
          Todavía no hay historial suficiente.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Cuando MT5 comience a sincronizarse,
          aparecerá aquí la evolución real de la
          cuenta.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Historial real
        </p>

        <h4 className="mt-1 text-lg font-bold text-white">
          Crecimiento de la cuenta
        </h4>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Balance y equity obtenidos directamente
          de MetaTrader 5.
        </p>
      </div>

      <div className="p-3 sm:p-5">
        <div className="h-[280px] min-w-0 sm:h-[360px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
          >
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                bottom: 5,
                left: 0,
              }}
            >
              <CartesianGrid
                stroke="#334155"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="fecha"
                axisLine={false}
                tickLine={false}
                minTickGap={35}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 10,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={55}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 10,
                }}
                tickFormatter={(value) =>
                  formatCompact(Number(value))
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                }}
                labelStyle={{
                  color: "#cbd5e1",
                }}
                formatter={(
                  value,
                  name
                ) => {
                  const label =
                    name === "balance"
                      ? "Balance"
                      : "Equity";

                  return [
                    `${formatMoney(
                      Number(value)
                    )} ${currency}`,
                    label,
                  ];
                }}
              />

              <Line
                type="monotone"
                dataKey="balance"
                name="balance"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 6,
                }}
              />

              <Line
                type="monotone"
                dataKey="equity"
                name="equity"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Balance
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Equity
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-5 text-slate-600">
          Se muestran hasta los 100 registros
          históricos más recientes.
        </p>
      </div>
    </section>
  );
}