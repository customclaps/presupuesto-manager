import { NextResponse } from "next/server";
import { getNextNumero } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const numero = await getNextNumero();
    return NextResponse.json({ numero });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}
