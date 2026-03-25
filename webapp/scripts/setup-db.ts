/**
 * Erstellt alle Tabellen in der Vercel Postgres Datenbank.
 * Ausführen: npx tsx scripts/setup-db.ts
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setup() {
  const client = await pool.connect();

  try {
    console.log("Verbinde mit Datenbank...");

    // Tabellen erstellen
    await client.query(`
      -- Makler (Nutzer)
      CREATE TABLE IF NOT EXISTS makler (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        company_name TEXT,
        phone TEXT,
        logo_url TEXT,
        subscription_tier TEXT NOT NULL DEFAULT 'basis',
        stripe_customer_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Leads (von Extension empfangen)
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        portal TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT DEFAULT '',
        current_price NUMERIC NOT NULL,
        listing_type TEXT NOT NULL DEFAULT 'kauf',
        area_sqm NUMERIC,
        rooms NUMERIC,
        standort_score NUMERIC,
        price_history JSONB DEFAULT '[]',
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Objekte (Properties)
      CREATE TABLE IF NOT EXISTS objekte (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,
        titel TEXT NOT NULL,
        beschreibung TEXT,
        adresse TEXT,
        plz TEXT,
        stadt TEXT,
        location_lat NUMERIC,
        location_lon NUMERIC,
        preis NUMERIC,
        listing_type TEXT NOT NULL,
        wohnflaeche NUMERIC,
        grundstueck NUMERIC,
        zimmer NUMERIC,
        baujahr INTEGER,
        energieausweis JSONB,
        ausstattung JSONB,
        bilder TEXT[],
        status TEXT NOT NULL DEFAULT 'aktiv',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Interessenten (Prospects)
      CREATE TABLE IF NOT EXISTS interessenten (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,
        vorname TEXT NOT NULL,
        nachname TEXT NOT NULL,
        email TEXT,
        telefon TEXT,
        notizen TEXT,
        suchkriterien JSONB,
        dsgvo_einwilligung_am TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Termine (Appointments)
      CREATE TABLE IF NOT EXISTS termine (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,
        objekt_id UUID REFERENCES objekte(id) ON DELETE SET NULL,
        interessent_id UUID REFERENCES interessenten(id) ON DELETE SET NULL,
        termin_datum TIMESTAMPTZ NOT NULL,
        notizen TEXT,
        status TEXT NOT NULL DEFAULT 'geplant',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Stadtteile
      CREATE TABLE IF NOT EXISTS stadtteile (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        stadt TEXT NOT NULL,
        einwohner INTEGER,
        infrastruktur_score NUMERIC,
        anbindung_score NUMERIC,
        nahversorgung_score NUMERIC,
        gruen_score NUMERIC,
        gesamt_score NUMERIC,
        datenstand DATE,
        quellenangabe TEXT NOT NULL
      );
    `);

    console.log("Tabellen erstellt!");

    // Gast-User anlegen falls nicht vorhanden
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hashSync("gast1", 12);

    await client.query(`
      INSERT INTO makler (id, email, password_hash, display_name, subscription_tier)
      VALUES ('00000000-0000-0000-0000-000000000001', 'gast', $1, 'Gast', 'pro')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);

    console.log("Gast-User angelegt (gast / gast1)");

    // Prüfen
    const result = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log("Vorhandene Tabellen:", result.rows.map(r => r.tablename));

  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch(console.error);
