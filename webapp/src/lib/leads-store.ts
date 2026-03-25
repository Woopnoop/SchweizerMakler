/**
 * Leads Store — In-Memory mit Fallback auf Dateisystem.
 * Vercel: Nutzt In-Memory (kein fs-Zugriff in Serverless).
 * Lokal: Nutzt data/leads.json (persistent).
 */

export interface Lead {
  id: string;
  portal: string;
  url: string;
  title: string;
  location: string;
  currentPrice: number;
  listingType: "miete" | "kauf";
  areaSqm?: number;
  rooms?: number;
  standortScore?: number;
  priceHistory: Array<{ timestamp: number; price: number }>;
  receivedAt: number;
}

// In-Memory Store (funktioniert überall, auch auf Vercel)
const memoryStore = new Map<string, Lead>();

function tryFileRead(): Lead[] | null {
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(process.cwd(), "data", "leads.json");
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch {
    // Dateisystem nicht verfügbar (Vercel Serverless)
  }
  return null;
}

function tryFileWrite(leads: Lead[]): void {
  try {
    const fs = require("fs");
    const path = require("path");
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "leads.json"), JSON.stringify(leads, null, 2));
  } catch {
    // Dateisystem nicht verfügbar — nur In-Memory
  }
}

// Beim Start aus Datei laden falls möglich
function initFromFile(): void {
  if (memoryStore.size > 0) return;
  const fileLeads = tryFileRead();
  if (fileLeads) {
    for (const lead of fileLeads) {
      memoryStore.set(lead.id, lead);
    }
  }
}

export function getAll(): Lead[] {
  initFromFile();
  return Array.from(memoryStore.values()).sort((a, b) => b.receivedAt - a.receivedAt);
}

export function addLead(lead: Omit<Lead, "receivedAt">): Lead {
  initFromFile();
  const fullLead: Lead = { ...lead, receivedAt: Date.now() };
  memoryStore.set(lead.id, fullLead);
  tryFileWrite(Array.from(memoryStore.values()));
  return fullLead;
}

export function removeLead(id: string): boolean {
  initFromFile();
  const deleted = memoryStore.delete(id);
  if (deleted) {
    tryFileWrite(Array.from(memoryStore.values()));
  }
  return deleted;
}
