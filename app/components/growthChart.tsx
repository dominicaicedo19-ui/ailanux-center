"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
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
    mes: `${item.month}`,
    capital: Number(item.projectedCapital.toFixed(2)),
  }));

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white">
        Proyección de crecimiento
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Evolución estimada del capital ({currency})
      </p>

      <div className="mt-6 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#333333" />

            <XAxis dataKey="mes" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="capital"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}