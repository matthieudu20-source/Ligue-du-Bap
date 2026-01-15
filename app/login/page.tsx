"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      // Connexion réussie, rediriger vers le tableau de bord (on le créera après)
      router.push("/dashboard");
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion");
      setLoading(false);
    }
  };

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
            Connexion
          </p>
        </div>
      </header>

      <section className="px-4 sm:px-6 mt-4 flex-1">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-lg max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">
            Se connecter
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium mb-1">
                Email ou Pseudo
              </label>
              <input
                id="identifier"
                type="text"
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({ ...formData, identifier: e.target.value })
                }
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="ton@email.com ou ton pseudo"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ton mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 text-slate-900 font-semibold py-2.5 text-sm shadow hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-400">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
              S'inscrire
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-6 py-4 text-xs text-slate-500 text-center">
        <Link href="/" className="text-slate-400 hover:text-slate-300">
          ← Retour à l'accueil
        </Link>
      </footer>
    </main>
  );
}
