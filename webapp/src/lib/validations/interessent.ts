import { z } from "zod";

// ---------------------------------------------------------------------------
// Suchkriterien (JSONB)
// ---------------------------------------------------------------------------

export const suchkriterienSchema = z.object({
  minPreis: z.number().min(0).optional(),
  maxPreis: z.number().min(0).optional(),
  minFlaeche: z.number().min(0).optional(),
  zimmer: z.number().min(1).optional(),
  stadtteile: z.array(z.string().min(1)).optional(),
});

export type Suchkriterien = z.infer<typeof suchkriterienSchema>;

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export const interessentCreateSchema = z.object({
  vorname: z
    .string()
    .min(2, "Vorname muss mindestens 2 Zeichen lang sein")
    .max(100, "Vorname darf maximal 100 Zeichen lang sein"),
  nachname: z
    .string()
    .min(2, "Nachname muss mindestens 2 Zeichen lang sein")
    .max(100, "Nachname darf maximal 100 Zeichen lang sein"),
  email: z
    .string()
    .email("Ungueltige E-Mail-Adresse")
    .optional()
    .or(z.literal("")),
  telefon: z.string().max(50).optional().or(z.literal("")),
  notizen: z
    .string()
    .max(5000, "Notizen duerfen maximal 5000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  suchkriterien: suchkriterienSchema.optional(),
  dsgvoEinwilligung: z.literal(true, {
    errorMap: () => ({ message: "DSGVO-Einwilligung erforderlich" }),
  }),
});

export type InteressentCreateInput = z.infer<typeof interessentCreateSchema>;

// ---------------------------------------------------------------------------
// UPDATE — partial; dsgvoEinwilligung darf NICHT auf false gesetzt werden
// (Widerruf = Löschung des gesamten Datensatzes)
// ---------------------------------------------------------------------------

export const interessentUpdateSchema = z.object({
  vorname: z
    .string()
    .min(2, "Vorname muss mindestens 2 Zeichen lang sein")
    .max(100, "Vorname darf maximal 100 Zeichen lang sein")
    .optional(),
  nachname: z
    .string()
    .min(2, "Nachname muss mindestens 2 Zeichen lang sein")
    .max(100, "Nachname darf maximal 100 Zeichen lang sein")
    .optional(),
  email: z
    .string()
    .email("Ungueltige E-Mail-Adresse")
    .optional()
    .or(z.literal("")),
  telefon: z.string().max(50).optional().or(z.literal("")),
  notizen: z
    .string()
    .max(5000, "Notizen duerfen maximal 5000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  suchkriterien: suchkriterienSchema.optional(),
});

export type InteressentUpdateInput = z.infer<typeof interessentUpdateSchema>;
