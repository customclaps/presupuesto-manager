"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Trash2, FileDown, Settings, Save, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RichTextEditor } from "@/components/RichTextEditor";

type Item = {
  id: string;
  caracteristica: string;
  largo?: string;
  diametro?: string;
  precioUnitario: number;
  cantidad: number;
};

const IVA = 0.21;

const DEFAULT_NOTES_HTML = `<div>*Oferta válida 5 días.</div><div>*Forma de pago: 0.30.60.90 días.</div><div>*Plazo entrega Inmediata.</div><div>*Precio madera puesta en Rio Negro.</div><div><br></div><div>Quedo a su disposición extendiendo un cordial saludo.</div><div><br></div><div style="text-align:right">Fabian Ayrala</div>`;

function moneyARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function toNumber(s: string) {
  const clean = s.replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
}

function todayAR() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function todayLong() {
  const d = new Date();
  return `Federación, ${d.getDate()} de ${MESES[d.getMonth()]} del ${d.getFullYear()}`;
}

// ─── HTML → jsPDF renderer ───────────────────────────────────────────────

type Align = "left" | "center" | "right";
interface TextRun { text: string; bold: boolean; italic: boolean; underline: boolean; fontSize: number | null; }
interface Para { runs: TextRun[]; align: Align; }

const FONT_MAP: Record<string, { css: string; label: string }> = {
  helvetica: { css: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  times:     { css: "Times New Roman, serif",       label: "Times New Roman" },
  courier:   { css: "Courier New, monospace",        label: "Courier New" },
};

function parseEditorHTML(html: string): Para[] {
  const dom = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const body = dom.body;
  const paras: Para[] = [];

  function alignOf(el: Element): Align {
    const s = (el.getAttribute("style") ?? "").toLowerCase().replace(/\s/g, "");
    if (s.includes("text-align:right")) return "right";
    if (s.includes("text-align:center")) return "center";
    return "left";
  }

  function collectRuns(
    node: Node,
    st: { bold: boolean; italic: boolean; underline: boolean; fontSize: number | null },
    out: TextRun[]
  ) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      if (t) out.push({ ...st, text: t });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const next = { ...st };
    if (tag === "b" || tag === "strong") next.bold = true;
    if (tag === "i" || tag === "em") next.italic = true;
    if (tag === "u") next.underline = true;
    if (tag === "span") {
      const style = el.getAttribute("style") ?? "";
      const m = style.match(/font-size:\s*([\d.]+)pt/i);
      if (m) next.fontSize = parseFloat(m[1]);
      if (/font-weight\s*:\s*bold/i.test(style)) next.bold = true;
      if (/font-style\s*:\s*italic/i.test(style)) next.italic = true;
    }
    for (const child of Array.from(el.childNodes)) collectRuns(child, next, out);
  }

  function processBlock(el: Element) {
    const align = alignOf(el);
    const runs: TextRun[] = [];
    const base = { bold: false, italic: false, underline: false, fontSize: null as number | null };
    for (const child of Array.from(el.childNodes)) {
      if ((child as Element).tagName?.toLowerCase() === "br") {
        paras.push({ runs: runs.length ? [...runs] : [], align });
        runs.length = 0;
      } else {
        collectRuns(child, base, runs);
      }
    }
    paras.push({ runs, align });
  }

  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent?.trim();
      if (t) paras.push({ runs: [{ text: t, bold: false, italic: false, underline: false, fontSize: 9 }], align: "left" });
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      if (el.tagName.toLowerCase() === "br") paras.push({ runs: [], align: "left" });
      else processBlock(el);
    }
  }
  return paras;
}

