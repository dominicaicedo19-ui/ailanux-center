import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  adminAuth,
  adminDb,
} from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "No se recibió una sesión válida.",
        },
        { status: 401 }
      );
    }

    const idToken = authorization.replace(
      "Bearer ",
      ""
    );

    const decodedToken =
      await adminAuth.verifyIdToken(idToken);

    const body = await request.json();

    const accountId = String(
      body.accountId ?? ""
    ).trim();

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No se recibió el identificador de la cuenta.",
        },
        { status: 400 }
      );
    }

    const userReference = adminDb
      .collection("users")
      .doc(decodedToken.uid);

    const userSnapshot =
      await userReference.get();

    if (!userSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "El perfil del usuario no existe.",
        },
        { status: 404 }
      );
    }

    const userData = userSnapshot.data();

    if (userData?.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message:
            "La cuenta del usuario no está activa.",
        },
        { status: 403 }
      );
    }

    const accountReference = userReference
      .collection("mt5Accounts")
      .doc(accountId);

    const accountSnapshot =
      await accountReference.get();

    if (!accountSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No se encontró la cuenta MT5.",
        },
        { status: 404 }
      );
    }

    /*
     * Si existía una clave anterior,
     * eliminamos su registro privado.
     */
    const previousHash =
      accountSnapshot.data()?.connectorTokenHash;

    if (
      typeof previousHash === "string" &&
      previousHash
    ) {
      await adminDb
        .collection("mt5ConnectorTokens")
        .doc(previousHash)
        .delete()
        .catch(() => {});
    }

    const rawToken =
      `ALX_${randomBytes(32).toString("hex")}`;

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const batch = adminDb.batch();

    /*
     * Guardamos el hash en la cuenta.
     */
    batch.update(accountReference, {
      connectorTokenHash: tokenHash,
      tokenCreatedAt:
        FieldValue.serverTimestamp(),
      connectionStatus: "token-created",
      updatedAt: FieldValue.serverTimestamp(),
    });

    /*
     * Registro privado que permite localizar
     * directamente qué usuario y qué cuenta
     * pertenecen a la clave.
     */
    const tokenReference = adminDb
      .collection("mt5ConnectorTokens")
      .doc(tokenHash);

    batch.set(tokenReference, {
      userId: decodedToken.uid,
      accountId,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json(
      {
        success: true,
        message:
          "Clave de conexión generada correctamente.",
        token: rawToken,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error generando la clave MT5:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "No se pudo generar la clave de conexión.",
      },
      { status: 500 }
    );
  }
}