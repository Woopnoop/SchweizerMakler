"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Calendar,
  ArrowRight,
  Calculator,
  FileText,
  MapPin,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  leads: number;
  objekte: number;
  interessenten: number;
  termine: number;
}

const quickActions = [
  { label: "Nebenkosten berechnen", icon: Calculator, href: "/dashboard/rechner" },
  { label: "Stadtteil-Analyse", icon: MapPin, href: "/dashboard/karte" },
  { label: "Leads anzeigen", icon: Zap, href: "/dashboard/leads" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ leads: 0, objekte: 0, interessenten: 0, termine: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Leads zählen
        const leadsRes = await fetch("/api/leads");
        const leads = leadsRes.ok ? await leadsRes.json() : [];

        setStats({
          leads: Array.isArray(leads) ? leads.length : 0,
          objekte: 0,
          interessenten: 0,
          termine: 0,
        });
      } catch {
        // API nicht erreichbar
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Leads",
      value: stats.leads,
      icon: Zap,
      href: "/dashboard/leads",
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Objekte",
      value: stats.objekte,
      icon: Building2,
      href: "/dashboard/objekte",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Interessenten",
      value: stats.interessenten,
      icon: Users,
      href: "/dashboard/interessenten",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Termine",
      value: stats.termine,
      icon: Calendar,
      href: "/dashboard/termine",
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ihre aktuelle Übersicht.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Schnellzugriff</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:border-[var(--brand)] hover:shadow-md transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <action.icon className="h-5 w-5 text-[var(--brand)]" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