function renderEditorToPDF(
  pdfdoc: jsPDF,
  paras: Para[],
  x: number,
  startY: number,
  maxW: number,
  baseFontSize = 9,
  baseFont = "helvetica"
): number {
  let y = startY;
  for (const para of paras) {
    const hasText = para.runs.some(r => r.text.trim());
    if (!hasText) { y += 6; continue; }

    const maxFs = Math.max(...para.runs.map(r => r.fontSize ?? baseFontSize), baseFontSize);
    const lineH = maxFs * 1.45;

    let totalW = 0;
    for (const run of para.runs) {
      pdfdoc.setFontSize(run.fontSize ?? baseFontSize);
      pdfdoc.setFont(baseFont, run.bold && run.italic ? "bolditalic" : run.bold ? "bold" : run.italic ? "italic" : "normal");
      totalW += pdfdoc.getTextWidth(run.text);
    }

    let cx = x;
    if (para.align === "right") cx = x + maxW - totalW;
    else if (para.align === "center") cx = x + (maxW - totalW) / 2;

    for (const run of para.runs) {
      const fs = run.fontSize ?? baseFontSize;
      pdfdoc.setFontSize(fs);
      const style = run.bold && run.italic ? "bolditalic" : run.bold ? "bold" : run.italic ? "italic" : "normal";
      pdfdoc.setFont(baseFont, style);

      if (pdfdoc.getTextWidth(run.text) > maxW) {
        const words = pdfdoc.splitTextToSize(run.text, maxW);
        for (const w of words as string[]) {
          pdfdoc.text(w, cx, y);
          y += lineH;
        }
        cx = x;
        continue;
      }

      pdfdoc.text(run.text, cx, y);
      if (run.underline) {
        const tw = pdfdoc.getTextWidth(run.text);
        pdfdoc.setDrawColor(0, 0, 0);
        pdfdoc.setLineWidth(0.3);
        pdfdoc.line(cx, y + 1.5, cx + tw, y + 1.5);
      }
      cx += pdfdoc.getTextWidth(run.text);
    }
    y += lineH;
  }
  return y;
}

// ─────────────────────────────────────────────────────────────────────────

async function loadImgAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    img.src = src;
  });
}

function CfgField({
  label, value, onChange, min, max,
}: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min} max={max} step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 accent-[#3b879c]"
        />
        <span className="text-sm font-mono w-8 text-right">{value}</span>
      </div>
    </div>
  );
}

