"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/");
    } catch {
      setError("Correo o contraseña incorrectos.");
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
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="password"
          className="mb-2 block text-sm text-slate-300"
        >
          Contraseña
        </label>

        <div className="flex items-center rounded-xl border border-white/10 bg-black/30 focus-within:border-blue-500">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            autoComplete="current-password"
            required
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="px-4 text-sm text-blue-400 hover:text-blue-300"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
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
        {loading ? "Verificando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}