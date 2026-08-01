"use client";

import { useMemo, useState } from "react";
import Header from "./components/header";
import DashboardCards from "./components/dashboardCards";
import GrowthChart from "./components/growthChart";
import AuthGuard from "./components/authGuard";

type Currency = "USD" | "USC";

const profiles = [15, 30, 45];

export default function Home() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [capital, setCapital] = useState(300);
  const [percentage, setPercentage] = useState(30);
  const [customPercentage, setCustomPercentage] = useState("");

  const activePercentage =
    customPercentage.trim() !== ""
      ? Number(customPercentage)
      : percentage;

  const results = useMemo(() => {
    const validCapital = Number.isFinite(capital) && capital > 0 ? capital : 0;
    const validPercentage =
      Number.isFinite(activePercentage) && activePercentage > 0
        ? activePercentage
        : 0;

    // En una cuenta USC, 100 USC equivalen a 1 USD.
    const capitalInUsd =
      currency === "USC" ? validCapital / 100 : validCapital;

    // Fórmula estimada del calculador de lotaje.
    const lot = (capitalInUsd * validPercentage) / 45000;

    const monthlyRate = validPercentage / 100;
    const finalCapital = validCapital * Math.pow(1 + monthlyRate, 12);
    const estimatedProfit = finalCapital - validCapital;

const projectionMonths = [1, 3, 6, 12, 24];

const projections = projectionMonths.map((month) => {
  const projectedCapital =
    validCapital * Math.pow(1 + monthlyRate, month);

  return {
    month,
    projectedCapital,
    estimatedProfit: projectedCapital - validCapital,
  };
});

return {
  lot,
  finalCapital,
  estimatedProfit,
  projections,
};
  }, [capital, currency, activePercentage]);

  function changeCurrency(newCurrency: Currency) {
    setCurrency(newCurrency);
    setCapital(newCurrency === "USD" ? 300 : 30000);
  }

  function selectProfile(profile: number) {
    setPercentage(profile);
    setCustomPercentage("");
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <AuthGuard>
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8">
        <Header />
<DashboardCards
  capital={capital}
  currency={currency}
  lot={results.lot}
  percentage={activePercentage}
  formatMoney={formatMoney}
/>

        <section className="grid flex-1 items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="pt-4 lg:pt-14">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
              Simulador financiero
            </p>

            <h2 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
              Proyecta tu capital con una
              <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-blue-400 bg-clip-text text-transparent">
                {" "}
                estrategia definida
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Calcula un lotaje estimado y visualiza una proyección de
              crecimiento según el capital, la moneda y el porcentaje mensual.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {profiles.map((profile) => (
                <div
                  key={profile}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center"
                >
                  <p className="text-2xl font-bold text-amber-400">
                    {profile}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Perfil recomendado
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
            <div className="mb-7">
              <p className="text-sm font-semibold text-amber-400">
                CALCULADORA
              </p>
              <h3 className="mt-1 text-2xl font-bold">
                Configura tu proyección
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Tipo de cuenta
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {(["USD", "USC"] as Currency[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => changeCurrency(item)}
                      className={`rounded-xl border px-4 py-3 font-semibold transition ${
                        currency === item
                          ? "border-blue-400 bg-blue-500/20 text-blue-300"
                          : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  USD = cuenta estándar · USC = cuenta en centavos
                </p>
              </div>

              <div>
                <label
                  htmlFor="capital"
                  className="mb-3 block text-sm font-medium text-slate-300"
                >
                  Capital inicial
                </label>

                <div className="relative">
                  <input
                    id="capital"
                    type="number"
                    min={currency === "USD" ? 200 : 20000}
                    value={capital}
                    onChange={(event) =>
                      setCapital(Number(event.target.value))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 pr-20 text-lg font-semibold outline-none transition focus:border-amber-400"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                    {currency}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Capital mínimo:{" "}
                  {currency === "USD" ? "200 USD" : "20.000 USC"}
                </p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Porcentaje mensual estimado
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {profiles.map((profile) => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => selectProfile(profile)}
                      className={`rounded-xl border py-3 font-bold transition ${
                        customPercentage === "" &&
                        percentage === profile
                          ? "border-amber-400 bg-amber-400/15 text-amber-300"
                          : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {profile}%
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="O escribe un porcentaje personalizado"
                  value={customPercentage}
                  onChange={(event) =>
                    setCustomPercentage(event.target.value)
                  }
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-blue-400"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <ResultCard
                  label="Lotaje estimado"
                  value={results.lot.toFixed(2)}
                />

                <ResultCard
                  label="Ganancia estimada"
                  value={`${formatMoney(results.estimatedProfit)} ${currency}`}
                />

                <ResultCard
                  label="Capital a 12 meses"
                  value={`${formatMoney(results.finalCapital)} ${currency}`}
                />
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-xs leading-5 text-slate-400">
                Esta herramienta muestra cálculos y proyecciones matemáticas
                estimadas. No representa una promesa ni una garantía de
                rentabilidad. Los resultados reales pueden variar.
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
  <div className="border-b border-white/10 px-5 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
      Proyección por meses
    </p>

    <h3 className="mt-1 text-xl font-bold text-white">
      Crecimiento compuesto estimado
    </h3>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full min-w-[620px] text-left">
      <thead className="border-b border-white/10 bg-white/[0.03]">
        <tr className="text-xs uppercase tracking-wider text-slate-500">
          <th className="px-5 py-4">Periodo</th>
          <th className="px-5 py-4">Capital inicial</th>
          <th className="px-5 py-4">Ganancia estimada</th>
          <th className="px-5 py-4">Capital proyectado</th>
        </tr>
      </thead>

      <tbody>
        {results.projections.map((projection) => (
          <tr
            key={projection.month}
            className="border-b border-white/[0.06] last:border-0"
          >
            <td className="px-5 py-4 font-semibold text-blue-300">
              {projection.month}{" "}
              {projection.month === 1 ? "mes" : "meses"}
            </td>

            <td className="px-5 py-4 text-slate-300">
              {formatMoney(capital)} {currency}
            </td>

            <td className="px-5 py-4 font-semibold text-emerald-300">
              +{formatMoney(projection.estimatedProfit)} {currency}
            </td>

            <td className="px-5 py-4 font-bold text-amber-300">
              {formatMoney(projection.projectedCapital)} {currency}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <div className="border-t border-white/10 px-5 py-3 text-xs text-slate-500">
    Resultados matemáticos estimados con capitalización mensual. No garantizan
    rentabilidad futura.
  </div>
  <GrowthChart
  projections={results.projections}
  currency={currency}
/>
</div>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
          AILANUX CENTER · Plataforma de simulación y gestión
        </footer>
      </div>
    </main>
    </AuthGuard>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 break-words text-lg font-bold text-white">
        {value}
      </p>
    </div>
  );
}