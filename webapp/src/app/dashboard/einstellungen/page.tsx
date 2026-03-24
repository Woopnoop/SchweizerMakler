"use client";

import { useState, type FormEvent } from "react";
import { Settings, Download, Trash2, AlertTriangle } from "lucide-react";

export default function EinstellungenPage() {
  const [profile, setProfile] = useState({
    displayName: "",
    company: "",
    phone: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  function updateProfile(field: keyof typeof profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setProfileSaved(false);
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setProfileSaved(true);
      }
    } catch {
      // Handle error silently for now
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/dsgvo/export");
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maklertoolkit-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Beim Export ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        alert("Beim Löschen ist ein Fehler aufgetreten.");
      }
    } catch {
      alert("Beim Löschen ist ein Fehler aufgetreten.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <Settings className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
      </div>

      {/* Profile Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Profil</h2>
        <p className="mt-1 text-sm text-gray-600">
          Bearbeiten Sie Ihre persönlichen Angaben.
        </p>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700"
            >
              Anzeigename
            </label>
            <input
              id="displayName"
              type="text"
              value={profile.displayName}
              onChange={(e) => updateProfile("displayName", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="Max Mustermann"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700"
            >
              Firma
            </label>
            <input
              id="company"
              type="text"
              value={profile.company}
              onChange={(e) => updateProfile("company", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="Immobilien Mustermann GmbH"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Telefon
            </label>
            <input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => updateProfile("phone", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              placeholder="+49 911 1234567"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={profileLoading}
              className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {profileLoading ? "Wird gespeichert..." : "Speichern"}
            </button>
            {profileSaved && (
              <span className="text-sm text-[var(--success)] font-medium">
                Gespeichert
              </span>
            )}
          </div>
        </form>
      </div>

      {/* DSGVO Section */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Datenschutz (DSGVO)
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Verwalten Sie Ihre Daten gemäß Art. 15-21 DSGVO.
        </p>

        <div className="mt-6 space-y-4">
          {/* Export */}
          <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Alle Daten exportieren
              </p>
              <p className="text-xs text-gray-500">
                Laden Sie alle Ihre gespeicherten Daten als JSON-Datei
                herunter (Art. 20 DSGVO).
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              {exportLoading ? "Wird exportiert..." : "Daten exportieren"}
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex flex-col gap-3 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">
                Account löschen
              </p>
              <p className="text-xs text-red-600">
                Ihr Konto und alle zugehörigen Daten werden unwiderruflich
                gelöscht (Art. 17 DSGVO).
              </p>
            </div>
            {!deleteConfirmOpen ? (
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Account löschen
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Sind Sie sicher?
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleteLoading
                      ? "Wird gelöscht..."
                      : "Endgültig löschen"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
