"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const parameters = new URLSearchParams(
      window.location.search
    );

    if (parameters.get("blocked") === "true") {
      setError(
        "Tu cuenta está bloqueada. Comunícate con el administrador de AILANUX CENTER."
      );
    }
  }, []);

  async function handlePasswordReset() {
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Escribe primero tu correo electrónico.");
      return;
    }

    setResetLoading(true);

    try {
      auth.languageCode = "es";

      await sendPasswordResetEmail(auth, cleanEmail);

      setMessage(
        "Te enviamos un correo para restablecer tu contraseña. Revisa también la carpeta de spam."
      );
    } catch (resetError) {
      console.error(
        "Error enviando recuperación:",
        resetError
      );

      setError(
        "No se pudo enviar el correo de recuperación. Verifica la dirección escrita."
      );
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    let user;

    try {
      const credential =
        await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password
        );

      user = credential.user;
    } catch (authenticationError) {
      console.error(
        "Error de autenticación:",
        authenticationError
      );

      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    try {
      if (!user.emailVerified) {
        auth.languageCode = "es";

        await sendEmailVerification(user);
        await signOut(auth);

        setError(
          "Tu correo todavía no está verificado. Te enviamos un nuevo enlace de verificación. Revisa también la carpeta de spam."
        );

        return;
      }

      const profileReference = doc(
        db,
        "users",
        user.uid
      );

      const profileSnapshot = await getDoc(
        profileReference
      );

      if (!profileSnapshot.exists()) {
        await signOut(auth);

        setError(
          "No se encontró el perfil de esta cuenta. Comunícate con el administrador."
        );

        return;
      }

      const currentStatus = String(
        profileSnapshot.data().status ?? ""
      );

      if (currentStatus === "blocked") {
        await signOut(auth);

        setError(
          "Tu cuenta está bloqueada. Comunícate con el administrador de AILANUX CENTER."
        );

        return;
      }

      if (
        currentStatus !== "active" &&
        currentStatus !== "pending-verification"
      ) {
        await signOut(auth);

        setError(
          "Esta cuenta no tiene autorización para ingresar."
        );

        return;
      }

    if (currentStatus === "pending-verification") {
  await updateDoc(profileReference, {
    emailVerified: true,
    status: "active",
    lastLoginAt: serverTimestamp(),
  });
} else {
  await updateDoc(profileReference, {
    lastLoginAt: serverTimestamp(),
  });
}

const adminReference = doc(
  db,
  "admins",
  user.uid
);

const adminSnapshot = await getDoc(
  adminReference
);

      const isAdmin =
        adminSnapshot.exists() &&
        adminSnapshot.data().active === true;

      router.replace(
        isAdmin ? "/admin" : "/"
      );
    } catch (accessError) {
      console.error(
        "Error validando el acceso:",
        accessError
      );

      await signOut(auth);

      setError(
        "No se pudo validar el acceso de la cuenta. Revisa las reglas de Firestore."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
    >
      <h2 className="mb-2 text-center text-3xl font-bold text-white">
        Iniciar sesión
      </h2>

      <p className="mb-8 text-center text-slate-400">
        Bienvenido a AILANUX CENTER
      </p>

      <div className="mb-5">
        <label
          htmlFor="email"
          className="mb-2 block text-sm text-slate-300"
        >
          Correo electrónico
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor="password"
          className="mb-2 block text-sm text-slate-300"
        >
          Contraseña
        </label>

        <div className="flex items-center rounded-xl border border-white/10 bg-black/30 focus-within:border-blue-500">
          <input
            id="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="********"
            autoComplete="current-password"
            required
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) => !current
              )
            }
            className="px-4 text-sm text-blue-400 hover:text-blue-300"
          >
            {showPassword
              ? "Ocultar"
              : "Mostrar"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePasswordReset}
        disabled={resetLoading || loading}
        className="mb-5 text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resetLoading
          ? "Enviando correo..."
          : "¿Olvidaste tu contraseña?"}
      </button>

      {message && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || resetLoading}
        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Verificando..."
          : "Iniciar sesión"}
      </button>
    </form>
  );
}