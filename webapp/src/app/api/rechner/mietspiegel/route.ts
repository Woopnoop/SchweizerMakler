import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { berechneMietspiegel } from "@/lib/rechner/mietspiegel";

const mietspiegelSchema = z.object({
  stadt: z.enum(["nuernberg", "erlangen", "fuerth"], {
    errorMap: () => ({ message: "Stadt muss 'nuernberg', 'erlangen' oder 'fuerth' sein" }),
  }),
  baujahr: z.union([
    z.number().int().min(1800).max(2030),
    z.enum([
      "vor 1918",
      "1919-1948",
      "1949-1968",
      "1969-1990",
      "1991-2000",
      "2001-2010",
      "nach 2010",
    ]),
  ]),
  lage: z.enum(["einfach", "mittel", "gut"], {
    errorMap: () => ({ message: "Lage muss 'einfach', 'mittel' oder 'gut' sein" }),
  }),
  ausstattung: z.enum(["einfach", "mittel", "gut", "gehoben"], {
    errorMap: () => ({ message: "Ausstattung muss 'einfach', 'mittel', 'gut' oder 'gehoben' sein" }),
  }),
  wohnflaeche: z
    .number()
    .positive("Wohnfläche muss positiv sein")
    .max(500, "Wohnfläche maximal 500 m²"),
  aktuelleMiete: z
    .number()
    .positive("Aktuelle Miete muss positiv sein")
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = mietspiegelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validierungsfehler",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = berechneMietspiegel(parsed.data);

    return NextResponse.json({
      input: parsed.data,
      result,
    });
  } catch (error) {
    console.error("Mietspiegel error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
