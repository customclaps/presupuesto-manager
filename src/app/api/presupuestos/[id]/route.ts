import { NextResponse } from "next/server";
import { getPresupuestoById, updatePresupuesto, deletePresupuesto } from "@/lib/db";
import type { PresupuestoInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const presupuesto = await getPresupuestoById(Number(id));
    if (!presupuesto) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(presupuesto);
  } catch (err) {
    console.error("[GET /api/presupuestos/[id]]", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PresupuestoInput;
    await updatePresupuesto(Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/presupuestos/[id]]", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deletePresupuesto(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/presupuestos/[id]]", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}