export default function BudgetTable() {
  const [items, setItems] = React.useState<Item[]>([]);
  const editorRef = React.useRef<HTMLDivElement>(null);

  const [destinatario, setDestinatario] = React.useState("");
  const [nroPresupuesto, setNroPresupuesto] = React.useState("0001");

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<"diseno" | "fuente">("diseno");

  type FontCfg = { familia: string; tamano: number };
  type PdfCfg = { margenSuperior: number; margenIzquierdo: number; margenDerecho: number; gapEncabezadoTabla: number; gapTablaNotas: number; paddingTabla: number };

  const DEFAULT_FONT_CFG: FontCfg = { familia: "helvetica", tamano: 9 };
  const DEFAULT_PDF_CFG: PdfCfg  = { margenSuperior: 35, margenIzquierdo: 40, margenDerecho: 40, gapEncabezadoTabla: 30, gapTablaNotas: 70, paddingTabla: 6 };

  const [fontCfg, setFontCfg] = React.useState<FontCfg>(() => {
    try { const s = localStorage.getItem("budget_fontCfg"); return s ? JSON.parse(s) : DEFAULT_FONT_CFG; } catch { return DEFAULT_FONT_CFG; }
  });
  const [pdfCfg, setPdfCfg] = React.useState<PdfCfg>(() => {
    try { const s = localStorage.getItem("budget_pdfCfg"); return s ? { ...DEFAULT_PDF_CFG, ...JSON.parse(s) } : DEFAULT_PDF_CFG; } catch { return DEFAULT_PDF_CFG; }
  });

  React.useEffect(() => { try { localStorage.setItem("budget_fontCfg", JSON.stringify(fontCfg)); } catch {} }, [fontCfg]);
  React.useEffect(() => { try { localStorage.setItem("budget_pdfCfg",  JSON.stringify(pdfCfg));  } catch {} }, [pdfCfg]);

  // ── Carga desde DB si viene ?id= en la URL ──
  const searchParams = useSearchParams();
  const [presupuestoId, setPresupuestoId] = React.useState<number | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [savedOk, setSavedOk] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [destinatarioError, setDestinatarioError] = React.useState(false);

  React.useEffect(() => {
    const rawId = searchParams.get("id");
    if (!rawId) {
      // Nuevo presupuesto: obtener el próximo número disponible
      fetch("/api/presupuestos/next-numero")
        .then((r) => r.json())
        .then((data) => { if (data.numero) setNroPresupuesto(data.numero); })
        .catch(() => {});
      return;
    }
    const numId = parseInt(rawId, 10);
    if (isNaN(numId)) return;
    setPresupuestoId(numId);
    fetch(`/api/presupuestos/${numId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        if (data.items) setItems(JSON.parse(data.items));
        if (data.numero) setNroPresupuesto(data.numero);
        if (data.cliente) setDestinatario(data.cliente);
        if (data.show_cantidad != null) setShowCantidad(Boolean(data.show_cantidad));
        if (data.show_subtotal != null) setShowSubtotal(Boolean(data.show_subtotal));
        if (data.show_iva != null) setShowIva(Boolean(data.show_iva));
        if (data.show_sumatoria != null) setShowSumatoriaFinal(Boolean(data.show_sumatoria));
        if (data.pdf_config) {
          try { setPdfCfg((p) => ({ ...p, ...JSON.parse(data.pdf_config) })); } catch {}
        }
        if (data.font_config) {
          try { setFontCfg((p) => ({ ...p, ...JSON.parse(data.font_config) })); } catch {}
        }
        if (data.notas_html && editorRef.current) {
          editorRef.current.innerHTML = data.notas_html;
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function guardarPresupuesto() {
    setGuardando(true);
    setSavedOk(false);
    setSaveError(null);
    const notasHtml = editorRef.current?.innerHTML ?? "";
    const payload = {
      numero: nroPresupuesto,
      cliente: destinatario,
      fecha: todayAR(),
      items: JSON.stringify(items),
      notas_html: notasHtml,
      pdf_config: JSON.stringify(pdfCfg),
      font_config: JSON.stringify(fontCfg),
      show_cantidad: showCantidad ? 1 : 0,
      show_subtotal: showSubtotal ? 1 : 0,
      show_iva: showIva ? 1 : 0,
      show_sumatoria: showSumatoriaFinal ? 1 : 0,
    };
    try {
      if (presupuestoId) {
        const res = await fetch(`/api/presupuestos/${presupuestoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `Error ${res.status}`);
        }
      } else {
        const res = await fetch("/api/presupuestos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `Error ${res.status}`);
        }
        const data = await res.json();
        if (data.id) {
          setPresupuestoId(data.id);
          window.history.replaceState(null, "", `?id=${data.id}`);
        }
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 6000);
    } finally {
      setGuardando(false);
    }
  }

  function setCfg(key: keyof typeof pdfCfg, val: number) {
    setPdfCfg(prev => ({ ...prev, [key]: val }));
  }

  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [showCantidad, setShowCantidad] = React.useState(true);
  const [showSubtotal, setShowSubtotal] = React.useState(true);
  const [showIva, setShowIva] = React.useState(true);
  const [showSumatoriaFinal, setShowSumatoriaFinal] = React.useState(true);

  const [caracteristica, setCaracteristica] = React.useState("");
  const [precioUnitario, setPrecioUnitario] = React.useState("");
  const [cantidad, setCantidad] = React.useState("");
  const [useLargo, setUseLargo] = React.useState(false);
  const [largo, setLargo] = React.useState("");
  const [useDiametro, setUseDiametro] = React.useState(false);
  const [diametro, setDiametro] = React.useState("");

  function resetForm() {
    setCaracteristica("");
    setPrecioUnitario("");
    setCantidad("");
    setUseLargo(false);
    setLargo("");
    setUseDiametro(false);
    setDiametro("");
    setEditingId(null);
  }

  function openAdd() { resetForm(); setOpen(true); }

  function openEdit(it: Item) {
    setEditingId(it.id);
    setCaracteristica(it.caracteristica);
    setPrecioUnitario(String(it.precioUnitario));
    setCantidad(String(it.cantidad));
    setUseLargo(Boolean(it.largo));
    setLargo(it.largo ?? "");
    setUseDiametro(Boolean(it.diametro));
    setDiametro(it.diametro ?? "");
    setOpen(true);
  }

  function saveItem() {
    const pu = toNumber(precioUnitario);
    const qty = Math.trunc(toNumber(cantidad));
    if (!caracteristica.trim()) return;
    if (!Number.isFinite(pu) || pu <= 0) return;
    if (!Number.isFinite(qty) || qty <= 0) return;

    const patch: Partial<Item> = {
      caracteristica: caracteristica.trim(),
      precioUnitario: pu,
      cantidad: qty,
      largo: useLargo && largo.trim() ? largo.trim() : undefined,
      diametro: useDiametro && diametro.trim() ? diametro.trim() : undefined,
    };

    if (editingId) {
      setItems((prev) =>
        prev.map((x) => (x.id === editingId ? ({ ...x, ...patch } as Item) : x))
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          caracteristica: patch.caracteristica!,
          precioUnitario: patch.precioUnitario!,
          cantidad: patch.cantidad!,
          ...(patch.largo ? { largo: patch.largo } : {}),
          ...(patch.diametro ? { diametro: patch.diametro } : {}),
        },
      ]);
    }
    setOpen(false);
    resetForm();
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  const totalSubtotal = items.reduce(
    (acc, it) => acc + it.precioUnitario * it.cantidad,
    0
  );
  const totalConIva = totalSubtotal * (1 + IVA);

  const fixedCols = 4;
  const optionalCols =
    (showCantidad ? 1 : 0) + (showSubtotal ? 1 : 0) + (showIva ? 1 : 0);

  function RowActions({ it }: { it: Item }) {
    return (
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
        <Button size="icon" variant="outline" title="Editar" onClick={() => openEdit(it)}>
          <Pencil size={16} />
        </Button>
        <Button size="icon" variant="outline" title="Eliminar" onClick={() => removeItem(it.id)}>
          <Trash2 size={16} />
        </Button>
      </div>
    );
  }

  async function exportPDF() {
    if (!destinatario.trim()) {
      setDestinatarioError(true);
      return;
    }
    setDestinatarioError(false);

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginL = pdfCfg.margenIzquierdo;
    const marginR = pdfCfg.margenDerecho;
    const availW = pageW - marginL - marginR;

    const LOGO_W = 180;
    const LOGO_H = Math.round(LOGO_W * (406 / 946));
    const HEADER_TOP = pdfCfg.margenSuperior;

    try {
      const logoData = await loadImgAsBase64("/logo.png");
      doc.addImage(logoData, "PNG", marginL, HEADER_TOP, LOGO_W, LOGO_H);
    } catch {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("MADERAS CAMBIRECA", marginL, HEADER_TOP + 20);
    }

    const empresaLines = [
      `Ppto. Nro: ${nroPresupuesto.padStart(7, "0")}`,
      "Ruta Nacional 14 km 311",
      "(Colonia Alemana)-Federación -Entre Ríos",
      "cuit:20271168501",
      "Engelmann Eric",
      "Tel: 0343-154544012",
      "Fabian Ayrala",
      "Tel: 03456 15620198",
      "info@maderascambireca.com.ar",
      "www.maderascambireca.com.ar",
    ];

    const F = fontCfg.familia;
    const FS = fontCfg.tamano;

    doc.setFontSize(FS);
    doc.setFont(F, "normal");
    const lineH = FS * 1.45;
    const rightX = pageW - marginR;
    let infoY = HEADER_TOP + 4;
    for (const line of empresaLines) {
      doc.text(line, rightX - doc.getTextWidth(line), infoY);
      infoY += lineH;
    }

    const headerBottom = Math.max(HEADER_TOP + LOGO_H, infoY) + 10;
    doc.setDrawColor(59, 135, 156);
    doc.setLineWidth(0.8);
    doc.line(marginL, headerBottom, pageW - marginR, headerBottom);

    let cursorY = headerBottom + pdfCfg.gapEncabezadoTabla;

    doc.setFontSize(FS);
    doc.setFont(F, "normal");
    const fechaText = todayLong();
    doc.text(fechaText, rightX - doc.getTextWidth(fechaText), cursorY);
    cursorY += FS * 1.6;

    if (destinatario.trim()) {
      doc.setFontSize(FS);
      doc.setFont(F, "bold");
      const label = "Presupuesto dirigido a: ";
      const labelW = doc.getTextWidth(label);
      doc.text(label, marginL, cursorY);
      doc.setFont(F, "normal");
      doc.text(destinatario.trim(), marginL + labelW, cursorY);
      cursorY += FS * 1.5;
    }

    const head: string[] = ["Característica", "Largo", "Ø en cima", "Precio c/u"];
    if (showCantidad) head.push("Cantidad");
    if (showSubtotal) head.push("Subtotal");
    if (showIva) head.push("+IVA 21%");

    const body: (string | number)[][] = items.map((it) => {
      const subtotal = it.precioUnitario * it.cantidad;
      const conIva = subtotal * (1 + IVA);
      const row: (string | number)[] = [
        it.caracteristica,
        it.largo ?? "—",
        it.diametro ?? "—",
        moneyARS(it.precioUnitario),
      ];
      if (showCantidad) row.push(it.cantidad);
      if (showSubtotal) row.push(moneyARS(subtotal));
      if (showIva) row.push(moneyARS(conIva));
      return row;
    });

    if (showSumatoriaFinal && (showSubtotal || showIva)) {
      const totalRow: (string | number)[] = ["", "", "", "Total"];
      if (showCantidad) totalRow.push("");
      if (showSubtotal) totalRow.push(moneyARS(totalSubtotal));
      if (showIva) totalRow.push(moneyARS(totalConIva));
      body.push(totalRow);
    }

    autoTable(doc, {
      startY: cursorY + 8,
      head: [head],
      body,
      styles: { font: F, fontSize: FS, cellPadding: pdfCfg.paddingTabla, lineColor: [224, 224, 224], lineWidth: 0.3 },
      headStyles: { fillColor: [59, 135, 156], lineColor: [224, 224, 224], lineWidth: 0.3 },
      didParseCell: (data) => {
        if (data.section === "body") {
          data.cell.styles.fillColor =
            data.row.index % 2 === 0 ? [255, 255, 255] : [242, 242, 242];
        }
        if (
          showSumatoriaFinal &&
          (showSubtotal || showIva) &&
          data.row.index === body.length - 1
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [255, 255, 255];
        }
      },
      margin: { left: marginL, right: marginR },
    });

    const tableEndY = (doc as any).lastAutoTable?.finalY ?? cursorY + 60;

    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const paras = parseEditorHTML(html);
      const hasContent = paras.some(p => p.runs.some(r => r.text.trim()));

      if (hasContent) {
        let notesY = tableEndY + pdfCfg.gapTablaNotas;
        if (notesY > pageH - 60) { doc.addPage(); notesY = 40; }

        renderEditorToPDF(doc, paras, marginL, notesY, availW, FS, F);
      }
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const cliente = destinatario.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "") || "SIN_NOMBRE";
    const nro = nroPresupuesto.padStart(4, "0");
    doc.save(`${yy}_${mm}_${dd}_${cliente}_${nro}.pdf`);
    await guardarPresupuesto();
  }

  const showTotalRow = showSumatoriaFinal && (showSubtotal || showIva);

  return (
    <div className="mx-auto w-full max-w-screen-lg space-y-5 px-4 sm:px-6 xl:px-8">

      {/* ── Barra superior: navegación y guardar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border rounded-xl shadow-sm">
        <a
          href="/"
          className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          <span>Volver a la lista</span>
        </a>
        <div className="flex flex-wrap items-center gap-3">
          {savedOk && (
            <span className="text-base text-green-600 font-medium">
              ✓ Guardado correctamente
            </span>
          )}
          {saveError && (
            <span className="text-sm text-red-500 font-medium max-w-xs truncate" title={saveError}>
              ✗ {saveError}
            </span>
          )}
          <Button
            onClick={guardarPresupuesto}
            disabled={guardando}
            variant="outline"
            className="gap-2 h-10 px-5 text-base"
          >
            <Save size={18} />
            {guardando
              ? "Guardando..."
              : presupuestoId
              ? "Guardar cambios"
              : "Guardar presupuesto"}
          </Button>
        </div>
      </div>

      {/* ── Encabezado: logo + datos empresa ── */}
      <div className="rounded-xl border p-5 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">

          <div className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Maderas Cambireca" className="h-20 sm:h-24 w-auto object-contain" />
            <span className="text-xs text-gray-500">info@maderascambireca.com.ar</span>
            <span className="text-xs text-gray-500">www.maderascambireca.com.ar</span>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-right text-sm text-gray-600 leading-relaxed">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm whitespace-nowrap font-medium">Ppto. Nro:</Label>
              <Input
                className="w-24 h-9 text-sm text-right"
                value={nroPresupuesto}
                onChange={(e) => setNroPresupuesto(e.target.value)}
              />
            </div>
            <span>Ruta Nacional 14 km 311</span>
            <span>(Colonia Alemana)-Federación -Entre Ríos</span>
            <span>cuit: 20271168501</span>
            <span>Tel: 03456 15620198</span>
            <span> Tel: 0343-154544012</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <span className="text-base text-gray-500">Fecha: {todayAR()}</span>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Label className={`text-base whitespace-nowrap font-medium ${destinatarioError ? "text-red-500" : ""}`}>
                Presupuesto dirigido a: <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`w-full sm:w-72 h-10 text-base ${destinatarioError ? "border-red-500 focus:ring-red-400" : ""}`}
                value={destinatario}
                onChange={(e) => {
                  setDestinatario(e.target.value);
                  if (e.target.value.trim()) setDestinatarioError(false);
                }}
                placeholder="Nombre del cliente (obligatorio)"
              />
            </div>
            {destinatarioError && (
              <span className="text-sm text-red-500 font-medium">
                Este campo es obligatorio para generar el PDF
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Controles columnas + botón agregar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-5 rounded-xl border p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showCantidad} onCheckedChange={setShowCantidad} />
            <span className="text-base font-medium">cantidad</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showSubtotal} onCheckedChange={setShowSubtotal} />
            <span className="text-base font-medium">subtotal</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showIva} onCheckedChange={setShowIva} />
            <span className="text-base font-medium">+iva 21%</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showSumatoriaFinal} onCheckedChange={setShowSumatoriaFinal} />
            <span className="text-base font-medium">Sumatoria final</span>
          </label>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="icon" title="Configuración PDF" onClick={() => setSettingsOpen(true)}>
            <Settings size={18} />
          </Button>
          <Button onClick={openAdd} className="h-10 px-5 text-base">+ Agregar</Button>
        </div>
      </div>

      {/* ── Modal configuración PDF ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2"><Settings size={16} /> Configuración del PDF</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex border-b mb-4">
            {(["diseno", "fuente"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSettingsTab(tab)}
                className={`px-4 py-2 text-sm font-medium -mb-px transition-colors ${
                  settingsTab === tab
                    ? "border-b-2 border-black text-black"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {tab === "diseno" ? "Diseño PDF" : "Fuente"}
              </button>
            ))}
          </div>

          {settingsTab === "diseno" && <div className="grid grid-cols-2 gap-4">
            <CfgField label="Margen superior (pt)" value={pdfCfg.margenSuperior} onChange={v => setCfg("margenSuperior", v)} min={10} max={80} />
            <CfgField label="Gap encabezado → tabla (pt)" value={pdfCfg.gapEncabezadoTabla} onChange={v => setCfg("gapEncabezadoTabla", v)} min={0} max={80} />
            <CfgField label="Gap tabla → notas (pt)" value={pdfCfg.gapTablaNotas} onChange={v => setCfg("gapTablaNotas", v)} min={0} max={80} />
            <CfgField label="Margen izquierdo (pt)" value={pdfCfg.margenIzquierdo} onChange={v => setCfg("margenIzquierdo", v)} min={10} max={100} />
            <CfgField label="Margen derecho (pt)" value={pdfCfg.margenDerecho} onChange={v => setCfg("margenDerecho", v)} min={10} max={100} />
            <CfgField label="Padding tabla (pt)" value={pdfCfg.paddingTabla} onChange={v => setCfg("paddingTabla", v)} min={2} max={20} />
          </div>}

          {settingsTab === "fuente" && (
            <div className="space-y-5">
              <div className="grid gap-2">
                <Label className="text-xs text-gray-500">Familia tipográfica</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(FONT_MAP).map(([key, { css, label }]) => (
                    <button
                      key={key}
                      onClick={() => setFontCfg((p) => ({ ...p, familia: key }))}
                      style={{ fontFamily: css }}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        fontCfg.familia === key
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <CfgField
                label="Tamaño base (pt)"
                value={fontCfg.tamano}
                onChange={v => setFontCfg((p) => ({ ...p, tamano: v }))}
                min={6} max={16}
              />

              <div
                className="rounded-lg border p-3 text-gray-600"
                style={{ fontFamily: FONT_MAP[fontCfg.familia].css, fontSize: `${fontCfg.tamano}pt` }}
              >
                Vista previa: *Oferta válida 5 días. — Federación, 17 de Junio del 2026
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">Los cambios se aplican al próximo PDF generado.</p>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => { setPdfCfg(DEFAULT_PDF_CFG); setFontCfg(DEFAULT_FONT_CFG); }}>
              Restablecer
            </Button>
            <Button onClick={() => setSettingsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal agregar / editar ── */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar producto" : "Agregar producto"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Característica</Label>
              <Input value={caracteristica} onChange={(e) => setCaracteristica(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Precio unitario</Label>
                <Input value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Cantidad</Label>
                <Input value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </div>
            </div>

            <div className="rounded-xl border p-3 space-y-3">
              <label className="flex items-center gap-2">
                <Checkbox checked={useLargo} onCheckedChange={setUseLargo} />
                <span className="text-sm font-medium">Agregar largo</span>
              </label>
              {useLargo && (
                <div className="grid gap-2">
                  <Label>Largo</Label>
                  <Input value={largo} onChange={(e) => setLargo(e.target.value)} placeholder="Ej: 6,5 m" />
                </div>
              )}

              <label className="flex items-center gap-2">
                <Checkbox checked={useDiametro} onCheckedChange={setUseDiametro} />
                <span className="text-sm font-medium">Agregar diámetro</span>
              </label>
              {useDiametro && (
                <div className="grid gap-2">
                  <Label>Ø en cima</Label>
                  <Input value={diametro} onChange={(e) => setDiametro(e.target.value)} placeholder="Ej: 12/14 cm" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={saveItem}>{editingId ? "Guardar cambios" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto rounded-md my-4">
        <Table className="budget-table budget-zebra min-w-[600px]">
          <TableHeader>
            <TableRow className="budget-head">
              <TableHead className="w-[34%] py-3 text-base">Característica</TableHead>
              <TableHead className="py-3 text-base">largo</TableHead>
              <TableHead className="py-3 text-base">Ø en cima</TableHead>
              <TableHead className="text-right py-3 text-base">precio c/u</TableHead>
              {showCantidad && <TableHead className="text-right py-3 text-base">cantidad</TableHead>}
              {showSubtotal && <TableHead className="text-right py-3 text-base">subtotal</TableHead>}
              {showIva && <TableHead className="text-right py-3 text-base">+iva 21%</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={fixedCols + optionalCols} className="py-10 text-center text-gray-500">
                  Sin ítems. Agregá productos para exportar.
                </TableCell>
              </TableRow>
            ) : (
              items.map((it) => {
                const subtotal = it.precioUnitario * it.cantidad;
                const conIva = subtotal * (1 + IVA);
                return (
                  <TableRow key={it.id} className="group">
                    <TableCell className="font-medium relative pr-24 py-3 text-base">
                      {it.caracteristica}
                      <RowActions it={it} />
                    </TableCell>
                    <TableCell className="py-3 text-base">{it.largo ?? "—"}</TableCell>
                    <TableCell className="py-3 text-base">{it.diametro ?? "—"}</TableCell>
                    <TableCell className="text-right py-3 text-base">{moneyARS(it.precioUnitario)}</TableCell>
                    {showCantidad && <TableCell className="text-right py-3 text-base">{it.cantidad}</TableCell>}
                    {showSubtotal && <TableCell className="text-right py-3 text-base">{moneyARS(subtotal)}</TableCell>}
                    {showIva && <TableCell className="text-right py-3 text-base">{moneyARS(conIva)}</TableCell>}
                  </TableRow>
                );
              })
            )}
          </TableBody>

          {showTotalRow && (
            <TableFooter>
              <TableRow className="budget-total">
                <TableCell /><TableCell /><TableCell />
                <TableCell className="text-right font-semibold">Total</TableCell>
                {showCantidad && <TableCell />}
                {showSubtotal && (
                  <TableCell className="text-right font-semibold">{moneyARS(totalSubtotal)}</TableCell>
                )}
                {showIva && (
                  <TableCell className="text-right font-semibold">{moneyARS(totalConIva)}</TableCell>
                )}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* ── Editor de notas ── */}
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Notas y condiciones</Label>
        <p className="text-xs text-gray-500">
          Este texto se imprime al pie del PDF con el formato que apliques.
        </p>
        <RichTextEditor
          editorRef={editorRef}
          defaultHtml={DEFAULT_NOTES_HTML}
          fontFamily={FONT_MAP[fontCfg.familia].css}
          fontSize={`${fontCfg.tamano}pt`}
        />
      </div>

      {/* ── Botón Generar PDF (al final) ── */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={exportPDF}
          disabled={items.length === 0}
          className="gap-2 px-8 h-12 text-lg w-full sm:w-auto"
        >
          <FileDown size={20} />
          Generar PDF
        </Button>
      </div>

    </div>
  );
}
