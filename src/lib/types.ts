export interface Item {
  id: string;
  caracteristica: string;
  largo?: string;
  diametro?: string;
  precioUnitario: number;
  cantidad: number;
}

export interface Presupuesto {
  id: number;
  numero: string;
  cliente: string;
  fecha: string;
  items: string;
  notas_html: string;
  pdf_config: string;
  font_config: string;
  show_cantidad: number;
  show_subtotal: number;
  show_iva: number;
  show_sumatoria: number;
  created_at: string;
  updated_at: string;
}

export interface PresupuestoInput {
  numero: string;
  cliente: string;
  fecha: string;
  items: string;
  notas_html: string;
  pdf_config: string;
  font_config: string;
  show_cantidad: number;
  show_subtotal: number;
  show_iva: number;
  show_sumatoria: number;
}
