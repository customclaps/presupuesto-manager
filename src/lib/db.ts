import { Pool } from "pg";
import type { Presupuesto, PresupuestoInput } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global.__pgPool;
}

let schemaInitialized = false;
async function init() {
  if (schemaInitialized) return;
  await getPool().query(`
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
  `);
  schemaInitialized = true;
}

export async function getAllPresupuestos(): Promise<Presupuesto[]> {
  await init();
  const { rows } = await getPool().query(
    `SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
            show_iva, show_sumatoria,
            created_at::text AS created_at, updated_at::text AS updated_at
     FROM presupuestos ORDER BY id DESC`
  );
  return rows as Presupuesto[];
}

export async function getPresupuestosPage(
  page: number,
  limit: number
): Promise<{ rows: Presupuesto[]; total: number }> {
  await init();
  const offset = (page - 1) * limit;
  const [result, countResult] = await Promise.all([
    getPool().query(
      `SELECT id, numero, cliente, fecha, items, show_cantidad, show_subtotal,
              show_iva, show_sumatoria,
              created_at::text AS created_at, updated_at::text AS updated_at
       FROM presupuestos ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    getPool().query(`SELECT COUNT(*)::int AS total FROM presupuestos`),
  ]);
  return {
    rows: result.rows as Presupuesto[],
    total: countResult.rows[0].total as number,
  };
}

export async function getPresupuestoById(
  id: number
): Promise<Presupuesto | undefined> {
  await init();
  const { rows } = await getPool().query(
    `SELECT id, numero, cliente, fecha, items, notas_html, pdf_config, font_config,
            show_cantidad, show_subtotal, show_iva, show_sumatoria,
            created_at::text AS created_at, updated_at::text AS updated_at
     FROM presupuestos WHERE id = $1`,
    [id]
  );
  return rows[0] as Presupuesto | undefined;
}

export async function createPresupuesto(
  data: PresupuestoInput
): Promise<number> {
  await init();
  const { rows } = await getPool().query(
    `INSERT INTO presupuestos
       (numero, cliente, fecha, items, notas_html, pdf_config, font_config,
        show_cantidad, show_subtotal, show_iva, show_sumatoria)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      data.numero, data.cliente, data.fecha, data.items,
      data.notas_html, data.pdf_config, data.font_config,
      data.show_cantidad, data.show_subtotal, data.show_iva, data.show_sumatoria,
    ]
  );
  return rows[0].id as number;
}

export async function updatePresupuesto(
  id: number,
  data: PresupuestoInput
): Promise<void> {
  await init();
  await getPool().query(
    `UPDATE presupuestos SET
       numero=$1, cliente=$2, fecha=$3, items=$4, notas_html=$5,
       pdf_config=$6, font_config=$7, show_cantidad=$8, show_subtotal=$9,
       show_iva=$10, show_sumatoria=$11, updated_at=NOW()
     WHERE id=$12`,
    [
      data.numero, data.cliente, data.fecha, data.items,
      data.notas_html, data.pdf_config, data.font_config,
      data.show_cantidad, data.show_subtotal, data.show_iva, data.show_sumatoria,
      id,
    ]
  );
}

export async function deletePresupuesto(id: number): Promise<void> {
  await init();
  await getPool().query(`DELETE FROM presupuestos WHERE id = $1`, [id]);
}
