import { z } from "zod";

export const terminStatusEnum = z.enum(["geplant", "durchgefuehrt", "abgesagt"]);

export type TerminStatus = z.infer<typeof terminStatusEnum>;

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export const terminCreateSchema = z.object({
  terminDatum: z
    .string()
    .datetime({ message: "Ungültiges Datumsformat (ISO 8601 erwartet)" }),
  objektId: z.string().uuid("Ungültige Objekt-ID").nullable().optional(),
  interessentId: z
    .string()
    .uuid("Ungültige Interessent-ID")
    .nullable()
    .optional(),
  notizen: z
    .string()
    .max(5000, "Notizen dürfen maximal 5000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  status: terminStatusEnum.default("geplant"),
});

export type TerminCreateInput = z.infer<typeof terminCreateSchema>;

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export const terminUpdateSchema = z.object({
  terminDatum: z
    .string()
    .datetime({ message: "Ungültiges Datumsformat (ISO 8601 erwartet)" })
    .optional(),
  objektId: z.string().uuid("Ungültige Objekt-ID").nullable().optional(),
  interessentId: z
    .string()
    .uuid("Ungültige Interessent-ID")
    .nullable()
    .optional(),
  notizen: z
    .string()
    .max(5000, "Notizen dürfen maximal 5000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  status: terminStatusEnum.optional(),
});

export type TerminUpdateInput = z.infer<typeof terminUpdateSchema>;
