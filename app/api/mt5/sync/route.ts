import { createHash } from "crypto";
import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const SNAPSHOT_INTERVAL_MS =
  5 * 60 * 1000;

function isValidNumber(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const rawToken =
      request.headers.get(
        "x-ailanux-token"
      );

    if (!rawToken) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No se recibió la clave de conexión.",
        },
        { status: 401 }
      );
    }

    if (
      !rawToken.startsWith("ALX_") ||
      rawToken.length < 30
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La clave de conexión no es válida.",
        },
        { status: 401 }
      );
    }

    const tokenHash = createHash(
      "sha256"
    )
      .update(rawToken)
      .digest("hex");

    /*
     * Localizamos directamente la cuenta.
     * Ya no usamos collectionGroup.
     */
    const tokenReference = adminDb
      .collection("mt5ConnectorTokens")
      .doc(tokenHash);

    const tokenSnapshot =
      await tokenReference.get();

    if (!tokenSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La clave no corresponde a una cuenta MT5.",
        },
        { status: 401 }
      );
    }

    const tokenData =
      tokenSnapshot.data();

    if (tokenData?.active !== true) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La clave de conexión está desactivada.",
        },
        { status: 401 }
      );
    }

    const userId = String(
      tokenData?.userId ?? ""
    );

    const accountId = String(
      tokenData?.accountId ?? ""
    );

    if (!userId || !accountId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La clave de conexión está incompleta.",
        },
        { status: 401 }
      );
    }

    const accountDocument = adminDb
      .collection("users")
      .doc(userId)
      .collection("mt5Accounts")
      .doc(accountId);

    const accountSnapshot =
      await accountDocument.get();

    if (!accountSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No se encontró la cuenta MT5 asociada.",
        },
        { status: 404 }
      );
    }

    const accountData =
      accountSnapshot.data() ?? {};

    const body = await request.json();

    const accountLogin = String(
      body.accountLogin ?? ""
    ).trim();

    const broker = String(
      body.broker ?? ""
    ).trim();

    const server = String(
      body.server ?? ""
    ).trim();

    const accountCurrency = String(
      body.accountCurrency ?? ""
    ).trim();

    const balance = body.balance;
    const equity = body.equity;
    const floatingProfit =
      body.floatingProfit;
    const margin = body.margin;
    const freeMargin = body.freeMargin;

    const totalDeposits =
      body.totalDeposits ?? 0;

    const totalWithdrawals =
      body.totalWithdrawals ?? 0;

    if (
      !accountLogin ||
      accountLogin.length > 40
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El número de cuenta MT5 no es válido.",
        },
        { status: 400 }
      );
    }

    if (
      !broker ||
      broker.length > 120
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El nombre del bróker no es válido.",
        },
        { status: 400 }
      );
    }

    if (
      !server ||
      server.length > 120
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El servidor MT5 no es válido.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidNumber(balance) ||
      !isValidNumber(equity) ||
      !isValidNumber(floatingProfit) ||
      !isValidNumber(margin) ||
      !isValidNumber(freeMargin) ||
      !isValidNumber(totalDeposits) ||
      !isValidNumber(totalWithdrawals)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Los valores financieros recibidos no son válidos.",
        },
        { status: 400 }
      );
    }

    if (
      balance < 0 ||
      equity < 0 ||
      margin < 0 ||
      freeMargin < 0 ||
      totalDeposits < 0 ||
      totalWithdrawals < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Se recibieron valores financieros fuera del rango permitido.",
        },
        { status: 400 }
      );
    }

    const initialCapital = Number(
      accountData.initialCapital ?? 0
    );

    const adjustedTradingProfit =
      balance -
      initialCapital -
      totalDeposits +
      totalWithdrawals;

    const equityAdjustedProfit =
      equity -
      initialCapital -
      totalDeposits +
      totalWithdrawals;

    const growthPercentage =
      initialCapital > 0
        ? (adjustedTradingProfit /
            initialCapital) *
          100
        : 0;

    const equityGrowthPercentage =
      initialCapital > 0
        ? (equityAdjustedProfit /
            initialCapital) *
          100
        : 0;

    const loginMasked =
      accountLogin.length <= 4
        ? `****${accountLogin}`
        : `${"*".repeat(
            Math.max(
              4,
              accountLogin.length - 4
            )
          )}${accountLogin.slice(-4)}`;

    const now = Date.now();

    const previousSnapshot =
      accountData.lastSnapshotAt;

    let shouldCreateSnapshot = true;

    if (
      previousSnapshot instanceof Timestamp
    ) {
      shouldCreateSnapshot =
        now -
          previousSnapshot.toMillis() >=
        SNAPSHOT_INTERVAL_MS;
    }

    const accountUpdate: Record<
      string,
      unknown
    > = {
      accountLoginMasked: loginMasked,
      broker,
      server,
      accountCurrency,

      balance,
      equity,
      floatingProfit,
      margin,
      freeMargin,

      totalDeposits,
      totalWithdrawals,

      tradingProfit:
        adjustedTradingProfit,

      growthPercentage,
      equityGrowthPercentage,

      connectionStatus: "connected",

      lastSyncAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    };

    if (shouldCreateSnapshot) {
      accountUpdate.lastSnapshotAt =
        FieldValue.serverTimestamp();
    }

    await accountDocument.update(
      accountUpdate
    );

    if (shouldCreateSnapshot) {
      await accountDocument
        .collection("snapshots")
        .add({
          balance,
          equity,
          floatingProfit,
          margin,
          freeMargin,

          totalDeposits,
          totalWithdrawals,

          tradingProfit:
            adjustedTradingProfit,

          growthPercentage,
          equityGrowthPercentage,

          recordedAt:
            FieldValue.serverTimestamp(),
        });
    }

    return NextResponse.json({
      success: true,
      message:
        "Cuenta MT5 sincronizada correctamente.",
      snapshotCreated:
        shouldCreateSnapshot,
    });
  } catch (error) {
    console.error(
      "Error sincronizando MT5:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "No se pudo procesar la sincronización de MT5.",
      },
      { status: 500 }
    );
  }
}