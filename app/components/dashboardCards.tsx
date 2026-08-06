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
    <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <DashboardCard
        label="Capital"
        value={formatMoney(capital)}
        description={currency}
        borderClass="border-amber-400/20"
        valueClass="text-white"
        descriptionClass="text-amber-400"
      />

      <DashboardCard
        label="Lotaje"
        value={lot.toFixed(2)}
        description="Lotes estimados"
        borderClass="border-blue-400/20"
        valueClass="text-blue-400"
      />

      <DashboardCard
        label="Perfil"
        value={`${percentage}%`}
        description="Rendimiento estimado"
        borderClass="border-emerald-500/20"
        valueClass="text-emerald-400"
      />

      <DashboardCard
        label="Cuenta"
        value={currency}
        description="Tipo de cuenta"
        borderClass="border-purple-400/20"
        valueClass="text-purple-300"
      />
    </div>
  );
}

type DashboardCardProps = {
  label: string;
  value: string;
  description: string;
  borderClass: string;
  valueClass: string;
  descriptionClass?: string;
};

function DashboardCard({
  label,
  value,
  description,
  borderClass,
  valueClass,
  descriptionClass = "text-slate-400",
}: DashboardCardProps) {
  return (
    <article
      className={`min-w-0 rounded-2xl border bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5 ${borderClass}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs sm:tracking-[0.25em]">
        {label}
      </p>

      <p
        className={`mt-3 break-all text-xl font-bold leading-tight tabular-nums sm:text-3xl ${valueClass}`}
      >
        {value}
      </p>

      <p
        className={`mt-2 break-words text-xs leading-5 sm:text-sm ${descriptionClass}`}
      >
        {description}
      </p>
    </article>
  );
}