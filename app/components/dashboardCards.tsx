type DashboardCardsProps = {
  capital: number;
  currency: "USD" | "USC";
  lot: number;
  percentage: number;
  formatMoney: (value: number) => string;
};

export default function DashboardCards({
  capital,
  currency,
  lot,
  percentage,
  formatMoney,
}: DashboardCardsProps) {
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-amber-400/20 bg-white/[0.04] p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Capital
        </p>

        <h3 className="mt-3 text-3xl font-bold text-white">
          {formatMoney(capital)}
        </h3>

        <p className="mt-2 text-sm text-amber-400">{currency}</p>
      </div>

      <div className="rounded-2xl border border-blue-400/20 bg-white/[0.04] p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Lotaje
        </p>

        <h3 className="mt-3 text-3xl font-bold text-blue-400">
          {lot.toFixed(2)}
        </h3>

        <p className="mt-2 text-sm text-slate-400">Lotes estimados</p>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.04] p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Perfil
        </p>

        <h3 className="mt-3 text-3xl font-bold text-emerald-400">
          {percentage}%
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          Rendimiento estimado
        </p>
      </div>

      <div className="rounded-2xl border border-purple-400/20 bg-white/[0.04] p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Cuenta
        </p>

        <h3 className="mt-3 text-3xl font-bold text-purple-300">
          {currency}
        </h3>

        <p className="mt-2 text-sm text-slate-400">Tipo de cuenta</p>
      </div>
    </div>
  );
}