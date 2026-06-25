import { neon } from "@neondatabase/serverless";
import type { Presupuesto, PresupuestoInput } from "./types";

function getDb() {
  return neon(process.env.DATABASE_URL!);
}

async function ensureSchema() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS presupuestos (
      id             SERIAL PRIMARY KEY,
      numero         TEXT    NOT NULL DEFAULT '',
      cliente        TEXT    NOT NULL DEFAULT '',
      fecha          TEXT    NOT NULL DEFAULT '',
      items          TEXT    NOT NULL DEFAULT '[]',
      notas_html     TEXT    NOT NULL DEFAULT '',
      pdf_config     TEXT    NOT NULL DEFAULT '{}',
      font_config    TEXT    NOT NULL DEFAULT '{}',
      show_cantidad  INTEGER NOT NULL DEFAULT 1,
      show_subtotal  INTEGER NOT NULL DEFAULT 1,
      show_iva       INTEGER NOT NULL DEFAULT 1,
      show_sumatoria INTEGER NOT NULL DEFAULT 1,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

let schemaInitialized = false;
async function init() {
  if (!schemaInitialized) {
    await ensureSchema();
    schemaInitialized = true;
  }
}

export async function getAllPresupuestos(): Promise<Presupuesto[]> {
  await init();
  const sql = getDb();
  const rows = await sql`
    SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
           show_iva, show_sumatoria, created_at, updated_at
    FROM presupuestos ORDER BY id DESC
  `;
  return rows as unknown as Presupuesto[];
}

export async function getPresupuestosPage(
  page: number,
  limit: number
): Promise<{ rows: Presupuesto[]; total: number }> {
  await init();
  const sql = getDb();
  const offset = (page - 1) * limit;
  const [rows, countRows] = await Promise.all([
    sql`
      SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
             show_iva, show_sumatoria, created_at, updated_at
      FROM presupuestos ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`SELECT COUNT(*)::int AS total FROM presupuestos`,
  ]);
  return {
    rows: rows as unknown as Presupuesto[],
    total: (countRows[0] as { total: number }).total,
  };
}

export async function getPresupuestoById(
  id: number
): Promise<Presupuesto | undefined> {
  await init();
  const sql = getDb();
  const rows = await sql`SELECT * FROM presupuestos WHERE id = ${id}`;
  return rows[0] as unknown as Presupuesto | undefined;
}

export async function createPresupuesto(
  data: PresupuestoInput
): Promise<number> {
  await init();
  const sql = getDb();
  const rows = await sql`
    INSERT INTO presupuestos
      (numero, cliente, fecha, items, notas_html, pdf_config, font_config,
       show_cantidad, show_subtotal, show_iva, show_sumatoria)
    VALUES
      (${data.numero}, ${data.cliente}, ${data.fecha}, ${data.items},
       ${data.notas_html}, ${data.pdf_config}, ${data.font_config},
       ${data.show_cantidad}, ${data.show_subtotal}, ${data.show_iva}, ${data.show_sumatoria})
    RETURNING id
  `;
  return (rows[0] as { id: number }).id;
}

export async function updatePresupuesto(
  id: number,
  data: PresupuestoInput
): Promise<void> {
  await init();
  const sql = getDb();
  await sql`
    UPDATE presupuestos SET
      numero         = ${data.numero},
      cliente        = ${data.cliente},
      fecha          = ${data.fecha},
      items          = ${data.items},
      notas_html     = ${data.notas_html},
      pdf_config     = ${data.pdf_config},
      font_config    = ${data.font_config},
      show_cantidad  = ${data.show_cantidad},
      show_subtotal  = ${data.show_subtotal},
      show_iva       = ${data.show_iva},
      show_sumatoria = ${data.show_sumatoria},
      updated_at     = NOW()
    WHERE id = ${id}
  `;
}

export async function deletePresupuesto(id: number): Promise<void> {
  await init();
  const sql = getDb();
  await sql`DELETE FROM presupuestos WHERE id = ${id}`;
}
