"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type UserProfileData = {
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function UserProfile() {
  const [profile, setProfile] =
    useState<UserProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeProfile:
      | (() => void)
      | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeProfile?.();

        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        unsubscribeProfile = onSnapshot(
          doc(db, "users", user.uid),
          (snapshot) => {
            if (!snapshot.exists()) {
              setProfile(null);
              setError(
                "No se encontró el perfil del usuario."
              );
              setLoading(false);
              return;
            }

            const data = snapshot.data();

            setProfile({
              name: String(
                data.name ?? "Cliente AILANUX"
              ),
              email: String(
                data.email ?? user.email ?? ""
              ),
              role: String(
                data.role ?? "client"
              ),
              status: String(
                data.status ?? "active"
              ),
            });

            setError("");
            setLoading(false);
          },
          (snapshotError) => {
            console.error(
              "Error cargando perfil:",
              snapshotError
            );

            setError(
              "No se pudo cargar el perfil."
            );

            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  function getStatusLabel(status: string) {
    if (status === "active") {
      return "Cuenta activa";
    }

    if (status === "blocked") {
      return "Cuenta bloqueada";
    }

    if (status === "pending-verification") {
      return "Verificación pendiente";
    }

    return status;
  }

  function getStatusClasses(status: string) {
    if (status === "active") {
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    }

    if (status === "blocked") {
      return "border-red-400/20 bg-red-500/10 text-red-300";
    }

    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  function getStatusDotClasses(status: string) {
    if (status === "active") {
      return "bg-emerald-400";
    }

    if (status === "blocked") {
      return "bg-red-400";
    }

    return "bg-amber-400";
  }

  function getRoleLabel(role: string) {
    if (role === "admin") {
      return "Administrador";
    }

    return "Cliente";
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">
        Cargando perfil...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-300"
      >
        {error}
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initial =
    profile.name.trim().charAt(0).toUpperCase() ||
    "A";

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-lg font-bold text-amber-300 sm:h-14 sm:w-14 sm:text-xl">
            {initial}
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-400 sm:text-sm">
              Bienvenido
            </p>

            <h2 className="mt-1 break-words text-lg font-bold text-white sm:text-xl">
              {profile.name}
            </h2>

            <p className="mt-1 break-all text-xs text-slate-500 sm:text-sm">
              {profile.email}
            </p>

            <span className="mt-2 inline-flex rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              {getRoleLabel(profile.role)}
            </span>
          </div>
        </div>

        <div
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 sm:w-auto sm:shrink-0 sm:justify-start ${getStatusClasses(
            profile.status
          )}`}
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStatusDotClasses(
              profile.status
            )}`}
          />

          <span className="text-sm font-semibold">
            {getStatusLabel(profile.status)}
          </span>
        </div>
      </div>
    </section>
  );
}