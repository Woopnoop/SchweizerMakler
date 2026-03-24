import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  berechneKaufnebenkosten,
  type KaufnebenkostenInput,
} from "@/lib/rechner/kaufnebenkosten";

const kaufnebenkostenSchema = z.object({
  kaufpreis: z.number().positive("Kaufpreis muss positiv sein"),
  eigenkapital: z.number().min(0, "Eigenkapital darf nicht negativ sein"),
  maklerprovision: z.number().min(0).max(100, "Maklerprovision in Prozent (0-100)"),
  zinssatz: z.number().min(0).max(100, "Zinssatz in Prozent (0-100)"),
  tilgung: z.number().min(0).max(100, "Tilgung in Prozent (0-100)"),
  zinsbindung: z.number().int().min(1).max(40, "Zinsbindung: 1-40 Jahre"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = kaufnebenkostenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input: KaufnebenkostenInput = parsed.data;
    const result = berechneKaufnebenkosten(input);

    return NextResponse.json({ input, result });
  } catch (error) {
    console.error("Kaufnebenkosten error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
