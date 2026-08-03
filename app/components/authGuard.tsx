"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile?.();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!user.emailVerified) {
        signOut(auth).finally(() => {
          router.replace("/login");
        });

        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, "users", user.uid),
        async (snapshot) => {
          if (!snapshot.exists()) {
            await signOut(auth);
            router.replace("/login");
            return;
          }

          const status = String(snapshot.data().status ?? "");

          if (status === "blocked") {
            await signOut(auth);
            router.replace("/login?blocked=true");
            return;
          }

          if (status !== "active") {
            await signOut(auth);
            router.replace("/login");
            return;
          }

          setCheckingAccess(false);
        },
        async () => {
          await signOut(auth);
          router.replace("/login");
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, [router]);

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-amber-400" />

          <p className="mt-4 text-sm text-slate-400">
            Verificando acceso...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}