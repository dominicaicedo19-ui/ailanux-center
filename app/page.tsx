"use client";

import { useMemo, useState } from "react";
import Header from "./components/header";
import DashboardCards from "./components/dashboardCards";
import GrowthChart from "./components/growthChart";
import AuthGuard from "./components/authGuard";
import SaveSimulationButton from "./components/saveSimulationButton";
import UserProfile from "./components/userProfile";
import PdfReport from "./components/pdfReport";

type Currency = "USD" | "USC";

const profiles = [15, 30, 45];

export default function Home() {
  const [currency, setCurrency] =
    useState<Currency>("USD");

  const [capital, setCapital] = useState(300);
  const [percentage, setPercentage] = useState(30);

  const [customPercentage, setCustomPercentage] =
    useState("");

  const activePercentage =
    customPercentage.trim() !== ""
      ? Number(customPercentage)
      : percentage;

  const results = useMemo(() => {
    const validCapital =
      Number.isFinite(capital) && capital > 0
        ? capital
        : 0;

    const validPercentage =
      Number.isFinite(activePercentage) &&
      activePercentage > 0
        ? activePercentage
        : 0;

    // En una cuenta USC, 100 USC equivalen a 1 USD.
    const capitalInUsd =
      currency === "USC"
        ? validCapital / 100
        : validCapital;

    // Fórmula estimada del calculador de lotaje.
    const lot =
      (capitalInUsd * validPercentage) / 45000;

    const monthlyRate = validPercentage / 100;

    const finalCapital =
      validCapital *
      Math.pow(1 + monthlyRate, 12);

    const estimatedProfit =
      finalCapital - validCapital;

    const projectionMonths = [
      1,
      3,
      6,
      12,
      24,
    ];

    const projections = projectionMonths.map(
      (month) => {
        const projectedCapital =
          validCapital *
          Math.pow(1 + monthlyRate, month);

        return {
          month,
          projectedCapital,
          estimatedProfit:
            projectedCapital - validCapital,
        };
      }
    );

    return {
      lot,
      finalCapital,
      estimatedProfit,
      projections,
    };
  }, [capital, currency, activePercentage]);

  function changeCurrency(
    newCurrency: Currency
  ) {
    setCurrency(newCurrency);

    setCapital(
      newCurrency === "USD"
        ? 300
        : 30000
    );
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
      <main className="min-h-screen overflow-x-hidden bg-[#05070a] text-white">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-8 sm:py-8">
          <Header />

          <UserProfile />

          <div className="mt-6">
            <DashboardCards
              capital={capital}
              currency={currency}
              lot={results.lot}
              percentage={activePercentage}
              formatMoney={formatMoney}
            />
          </div>

          <section className="mt-8 grid flex-1 items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="lg:sticky lg:top-8 lg:pt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-400 sm:mb-4 sm:text-sm sm:tracking-[0.25em]">
                Simulador financiero
              </p>

              <h2 className="max-w-xl text-3xl font-bold leading-tight sm:text-5xl">
                Proyecta tu capital con una
                <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-blue-400 bg-clip-text text-transparent">
                  {" "}
                  estrategia definida
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:leading-7">
                Calcula un lotaje estimado y
                visualiza una proyección de
                crecimiento según el capital, la
                moneda y el porcentaje mensual.
              </p>

              <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
                {profiles.map((profile) => (
                  <div
                    key={profile}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center sm:rounded-2xl sm:p-4"
                  >
                    <p className="text-xl font-bold text-amber-400 sm:text-2xl">
                      {profile}%
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">
                      Perfil recomendado
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-[24px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:rounded-[28px] sm:p-7">
              <div className="mb-6 sm:mb-7">
                <p className="text-xs font-semibold text-amber-400 sm:text-sm">
                  CALCULADORA
                </p>

                <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                  Configura tu proyección
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-300">
                    Tipo de cuenta
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        "USD",
                        "USC",
                      ] as Currency[]
                    ).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          changeCurrency(item)
                        }
                        className={`min-h-12 rounded-xl border px-4 py-3 font-semibold transition ${
                          currency === item
                            ? "border-blue-400 bg-blue-500/20 text-blue-300"
                            : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    USD = cuenta estándar · USC =
                    cuenta en centavos
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
                      inputMode="decimal"
                      min={
                        currency === "USD"
                          ? 200
                          : 20000
                      }
                      value={capital}
                      onChange={(event) =>
                        setCapital(
                          Number(event.target.value)
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 pr-20 text-base font-semibold outline-none transition focus:border-amber-400 sm:text-lg"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                      {currency}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Capital mínimo:{" "}
                    {currency === "USD"
                      ? "200 USD"
                      : "20.000 USC"}
                  </p>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-300">
                    Porcentaje mensual estimado
                  </label>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {profiles.map((profile) => (
                      <button
                        key={profile}
                        type="button"
                        onClick={() =>
                          selectProfile(profile)
                        }
                        className={`min-h-12 rounded-xl border py-3 font-bold transition ${
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
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    placeholder="Porcentaje personalizado"
                    value={customPercentage}
                    onChange={(event) =>
                      setCustomPercentage(
                        event.target.value
                      )
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
                    value={`${formatMoney(
                      results.estimatedProfit
                    )} ${currency}`}
                  />

                  <ResultCard
                    label="Capital a 12 meses"
                    value={`${formatMoney(
                      results.finalCapital
                    )} ${currency}`}
                  />
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-xs leading-5 text-slate-400">
                  Esta herramienta muestra cálculos y
                  proyecciones matemáticas estimadas.
                  No representa una promesa ni una
                  garantía de rentabilidad. Los
                  resultados reales pueden variar.
                </div>

                <div className="grid gap-3">
                  <SaveSimulationButton
                    capital={capital}
                    currency={currency}
                    percentage={activePercentage}
                    lot={results.lot}
                    estimatedProfit={
                      results.estimatedProfit
                    }
                    finalCapital={
                      results.finalCapital
                    }
                    projections={
                      results.projections
                    }
                  />

                  <PdfReport
                    capital={capital}
                    currency={currency}
                    percentage={activePercentage}
                    lot={results.lot}
                    estimatedProfit={
                      results.estimatedProfit
                    }
                    finalCapital={
                      results.finalCapital
                    }
                    projections={
                      results.projections
                    }
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400 sm:tracking-[0.25em]">
                      Proyección por meses
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
                      Crecimiento compuesto estimado
                    </h3>
                  </div>

                  {/* Vista para celulares */}
                  <div className="space-y-3 p-4 md:hidden">
                    {results.projections.map(
                      (projection) => (
                        <article
                          key={projection.month}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                            <p className="font-bold text-blue-300">
                              {projection.month}{" "}
                              {projection.month === 1
                                ? "mes"
                                : "meses"}
                            </p>

                            <span className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                              {activePercentage}%
                            </span>
                          </div>

                          <dl className="mt-4 space-y-3">
                            <div>
                              <dt className="text-xs text-slate-500">
                                Capital inicial
                              </dt>

                              <dd className="mt-1 break-words font-semibold text-slate-300">
                                {formatMoney(capital)}{" "}
                                {currency}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs text-slate-500">
                                Ganancia estimada
                              </dt>

                              <dd className="mt-1 break-words font-semibold text-emerald-300">
                                +
                                {formatMoney(
                                  projection.estimatedProfit
                                )}{" "}
                                {currency}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs text-slate-500">
                                Capital proyectado
                              </dt>

                              <dd className="mt-1 break-words text-lg font-bold text-amber-300">
                                {formatMoney(
                                  projection.projectedCapital
                                )}{" "}
                                {currency}
                              </dd>
                            </div>
                          </dl>
                        </article>
                      )
                    )}
                  </div>

                  {/* Vista para tabletas y computadores */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[620px] text-left">
                      <thead className="border-b border-white/10 bg-white/[0.03]">
                        <tr className="text-xs uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-4">
                            Periodo
                          </th>

                          <th className="px-5 py-4">
                            Capital inicial
                          </th>

                          <th className="px-5 py-4">
                            Ganancia estimada
                          </th>

                          <th className="px-5 py-4">
                            Capital proyectado
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {results.projections.map(
                          (projection) => (
                            <tr
                              key={projection.month}
                              className="border-b border-white/[0.06] last:border-0"
                            >
                              <td className="px-5 py-4 font-semibold text-blue-300">
                                {projection.month}{" "}
                                {projection.month === 1
                                  ? "mes"
                                  : "meses"}
                              </td>

                              <td className="px-5 py-4 text-slate-300">
                                {formatMoney(capital)}{" "}
                                {currency}
                              </td>

                              <td className="px-5 py-4 font-semibold text-emerald-300">
                                +
                                {formatMoney(
                                  projection.estimatedProfit
                                )}{" "}
                                {currency}
                              </td>

                              <td className="px-5 py-4 font-bold text-amber-300">
                                {formatMoney(
                                  projection.projectedCapital
                                )}{" "}
                                {currency}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-slate-500 sm:px-5">
                    Resultados matemáticos estimados
                    con capitalización mensual. No
                    garantizan rentabilidad futura.
                  </div>

                  <div className="border-t border-white/10 p-3 sm:p-5">
                    <GrowthChart
                      projections={
                        results.projections
                      }
                      currency={currency}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
            AILANUX CENTER · Plataforma de
            simulación y gestión
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
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-base font-bold text-white sm:text-lg">
        {value}
      </p>
    </div>
  );
}