import fs from "fs";
import path from "path";

interface Lead {
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

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readLeads(): Lead[] {
  ensureDataDir();
  if (!fs.existsSync(LEADS_FILE)) return [];
  return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
}

function writeLeads(leads: Lead[]) {
  ensureDataDir();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

export function getAll(): Lead[] {
  return readLeads();
}

export function addLead(lead: Omit<Lead, "receivedAt">): Lead {
  const leads = readLeads();
  const existing = leads.findIndex((l) => l.id === lead.id);
  const fullLead: Lead = { ...lead, receivedAt: Date.now() };

  if (existing !== -1) {
    leads[existing] = fullLead;
  } else {
    leads.push(fullLead);
  }

  writeLeads(leads);
  return fullLead;
}

export function removeLead(id: string): boolean {
  const leads = readLeads();
  const filtered = leads.filter((l) => l.id !== id);

  if (filtered.length === leads.length) return false;

  writeLeads(filtered);
  return true;
}
