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
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile?.();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, "users", user.uid),
        (snapshot) => {
          if (!snapshot.exists()) {
            setError("No se encontró el perfil del usuario.");
            setLoading(false);
            return;
          }

          const data = snapshot.data();

          setProfile({
            name: String(data.name ?? "Cliente AILANUX"),
            email: String(data.email ?? user.email ?? ""),
            role: String(data.role ?? "client"),
            status: String(data.status ?? "active"),
          });

          setError("");
          setLoading(false);
        },
        () => {
          setError("No se pudo cargar el perfil.");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">
        Cargando perfil...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-xl font-bold text-amber-300">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="text-sm text-slate-400">Bienvenido</p>

            <h2 className="text-xl font-bold text-white">
              {profile.name}
            </h2>

            <p className="text-sm text-slate-500">
              {profile.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

          <span className="text-sm font-semibold text-emerald-300">
            {profile.status === "active" ? "Cuenta activa" : profile.status}
          </span>
        </div>
      </div>
    </div>
  );
}