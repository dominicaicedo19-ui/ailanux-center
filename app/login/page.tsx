import Image from "next/image";
import LoginForm from "../components/loginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] p-6">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute bottom-[-180px] right-[-180px] h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full">
        <div className="mb-8 text-center">
          <Image
            src="/images/logo-ailanux.png"
            alt="Logo de AILANUX PRO"
            width={112}
            height={112}
            priority
            className="mx-auto mb-4 h-auto w-28"
          />

          <h1 className="text-4xl font-bold text-white">
            AILANUX CENTER
          </h1>

          <p className="mt-2 text-slate-400">
            Plataforma Inteligente de Simulación Financiera
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}