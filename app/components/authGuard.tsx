"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setCheckingSession(false);
    });

    return unsubscribe;
  }, [router]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-amber-400" />

          <p className="mt-4 text-sm text-slate-400">
            Verificando sesión...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}