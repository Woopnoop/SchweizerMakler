import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================
// Makler (Nutzer)
// ============================================================

export const makler = pgTable("makler", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  companyName: text("company_name"),
  phone: text("phone"),
  logoUrl: text("logo_url"),
  subscriptionTier: text("subscription_tier").default("basis").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Interessenten (Prospects)
// ============================================================

export const interessenten = pgTable("interessenten", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  maklerId: uuid("makler_id")
    .references(() => makler.id, { onDelete: "cascade" })
    .notNull(),
  vorname: text("vorname").notNull(),
  nachname: text("nachname").notNull(),
  email: text("email"),
  telefon: text("telefon"),
  notizen: text("notizen"),
  suchkriterien: jsonb("suchkriterien").$type<{
    minPreis?: number;
    maxPreis?: number;
    minFlaeche?: number;
    zimmer?: number;
    stadtteile?: string[];
  }>(),
  dsgvoEinwilligungAm: timestamp("dsgvo_einwilligung_am", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Objekte (Properties)
// ============================================================

export const objekte = pgTable("objekte", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  maklerId: uuid("makler_id")
    .references(() => makler.id, { onDelete: "cascade" })
    .notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung"),
  adresse: text("adresse"),
  plz: text("plz"),
  stadt: text("stadt"),
  // PostGIS: Gespeichert als raw SQL, gelesen via ST_AsGeoJSON
  locationLat: numeric("location_lat"),
  locationLon: numeric("location_lon"),
  preis: numeric("preis"),
  listingType: text("listing_type").notNull(),
  wohnflaeche: numeric("wohnflaeche"),
  grundstueck: numeric("grundstueck"),
  zimmer: numeric("zimmer"),
  baujahr: integer("baujahr"),
  energieausweis: jsonb("energieausweis").$type<{
    art?: "bedarfsausweis" | "verbrauchsausweis";
    endenergiebedarf?: number;
    effizienzklasse?: string;
    energietraeger?: string;
    baujahrHeizung?: number;
  }>(),
  ausstattung: jsonb("ausstattung").$type<Record<string, boolean>>(),
  bilder: text("bilder").array(),
  status: text("status").default("aktiv").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Termine (Appointments)
// ============================================================

export const termine = pgTable("termine", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  maklerId: uuid("makler_id")
    .references(() => makler.id, { onDelete: "cascade" })
    .notNull(),
  objektId: uuid("objekt_id").references(() => objekte.id, { onDelete: "set null" }),
  interessentId: uuid("interessent_id").references(() => interessenten.id, { onDelete: "set null" }),
  terminDatum: timestamp("termin_datum", { withTimezone: true }).notNull(),
  notizen: text("notizen"),
  status: text("status").default("geplant").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Stadtteile (Districts — Open Data)
// ============================================================

export const stadtteile = pgTable("stadtteile", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  stadt: text("stadt").notNull(),
  einwohner: integer("einwohner"),
  infrastrukturScore: numeric("infrastruktur_score"),
  anbindungScore: numeric("anbindung_score"),
  nahversorgungScore: numeric("nahversorgung_score"),
  gruenScore: numeric("gruen_score"),
  gesamtScore: numeric("gesamt_score"),
  datenstand: date("datenstand"),
  /** PFLICHT: Datenherkunft dokumentieren */
  quellenangabe: text("quellenangabe").notNull(),
});
