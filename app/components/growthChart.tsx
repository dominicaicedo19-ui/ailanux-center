"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Projection = {
  month: number;
  projectedCapital: number;
};

type GrowthChartProps = {
  projections: Projection[];
  currency: "USD" | "USC";
};

export default function GrowthChart({
  projections,
  currency,
}: GrowthChartProps) {
  const data = projections.map((item) => ({
    mes: item.month,
    capital: Number(
      item.projectedCapital.toFixed(2)
    ),
  }));

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

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400 sm:tracking-[0.25em]">
          Gráfica
        </p>

        <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
          Proyección de crecimiento
        </h3>

        <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">
          Evolución estimada del capital en{" "}
          {currency}. Toca un punto para consultar
          su valor.
        </p>
      </div>

      <div className="mt-5 h-[260px] min-w-0 sm:mt-6 sm:h-[350px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
        >
          <LineChart
            data={data}
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
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 12,
              }}
              tickFormatter={(month) =>
                `${month}m`
              }
              padding={{
                left: 10,
                right: 10,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={55}
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
              }}
              tickFormatter={(value) =>
                formatCompact(Number(value))
              }
            />

            <Tooltip
              cursor={{
                stroke: "#64748b",
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
              }}
              labelStyle={{
                color: "#cbd5e1",
                marginBottom: "6px",
              }}
              itemStyle={{
                color: "#93c5fd",
              }}
              labelFormatter={(month) =>
                `Periodo: ${month} ${
                  Number(month) === 1
                    ? "mes"
                    : "meses"
                }`
              }
              formatter={(value) => [
                `${formatMoney(
                  Number(value)
                )} ${currency}`,
                "Capital proyectado",
              ]}
            />

            <Line
              type="monotone"
              dataKey="capital"
              stroke="#3b82f6"
              strokeWidth={3}
              activeDot={{
                r: 7,
              }}
              dot={{
                r: 4,
                fill: "#3b82f6",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
        Los valores corresponden a estimaciones
        matemáticas y no garantizan rentabilidad.
      </p>
    </section>
  );
}