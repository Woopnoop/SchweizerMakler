import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAll, addLead, removeLead } from "@/lib/leads-store";

const leadSchema = z.object({
  id: z.string().min(1),
  portal: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  location: z.string().default(""),
  currentPrice: z.number().positive(),
  listingType: z.enum(["miete", "kauf"]).default("kauf"),
  areaSqm: z.number().positive().optional(),
  rooms: z.number().positive().optional(),
  standortScore: z.number().min(0).max(100).optional(),
  priceHistory: z
    .array(z.object({ timestamp: z.number(), price: z.number() }))
    .default([]),
});

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.toLowerCase();
  let leads = getAll().sort((a, b) => b.receivedAt - a.receivedAt);

  if (search) {
    leads = leads.filter(
      (l) =>
        l.title.toLowerCase().includes(search) ||
        l.location.toLowerCase().includes(search) ||
        l.portal.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = leadSchema.parse(body);
    const lead = addLead(parsed);
    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required query parameter: id" },
      { status: 400 }
    );
  }

  const removed = removeLead(id);

  if (!removed) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
