import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Ligue du BAP",
  description: "Ligue mensuelle de badminton de Bad' à Paname",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <header className="px-4 pt-10 pb-4 sm:px-6 flex items-center gap-4">
        <div className="shrink-0">
          <Image
            src="/bap-logo.png"
            alt="Logo du club Bad' à Paname"
            width={56}
            height={56}
            className="rounded-xl shadow-md"
            priority
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ligue du BAP
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-md">
            Ligue mensuelle de matchs en simple pour les adhérents de Bad&apos; à Paname.
          </p>
        </div>
      </header>

      <section className="px-4 sm:px-6 mt-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-lg">
          <h2 className="text-lg font-semibold mb-2">
            Saison en cours
          </h2>
          <p className="text-sm text-slate-300 mb-4">
            Consulte ton classement, saisis tes matchs et découvre les maillots du mois.
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="/register"
              className="w-full rounded-xl bg-emerald-500 text-slate-900 font-semibold py-2.5 text-sm shadow hover:bg-emerald-400 transition text-center"
            >
              S'inscrire
            </a>
            <a
              href="/login"
              className="w-full rounded-xl bg-slate-700 text-slate-100 font-medium py-2.5 text-sm hover:bg-slate-600 transition text-center"
            >
              Se connecter
            </a>
          </div>
        </div>
      </section>

      <footer className="mt-auto px-4 sm:px-6 py-4 text-xs text-slate-500">
        Ligue du BAP · Prototype en développement pour Bad&apos; à Paname
      </footer>
    </main>
  );
}