import path from "path";
import type { Presupuesto, PresupuestoInput } from "./types";

const DB_PATH = path.resolve(process.cwd(), "..", "presupuestos.db");

interface StatementSync {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(...params: any[]): { lastInsertRowid: number; changes: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all(...params: any[]): any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(...params: any[]): any;
}
interface DbInstance {
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
  close(): void;
}

declare global {
  // eslint-disable-next-line no-var
  var __presupuestosDb: DbInstance | undefined;
}

function getDb(): DbInstance {
  if (!global.__presupuestosDb) {
    // require dentro de getDb para evitar evaluación en tiempo de bundle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require("node:sqlite") as {
      DatabaseSync: new (path: string) => DbInstance;
    };
    global.__presupuestosDb = new DatabaseSync(DB_PATH);
    global.__presupuestosDb.exec("PRAGMA journal_mode = WAL");
    initSchema(global.__presupuestosDb);
  }
  return global.__presupuestosDb;
}

function initSchema(db: DbInstance) {
  db.exec(`
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

export function getAllPresupuestos(): Presupuesto[] {
  const rows = getDb()
    .prepare(
      `SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
              show_iva, show_sumatoria, created_at, updated_at
       FROM presupuestos ORDER BY id DESC`
    )
    .all();
  return rows.map((row) => ({ ...row }) as Presupuesto);
}

export function getPresupuestosPage(
  page: number,
  limit: number
): { rows: Presupuesto[]; total: number } {
  const offset = (page - 1) * limit;
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
              show_iva, show_sumatoria, created_at, updated_at
       FROM presupuestos ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM presupuestos`)
    .get() as { total: number };
  return {
    rows: rows.map((row) => ({ ...row }) as Presupuesto),
    total: Number(countRow.total),
  };
}

export function getPresupuestoById(id: number): Presupuesto | undefined {
  const row = getDb()
    .prepare(`SELECT * FROM presupuestos WHERE id = ?`)
    .get(id);
  if (!row) return undefined;
  return { ...(row as Presupuesto) };
}

export function createPresupuesto(data: PresupuestoInput): number {
  const result = getDb()
    .prepare(
      `INSERT INTO presupuestos
        (numero, cliente, fecha, items, notas_html, pdf_config, font_config,
         show_cantidad, show_subtotal, show_iva, show_sumatoria)
       VALUES
        (@numero, @cliente, @fecha, @items, @notas_html, @pdf_config, @font_config,
         @show_cantidad, @show_subtotal, @show_iva, @show_sumatoria)`
    )
    .run(data);
  return Number(result.lastInsertRowid);
}

export function updatePresupuesto(id: number, data: PresupuestoInput): void {
  getDb()
    .prepare(
      `UPDATE presupuestos SET
        numero         = @numero,
        cliente        = @cliente,
        fecha          = @fecha,
        items          = @items,
        notas_html     = @notas_html,
        pdf_config     = @pdf_config,
        font_config    = @font_config,
        show_cantidad  = @show_cantidad,
        show_subtotal  = @show_subtotal,
        show_iva       = @show_iva,
        show_sumatoria = @show_sumatoria,
        updated_at     = datetime('now')
       WHERE id = @id`
    )
    .run({ ...data, id });
}

export function deletePresupuesto(id: number): void {
  getDb().prepare(`DELETE FROM presupuestos WHERE id = ?`).run(id);
}
