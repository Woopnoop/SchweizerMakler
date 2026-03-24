"use client";

import { Lock } from "lucide-react";
import { getTierLabel, type Feature, getRequiredTier } from "@/lib/auth/tiers";
import Link from "next/link";

interface UpgradePromptProps {
  feature: Feature;
  currentTier: string;
}

export function UpgradePrompt({ feature, currentTier }: UpgradePromptProps) {
  const requiredTier = getRequiredTier(feature);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center">
      <Lock className="mb-4 h-12 w-12 text-gray-400" />
      <h3 className="mb-2 text-lg font-semibold text-gray-700">
        Feature nicht verfügbar
      </h3>
      <p className="mb-1 text-sm text-gray-500">
        Dieses Feature ist in Ihrem aktuellen Plan{" "}
        <strong>{getTierLabel(currentTier)}</strong> nicht enthalten.
      </p>
      <p className="mb-6 text-sm text-gray-500">
        Benötigt: <strong>{getTierLabel(requiredTier)}</strong> oder höher.
      </p>
      <Link
        href="/dashboard/einstellungen"
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Plan upgraden
      </Link>
    </div>
  );
}
