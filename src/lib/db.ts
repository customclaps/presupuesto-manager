import { createClient } from "@libsql/client";
import type { Presupuesto, PresupuestoInput } from "./types";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function initSchema() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS presupuestos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      numero       TEXT    NOT NULL DEFAULT '',
      cliente      TEXT    NOT NULL DEFAULT '',
      fecha        TEXT    NOT NULL DEFAULT '',
      items        TEXT    NOT NULL DEFAULT '[]',
      notas_html   TEXT    NOT NULL DEFAULT '',
      pdf_config   TEXT    NOT NULL DEFAULT '{}',
      font_config  TEXT    NOT NULL DEFAULT '{}',
      show_cantidad  INTEGER NOT NULL DEFAULT 1,
      show_subtotal  INTEGER NOT NULL DEFAULT 1,
      show_iva       INTEGER NOT NULL DEFAULT 1,
      show_sumatoria INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

let schemaInitialized = false;
async function ensureSchema() {
  if (!schemaInitialized) {
    await initSchema();
    schemaInitialized = true;
  }
}

export async function getAllPresupuestos(): Promise<Presupuesto[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    `SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
            show_iva, show_sumatoria, created_at, updated_at
     FROM presupuestos ORDER BY id DESC`
  );
  return result.rows.map((row) => ({ ...row }) as unknown as Presupuesto);
}

export async function getPresupuestosPage(
  page: number,
  limit: number
): Promise<{ rows: Presupuesto[]; total: number }> {
  await ensureSchema();
  const db = getDb();
  const offset = (page - 1) * limit;
  const [rowsResult, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
                   show_iva, show_sumatoria, created_at, updated_at
            FROM presupuestos ORDER BY id DESC LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
    db.execute(`SELECT COUNT(*) as total FROM presupuestos`),
  ]);
  return {
    rows: rowsResult.rows.map((row) => ({ ...row }) as unknown as Presupuesto),
    total: Number(countResult.rows[0].total),
  };
}

export async function getPresupuestoById(
  id: number
): Promise<Presupuesto | undefined> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM presupuestos WHERE id = ?`,
    args: [id],
  });
  if (!result.rows[0]) return undefined;
  return { ...(result.rows[0] as unknown as Presupuesto) };
}

export async function createPresupuesto(
  data: PresupuestoInput
): Promise<number> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: `INSERT INTO presupuestos
            (numero, cliente, fecha, items, notas_html, pdf_config, font_config,
             show_cantidad, show_subtotal, show_iva, show_sumatoria)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.numero,
      data.cliente,
      data.fecha,
      data.items,
      data.notas_html,
      data.pdf_config,
      data.font_config,
      data.show_cantidad,
      data.show_subtotal,
      data.show_iva,
      data.show_sumatoria,
    ],
  });
  return Number(result.lastInsertRowid);
}

export async function updatePresupuesto(
  id: number,
  data: PresupuestoInput
): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `UPDATE presupuestos SET
            numero         = ?,
            cliente        = ?,
            fecha          = ?,
            items          = ?,
            notas_html     = ?,
            pdf_config     = ?,
            font_config    = ?,
            show_cantidad  = ?,
            show_subtotal  = ?,
            show_iva       = ?,
            show_sumatoria = ?,
            updated_at     = datetime('now')
          WHERE id = ?`,
    args: [
      data.numero,
      data.cliente,
      data.fecha,
      data.items,
      data.notas_html,
      data.pdf_config,
      data.font_config,
      data.show_cantidad,
      data.show_subtotal,
      data.show_iva,
      data.show_sumatoria,
      id,
    ],
  });
}

export async function deletePresupuesto(id: number): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: `DELETE FROM presupuestos WHERE id = ?`, args: [id] });
}
