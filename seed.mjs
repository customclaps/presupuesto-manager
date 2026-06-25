import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "..", "presupuestos.db");

const db = new DatabaseSync(DB_PATH);

const clientes = [
  "Constructora del Norte SRL",
  "Fernández y Asociados",
  "Obra Belgrano",
  "Municipalidad de San Pedro",
  "Cerámica La Pampa",
  "Hipólito Yrigoyen e Hijos",
  "Estudio Vázquez Arquitectura",
  "Parque Industrial Sur",
  "Cooperativa Agrícola Pampeana",
  "Hotel Las Leñas",
  "Frigorífico Patagónico",
  "Club Atlético Tigre",
  "Universidad Tecnológica Nacional",
  "Banco Nación Suc. Mendoza",
  "Astilleros del Plata SA",
  "Agroindustrias Córdoba",
  "Molinos Río de la Plata",
  "Supermercados El Coto",
  "Terminal Puerto Nuevomar",
  "Colegio San Ignacio",
  "Emprendimientos Rosario SA",
  "Arquitectura & Diseño Bariloche",
  "Municipio de Quilmes",
  "Industrias Metalúrgicas del Sur",
  "Pesquera Atlántica SRL",
];

const caracteristicas = [
  "Tablón pino 1\" x 6\" x 3m",
  "Viga eucaliptus 4x6 x 4m",
  "Machimbre cedro 5/4 x 6\"",
  "Tirante pino 2x4 x 3m",
  "Plywood fenólico 18mm 1.22x2.44",
  "Deck garapa 1\" x 4\" x 3m",
  "Parquet roble europeo 22mm",
  "Listón quebracho 4x4 x 2m",
  "OSB 15mm 1.22x2.44",
  "MDF crudo 15mm",
  "Terciado pino marino 12mm",
  "Guía aluminio 40x20 x 3m",
  "Clavos galvanizados 2.5\"",
  "Tornillos autoperforantes 1\"",
  "Sellador acrílico x 1L",
];

const notas = [
  "<p>Oferta válida por 10 días hábiles. Precios en ARS + IVA.</p>",
  "<p>Entrega en obra acordada. No incluye transporte.</p>",
  "<p>Descuento por volumen aplicado. Consultar disponibilidad.</p>",
  "<p>Precios sujetos a variación. Seña del 30% para confirmar.</p>",
  "",
];

const insert = db.prepare(`
  INSERT INTO presupuestos
    (numero, cliente, fecha, items, notas_html, pdf_config, font_config,
     show_cantidad, show_subtotal, show_iva, show_sumatoria)
  VALUES
    (@numero, @cliente, @fecha, @items, @notas_html, @pdf_config, @font_config,
     1, 1, 1, 1)
`);

// Obtener el máximo número existente para continuar la numeración
const maxRow = db.prepare("SELECT MAX(CAST(numero AS INTEGER)) as max FROM presupuestos").get();
const startNum = (maxRow?.max ?? 0) + 1;

for (let i = 0; i < 50; i++) {
  const cliente = clientes[Math.floor(Math.random() * clientes.length)];
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const year = 2025 + Math.floor(Math.random() * 2);
  const fecha = `${day}/${month}/${year}`;
  const numero = String(startNum + i);

  const itemCount = Math.floor(Math.random() * 5) + 1;
  const items = Array.from({ length: itemCount }, (_, j) => ({
    id: `item-${Date.now()}-${j}`,
    caracteristica: caracteristicas[Math.floor(Math.random() * caracteristicas.length)],
    precioUnitario: Math.floor(Math.random() * 80000) + 2000,
    cantidad: Math.floor(Math.random() * 30) + 1,
  }));

  insert.run({
    numero,
    cliente,
    fecha,
    items: JSON.stringify(items),
    notas_html: notas[Math.floor(Math.random() * notas.length)],
    pdf_config: "{}",
    font_config: "{}",
  });
}

console.log(`✓ 50 presupuestos insertados (nros. ${startNum}–${startNum + 49})`);
db.close();
