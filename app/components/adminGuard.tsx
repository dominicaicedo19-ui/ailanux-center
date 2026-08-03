"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const adminSnapshot = await getDoc(
          doc(db, "admins", user.uid)
        );

        const adminData = adminSnapshot.data();

        if (!adminSnapshot.exists() || adminData?.active !== true) {
          router.replace("/");
          return;
        }

        setCheckingAccess(false);
      } catch {
        router.replace("/");
      }
    });

    return unsubscribe;
  }, [router]);

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-amber-400" />

          <p className="mt-4 text-sm text-slate-400">
            Verificando acceso administrativo...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}