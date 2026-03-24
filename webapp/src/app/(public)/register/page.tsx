"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    displayName: "",
    company: "",
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (form.password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (!privacyAccepted) {
      setError("Bitte akzeptieren Sie die Datenschutzerklärung.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          company: form.company || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error ?? "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut."
        );
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ein unbekannter Fehler ist aufgetreten."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <UserPlus className="h-6 w-6 text-[var(--brand)]" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Konto erstellen
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Registrieren Sie sich kostenlos für MaklerToolkit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-Mail-Adresse <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="makler@beispiel.de"
            />
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700"
            >
              Anzeigename <span className="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              required
              autoComplete="name"
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="Max Mustermann"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700"
            >
              Firma{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="company"
              type="text"
              autoComplete="organization"
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="Immobilien Mustermann GmbH"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Passwort <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-gray-700"
            >
              Passwort bestätigen <span className="text-red-500">*</span>
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.passwordConfirm}
              onChange={(e) => updateField("passwordConfirm", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="Passwort wiederholen"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              id="privacy"
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]"
            />
            <label htmlFor="privacy" className="text-sm text-gray-600">
              Ich habe die{" "}
              <Link
                href="/datenschutz"
                target="_blank"
                className="font-medium text-[var(--brand)] underline hover:no-underline"
              >
                Datenschutzerklärung
              </Link>{" "}
              gelesen und akzeptiere diese.{" "}
              <span className="text-red-500">*</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Wird registriert..." : "Konto erstellen"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Bereits registriert?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors"
          >
            Jetzt anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
