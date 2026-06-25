import { NextResponse } from "next/server";
import { getAllPresupuestos, createPresupuesto } from "@/lib/db";
import type { PresupuestoInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const presupuestos = getAllPresupuestos();
    return NextResponse.json(presupuestos);
  } catch (err) {
    console.error("[GET /api/presupuestos]", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PresupuestoInput;
    const id = createPresupuesto(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/presupuestos]", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}
