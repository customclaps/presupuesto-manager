"use client";

import * as React from "react";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface Props {
  editorRef: React.RefObject<HTMLDivElement | null>;
  defaultHtml: string;
  fontFamily?: string;
  fontSize?: string;
}

const FONT_SIZES_PT = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];
const FONT_FAMILIES = [
  "Helvetica",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
];

export function RichTextEditor({ editorRef, defaultHtml, fontFamily, fontSize }: Props) {
  function execCmd(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function applyFontSize(pt: number) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      editorRef.current?.focus();
      return;
    }
    const fragment = range.extractContents();
    const span = document.createElement("span");
    span.style.fontSize = `${pt}pt`;
    span.appendChild(fragment);
    range.insertNode(span);
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
  }

  React.useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border-x border-b rounded-b-xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5 bg-gray-50 px-2 py-1.5">
        <ToolBtn onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }} title="Negrita">
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }} title="Cursiva">
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }} title="Subrayado">
          <Underline size={14} />
        </ToolBtn>

        <Sep />

        <select
          className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white cursor-pointer"
          defaultValue="9"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => applyFontSize(Number(e.target.value))}
        >
          {FONT_SIZES_PT.map((s) => (
            <option key={s} value={s}>{s} pt</option>
          ))}
        </select>

        <select
          className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white cursor-pointer ml-1"
          defaultValue="Helvetica"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => execCmd("fontName", e.target.value)}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <Sep />

        <ToolBtn onMouseDown={(e) => { e.preventDefault(); execCmd("justifyLeft"); }} title="Alinear izquierda">
          <AlignLeft size={14} />
        </ToolBtn>
        <ToolBtn onMouseDown={(e) => { e.preventDefault(); execCmd("justifyCenter"); }} title="Centrar">
          <AlignCenter size={14} />
        </ToolBtn>
        <ToolBtn onMouseDown={(e) => { e.preventDefault(); execCmd("justifyRight"); }} title="Alinear derecha">
          <AlignRight size={14} />
        </ToolBtn>
      </div>

      <div
        ref={editorRef as React.RefObject<HTMLDivElement>}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[180px] p-4 focus:outline-none leading-relaxed bg-white"
        style={{
          fontFamily: fontFamily ?? "Helvetica, Arial, sans-serif",
          fontSize: fontSize ?? "9pt",
        }}
      />
    </div>
  );
}

function ToolBtn({
  onMouseDown,
  title,
  children,
}: {
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className="p-1.5 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-700"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-300 mx-1.5" />;
}
