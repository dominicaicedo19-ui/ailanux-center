"use client";

import { FormEvent, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(db, "users", credential.user.uid), {
  uid: credential.user.uid,
  name: name.trim(),
  email: email.trim().toLowerCase(),
  role: "client",
  status: "pending-verification",
  createdAt: serverTimestamp(),
});

await sendEmailVerification(credential.user);
await signOut(auth);

router.replace("/login?registered=true");
    } catch {
      setError(
        "No se pudo crear la cuenta. Verifica el correo o utiliza otro."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
    >
      <h2 className="text-center text-3xl font-bold text-white">
        Crear cuenta
      </h2>

      <p className="mb-8 mt-2 text-center text-slate-400">
        Registro de cliente AILANUX CENTER
      </p>

      <div className="mb-5">
        <label htmlFor="name" className="mb-2 block text-sm text-slate-300">
          Nombre completo
        </label>

        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre del cliente"
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>

      <div className="mb-5">
        <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
          Correo electrónico
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="password"
          className="mb-2 block text-sm text-slate-300"
        >
          Contraseña
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm text-slate-300"
        >
          Confirmar contraseña
        </label>

        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>

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
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}