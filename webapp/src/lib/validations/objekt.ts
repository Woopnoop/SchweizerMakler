import { z } from "zod";

// ---------------------------------------------------------------------------
// Energieausweis (optional sub-object)
// ---------------------------------------------------------------------------

const energieausweisSchema = z.object({
  art: z.enum(["bedarfsausweis", "verbrauchsausweis"]).optional(),
  endenergiebedarf: z.coerce.number().nonnegative().optional(),
  effizienzklasse: z
    .enum(["A+", "A", "B", "C", "D", "E", "F", "G", "H"])
    .optional(),
  energietraeger: z.string().max(100).optional(),
  baujahrHeizung: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
});

// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------

export const objektCreateSchema = z.object({
  titel: z
    .string()
    .min(3, "Titel muss mindestens 3 Zeichen lang sein")
    .max(200, "Titel darf maximal 200 Zeichen lang sein"),
  beschreibung: z
    .string()
    .max(5000, "Beschreibung darf maximal 5.000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  adresse: z.string().max(300).optional().or(z.literal("")),
  plz: z
    .string()
    .regex(/^\d{5}$/, "PLZ muss aus 5 Ziffern bestehen")
    .optional()
    .or(z.literal("")),
  stadt: z.string().max(100).optional().or(z.literal("")),
  preis: z.coerce.number().positive("Preis muss positiv sein"),
  listingType: z.enum(["miete", "kauf"], {
    required_error: "Bitte Miete oder Kauf auswählen",
  }),
  wohnflaeche: z.coerce.number().nonnegative().optional().or(z.literal("")),
  grundstueck: z.coerce.number().nonnegative().optional().or(z.literal("")),
  zimmer: z.coerce.number().nonnegative().optional().or(z.literal("")),
  baujahr: z.coerce
    .number()
    .int()
    .min(1800, "Baujahr muss mindestens 1800 sein")
    .max(2026, "Baujahr darf maximal 2026 sein")
    .optional()
    .or(z.literal("")),
  energieausweis: energieausweisSchema.optional(),
  status: z.enum(["aktiv", "reserviert", "verkauft", "vermietet"]).default("aktiv"),
});

export type ObjektCreateInput = z.infer<typeof objektCreateSchema>;

// ---------------------------------------------------------------------------
// Update schema (all fields optional)
// ---------------------------------------------------------------------------

export const objektUpdateSchema = objektCreateSchema.partial();

export type ObjektUpdateInput = z.infer<typeof objektUpdateSchema>;
