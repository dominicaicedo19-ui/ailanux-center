"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import AuthGuard from "../components/authGuard";
import Header from "../components/header";
import { auth, db } from "../../lib/firebase";
import Mt5GrowthChart from "../components/mt5GrowthChart";

type AccountType = "USD" | "USC";

type Mt5Account = {
  id: string;
  accountName: string;
  accountType: AccountType;
  initialCapital: number;
  connectionStatus: string;
  createdAt: Timestamp | null;

  accountLoginMasked: string;
  broker: string;
  server: string;
  accountCurrency: string;

  balance: number | null;
  equity: number | null;
  floatingProfit: number | null;
  margin: number | null;
  freeMargin: number | null;

  totalDeposits: number | null;
  totalWithdrawals: number | null;

  tradingProfit: number | null;
  growthPercentage: number | null;
  equityGrowthPercentage: number | null;

  lastSyncAt: Timestamp | null;
};

export default function Mt5Page() {
  const [accounts, setAccounts] = useState<
    Mt5Account[]
  >([]);

  const [accountName, setAccountName] =
    useState("");

  const [accountType, setAccountType] =
    useState<AccountType>("USD");

  const [initialCapital, setInitialCapital] =
    useState("200");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [formMessage, setFormMessage] =
    useState("");

  const [
    generatingTokenId,
    setGeneratingTokenId,
  ] = useState("");

  const [generatedToken, setGeneratedToken] =
    useState("");

  const [tokenAccountId, setTokenAccountId] =
    useState("");

  const [tokenError, setTokenError] =
    useState("");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let unsubscribeAccounts:
      | (() => void)
      | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeAccounts?.();

        if (!user) {
          setAccounts([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setLoadError("");

        unsubscribeAccounts = onSnapshot(
          collection(
            db,
            "users",
            user.uid,
            "mt5Accounts"
          ),
          (snapshot) => {
            const loadedAccounts =
              snapshot.docs.map((document) => {
                const data = document.data();

                return {
                  id: document.id,

                  accountName: String(
                    data.accountName ??
                      "Cuenta MT5"
                  ),

                  accountType:
                    data.accountType === "USC"
                      ? "USC"
                      : "USD",

                  initialCapital: Number(
                    data.initialCapital ?? 0
                  ),

                  connectionStatus: String(
                    data.connectionStatus ??
                      "not-connected"
                  ),

                  createdAt:
                    data.createdAt instanceof
                    Timestamp
                      ? data.createdAt
                      : null,

                  accountLoginMasked: String(
                    data.accountLoginMasked ?? ""
                  ),

                  broker: String(
                    data.broker ?? ""
                  ),

                  server: String(
                    data.server ?? ""
                  ),

                  accountCurrency: String(
                    data.accountCurrency ?? ""
                  ),

                  balance:
                    typeof data.balance ===
                    "number"
                      ? data.balance
                      : null,

                  equity:
                    typeof data.equity ===
                    "number"
                      ? data.equity
                      : null,

                  floatingProfit:
                    typeof data.floatingProfit ===
                    "number"
                      ? data.floatingProfit
                      : null,

                  margin:
                    typeof data.margin ===
                    "number"
                      ? data.margin
                      : null,

                  freeMargin:
                    typeof data.freeMargin ===
                    "number"
                      ? data.freeMargin
                      : null,

                  totalDeposits:
                    typeof data.totalDeposits ===
                    "number"
                      ? data.totalDeposits
                      : null,

                  totalWithdrawals:
                    typeof data.totalWithdrawals ===
                    "number"
                      ? data.totalWithdrawals
                      : null,

                  tradingProfit:
                    typeof data.tradingProfit ===
                    "number"
                      ? data.tradingProfit
                      : null,

                  growthPercentage:
                    typeof data.growthPercentage ===
                    "number"
                      ? data.growthPercentage
                      : null,

                  equityGrowthPercentage:
                    typeof data.equityGrowthPercentage ===
                    "number"
                      ? data.equityGrowthPercentage
                      : null,

                  lastSyncAt:
                    data.lastSyncAt instanceof
                    Timestamp
                      ? data.lastSyncAt
                      : null,
                } satisfies Mt5Account;
              });

            loadedAccounts.sort(
              (first, second) => {
                const firstDate =
                  first.createdAt?.toMillis() ??
                  0;

                const secondDate =
                  second.createdAt?.toMillis() ??
                  0;

                return secondDate - firstDate;
              }
            );

            setAccounts(loadedAccounts);
            setLoadError("");
            setLoading(false);
          },
          (error) => {
            console.error(
              "Error cargando cuentas MT5:",
              error
            );

            setLoadError(
              "No se pudieron cargar las cuentas MT5."
            );

            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeAccounts?.();
    };
  }, []);

  function changeAccountType(
    newType: AccountType
  ) {
    setAccountType(newType);

    setInitialCapital(
      newType === "USD"
        ? "200"
        : "20000"
    );
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatSignedMoney(value: number) {
    const formatted =
      formatMoney(Math.abs(value));

    if (value > 0) {
      return `+${formatted}`;
    }

    if (value < 0) {
      return `-${formatted}`;
    }

    return formatted;
  }

  function formatPercentage(value: number) {
    const formatted =
      Math.abs(value).toFixed(2);

    if (value > 0) {
      return `+${formatted}%`;
    }

    if (value < 0) {
      return `-${formatted}%`;
    }

    return "0.00%";
  }

  function formatDate(
    value: Timestamp | null
  ) {
    if (!value) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value.toDate());
  }

  function getConnectionLabel(
    status: string
  ) {
    if (status === "connected") {
      return "Conectada";
    }

    if (status === "offline") {
      return "Sin conexión";
    }

    if (status === "token-created") {
      return "Clave generada";
    }

    return "Pendiente de conectar";
  }

  function getConnectionClasses(
    status: string
  ) {
    if (status === "connected") {
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    }

    if (status === "offline") {
      return "border-red-400/20 bg-red-500/10 text-red-300";
    }

    if (status === "token-created") {
      return "border-blue-400/20 bg-blue-500/10 text-blue-300";
    }

    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  function getGrowthClasses(
    value: number | null
  ) {
    if (value === null) {
      return "text-slate-300";
    }

    if (value > 0) {
      return "text-emerald-300";
    }

    if (value < 0) {
      return "text-red-300";
    }

    return "text-slate-300";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setFormMessage("");

    const user = auth.currentUser;

    const cleanName =
      accountName.trim();

    const capital =
      Number(initialCapital);

    if (!user) {
      setFormError(
        "La sesión del usuario no está disponible."
      );

      return;
    }

    if (
      cleanName.length < 2 ||
      cleanName.length > 60
    ) {
      setFormError(
        "El nombre debe tener entre 2 y 60 caracteres."
      );

      return;
    }

    const minimumCapital =
      accountType === "USD"
        ? 200
        : 20000;

    if (
      !Number.isFinite(capital) ||
      capital < minimumCapital
    ) {
      setFormError(
        accountType === "USD"
          ? "El capital mínimo es 200 USD."
          : "El capital mínimo es 20.000 USC."
      );

      return;
    }

    setSaving(true);

    try {
      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "mt5Accounts"
        ),
        {
          userId: user.uid,
          accountName: cleanName,
          accountType,
          initialCapital: capital,

          connectionStatus:
            "not-connected",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setAccountName("");

      setInitialCapital(
        accountType === "USD"
          ? "200"
          : "20000"
      );

      setFormMessage(
        "La cuenta fue registrada correctamente."
      );
    } catch (error) {
      console.error(
        "Error registrando cuenta MT5:",
        error
      );

      setFormError(
        "No se pudo registrar la cuenta. Revisa las reglas de Firestore."
      );
    } finally {
      setSaving(false);
    }
  }

  async function generateConnectionToken(
    accountId: string
  ) {
    setGeneratedToken("");
    setTokenAccountId("");
    setTokenError("");
    setCopied(false);

    const user = auth.currentUser;

    if (!user) {
      setTokenError(
        "La sesión del usuario no está disponible."
      );

      return;
    }

    const confirmed = window.confirm(
      "¿Deseas generar una nueva clave de conexión para esta cuenta MT5? Si ya existía una clave anterior, dejará de funcionar."
    );

    if (!confirmed) {
      return;
    }

    setGeneratingTokenId(accountId);

    try {
      const idToken =
        await user.getIdToken(true);

      const response = await fetch(
        "/api/mt5/generate-token",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken}`,
          },

          body: JSON.stringify({
            accountId,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "No se pudo generar la clave."
        );
      }

      setGeneratedToken(
        String(data.token)
      );

      setTokenAccountId(accountId);
    } catch (error) {
      console.error(
        "Error generando clave MT5:",
        error
      );

      setTokenError(
        error instanceof Error
          ? error.message
          : "No se pudo generar la clave de conexión."
      );

      setTokenAccountId(accountId);
    } finally {
      setGeneratingTokenId("");
    }
  }

  async function copyToken() {
    if (!generatedToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedToken
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      console.error(
        "No se pudo copiar la clave:",
        error
      );
    }
  }

  return (
    <AuthGuard>
      <main className="min-h-screen overflow-x-hidden bg-[#05070a] text-white">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
          <Header />

          <section className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
              Seguimiento real
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Mis cuentas MT5
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
              Registra tus cuentas de MetaTrader 5,
              conéctalas con AILANUX y consulta el
              crecimiento real de tu capital.
            </p>
          </section>

          <div className="grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:sticky lg:top-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                Nueva cuenta
              </p>

              <h2 className="mt-1 text-xl font-bold text-white">
                Registrar cuenta MT5
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="accountName"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Nombre de la cuenta
                  </label>

                  <input
                    id="accountName"
                    type="text"
                    maxLength={60}
                    value={accountName}
                    onChange={(event) =>
                      setAccountName(
                        event.target.value
                      )
                    }
                    placeholder="Ejemplo: Cuenta principal"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-300">
                    Tipo de cuenta
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        "USD",
                        "USC",
                      ] as AccountType[]
                    ).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          changeAccountType(type)
                        }
                        className={`rounded-xl border px-4 py-3 font-semibold transition ${
                          accountType === type
                            ? "border-blue-400 bg-blue-500/20 text-blue-300"
                            : "border-white/10 bg-black/20 text-slate-400"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="initialCapital"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Capital inicial de seguimiento
                  </label>

                  <div className="relative">
                    <input
                      id="initialCapital"
                      type="number"
                      inputMode="decimal"
                      min={
                        accountType === "USD"
                          ? 200
                          : 20000
                      }
                      step="0.01"
                      value={initialCapital}
                      onChange={(event) =>
                        setInitialCapital(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-20 text-white outline-none transition focus:border-amber-400"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                      {accountType}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Este valor será la base inicial
                    para medir el crecimiento.
                  </p>
                </div>

                {formMessage && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {formMessage}
                  </div>
                )}

                {formError && (
                  <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
                >
                  {saving
                    ? "Registrando cuenta..."
                    : "Registrar cuenta MT5"}
                </button>
              </div>
            </form>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    Cuentas registradas
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    Seguimiento de MetaTrader 5
                  </h2>
                </div>

                <span className="w-fit rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
                  {accounts.length}{" "}
                  {accounts.length === 1
                    ? "cuenta"
                    : "cuentas"}
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">
                  Cargando cuentas MT5...
                </div>
              ) : loadError ? (
                <div className="p-5 text-red-300">
                  {loadError}
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No tienes cuentas MT5 registradas.
                </div>
              ) : (
                <div className="space-y-5 p-4 sm:p-5">
                  {accounts.map((account) => {
                    const displayCurrency =
                      account.accountCurrency ||
                      account.accountType;

                    return (
                      <article
                        key={account.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="break-words text-xl font-bold text-white">
                                {account.accountName}
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                Registrada:{" "}
                                {formatDate(
                                  account.createdAt
                                )}
                              </p>
                            </div>

                            <span
                              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getConnectionClasses(
                                account.connectionStatus
                              )}`}
                            >
                              {getConnectionLabel(
                                account.connectionStatus
                              )}
                            </span>
                          </div>

                          {account.connectionStatus ===
                            "connected" && (
                            <>
                              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                                <MetricCard
                                  label="Balance"
                                  value={
                                    account.balance !==
                                    null
                                      ? `${formatMoney(
                                          account.balance
                                        )} ${displayCurrency}`
                                      : "—"
                                  }
                                  valueClass="text-white"
                                />

                                <MetricCard
                                  label="Equity"
                                  value={
                                    account.equity !==
                                    null
                                      ? `${formatMoney(
                                          account.equity
                                        )} ${displayCurrency}`
                                      : "—"
                                  }
                                  valueClass="text-blue-300"
                                />

                                <MetricCard
                                  label="Ganancia trading"
                                  value={
                                    account.tradingProfit !==
                                    null
                                      ? `${formatSignedMoney(
                                          account.tradingProfit
                                        )} ${displayCurrency}`
                                      : "—"
                                  }
                                  valueClass={getGrowthClasses(
                                    account.tradingProfit
                                  )}
                                />

                                <MetricCard
                                  label="Crecimiento"
                                  value={
                                    account.growthPercentage !==
                                    null
                                      ? formatPercentage(
                                          account.growthPercentage
                                        )
                                      : "—"
                                  }
                                  valueClass={getGrowthClasses(
                                    account.growthPercentage
                                  )}
                                />
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <MetricCard
                                  label="Flotante"
                                  value={
                                    account.floatingProfit !==
                                    null
                                      ? `${formatSignedMoney(
                                          account.floatingProfit
                                        )} ${displayCurrency}`
                                      : "—"
                                  }
                                  valueClass={getGrowthClasses(
                                    account.floatingProfit
                                  )}
                                />

                                <MetricCard
                                  label="Margen"
                                  value={
                                    account.margin !==
                                    null
                                      ? `${formatMoney(
                                          account.margin
                                        )} ${displayCurrency}`
                                      : "—"
                                  }
                                  valueClass="text-slate-200"
                                />

                                <MetricCard
                                  label="Margen libre"
                                  value={
                                    account.freeMargin !==
                                    null
                                      ? `${formatMoney(
                                          account.freeMargin
                                        )} ${displayCurrency}`
                                      : "—"
                                  }
                                  valueClass="text-emerald-300"
                                />

                                <MetricCard
                                  label="Crecimiento equity"
                                  value={
                                    account.equityGrowthPercentage !==
                                    null
                                      ? formatPercentage(
                                          account.equityGrowthPercentage
                                        )
                                      : "—"
                                  }
                                  valueClass={getGrowthClasses(
                                    account.equityGrowthPercentage
                                  )}
                                />
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <InfoCard
                                  label="Cuenta MT5"
                                  value={
                                    account.accountLoginMasked ||
                                    "Sin información"
                                  }
                                />

                                <InfoCard
                                  label="Bróker"
                                  value={
                                    account.broker ||
                                    "Sin información"
                                  }
                                />

                                <InfoCard
                                  label="Servidor"
                                  value={
                                    account.server ||
                                    "Sin información"
                                  }
                                />

                                <InfoCard
                                  label="Última sincronización"
                                  value={
                                    account.lastSyncAt
                                      ? formatDate(
                                          account.lastSyncAt
                                        )
                                      : "Sin sincronizar"
                                  }
                                />
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <InfoCard
                                  label="Depósitos"
                                  value={
                                    account.totalDeposits !==
                                    null
                                      ? `${formatMoney(
                                          account.totalDeposits
                                        )} ${displayCurrency}`
                                      : "0.00"
                                  }
                                />

                                <InfoCard
                                  label="Retiros"
                                  value={
                                    account.totalWithdrawals !==
                                    null
                                      ? `${formatMoney(
                                          account.totalWithdrawals
                                        )} ${displayCurrency}`
                                      : "0.00"
                                  }
                                />
                              </div>

                                <Mt5GrowthChart
                                accountId={account.id}
                                currency={displayCurrency}
                               />
                               
                            </>
                          )}

                          {account.connectionStatus !==
                            "connected" && (
                            <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/[0.06] px-4 py-3 text-sm leading-6 text-slate-400">
                              {account.connectionStatus ===
                              "token-created"
                                ? "La clave está lista. El siguiente paso es instalarla en el EA AILANUX para comenzar a recibir datos reales."
                                : "Genera una clave privada para preparar esta cuenta para el conector AILANUX MT5."}
                            </div>
                          )}

                          {tokenAccountId ===
                            account.id &&
                            tokenError && (
                              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {tokenError}
                              </div>
                            )}

                          {tokenAccountId ===
                            account.id &&
                            generatedToken && (
                              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                                <p className="text-sm font-bold text-emerald-300">
                                  Clave de conexión
                                  generada
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-400">
                                  Guarda esta clave
                                  ahora. AILANUX no
                                  volverá a mostrarla
                                  completa.
                                </p>

                                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
                                  <p className="break-all font-mono text-xs leading-5 text-white">
                                    {
                                      generatedToken
                                    }
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={copyToken}
                                  className="mt-3 w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300"
                                >
                                  {copied
                                    ? "Clave copiada ✓"
                                    : "Copiar clave"}
                                </button>
                              </div>
                            )}

                          <button
                            type="button"
                            onClick={() =>
                              generateConnectionToken(
                                account.id
                              )
                            }
                            disabled={
                              generatingTokenId ===
                              account.id
                            }
                            className="mt-4 w-full rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
                          >
                            {generatingTokenId ===
                            account.id
                              ? "Generando clave..."
                              : account.connectionStatus ===
                                    "not-connected"
                                ? "Generar clave de conexión"
                                : "Generar nueva clave"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
            AILANUX CENTER · Seguimiento real de
            cuentas MetaTrader 5
          </footer>
        </div>
      </main>
    </AuthGuard>
  );
}

function MetricCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-base font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-semibold text-slate-300">
        {value}
      </p>
    </div>
  );
}