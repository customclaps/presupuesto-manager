"use client";

import React from "react";
import { Pencil, Trash2, Plus, RefreshCw, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Presupuesto, Item } from "@/lib/types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function calcTotal(itemsJson: string): number {
  try {
    const items = JSON.parse(itemsJson) as Item[];
    const subtotal = items.reduce(
      (acc, it) => acc + it.precioUnitario * it.cantidad,
      0
    );
    return subtotal * 1.21;
  } catch {
    return 0;
  }
}

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  if (dateStr.includes("/")) return dateStr;
  try {
    return new Date(dateStr).toLocaleDateString("es-AR");
  } catch {
    return dateStr;
  }
}

function getPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);

  return pages;
}

export default function PresupuestosList({
  presupuestos,
  currentPage,
  totalPages,
  total,
}: {
  presupuestos: Presupuesto[];
  currentPage: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const [confirmId, setConfirmId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await fetch(`/api/presupuestos/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-[#3b879c] rounded-xl">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestión de Presupuestos
            </h1>
            <p className="text-sm sm:text-base text-gray-500">Maderas Cambireca</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
          <Link
            href="/editor"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3b879c] text-white rounded-lg hover:bg-[#2d6b7a] transition-colors font-medium shadow-sm text-base"
          >
            <Plus size={16} />
            Nuevo Presupuesto
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {presupuestos.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-medium text-gray-500">
              No hay presupuestos guardados aún.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Hacé clic en{" "}
              <span className="font-semibold text-[#3b879c]">
                Nuevo Presupuesto
              </span>{" "}
              para crear el primero.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base min-w-[600px]">
              <thead>
                <tr className="bg-[#3b879c] text-white text-left">
                  <th className="px-4 sm:px-5 py-4 font-semibold">Nro.</th>
                  <th className="px-4 sm:px-5 py-4 font-semibold">Cliente</th>
                  <th className="px-4 sm:px-5 py-4 font-semibold">Fecha</th>
                  <th className="px-4 sm:px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {presupuestos.map((p, i) => {
                  const total = calcTotal(p.items);
                  const isConfirming = confirmId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-gray-100 transition-colors hover:bg-blue-50 ${
                        i % 2 === 1 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="px-4 sm:px-5 py-4 font-mono font-semibold text-gray-700 whitespace-nowrap">
                        {String(p.numero || p.id).padStart(4, "0")}
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-gray-800 max-w-[200px] sm:max-w-none truncate">
                        {p.cliente || (
                          <span className="text-gray-400 italic">Sin nombre</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-gray-600 whitespace-nowrap">
                        {formatDate(p.fecha)}
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {isConfirming ? (
                            <>
                              <span className="text-sm text-gray-600">
                                ¿Eliminar?
                              </span>
                              <button
                                onClick={() => handleDelete(p.id)}
                                disabled={deletingId === p.id}
                                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                {deletingId === p.id ? "..." : "Sí"}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/editor?id=${p.id}`}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                                title="Editar"
                              >
                                <Pencil size={15} />
                              </Link>
                              <button
                                onClick={() => setConfirmId(p.id)}
                                className="p-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer: total + paginación */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
        <p className="text-sm text-gray-400 order-2 sm:order-1">
          {total} {total === 1 ? "presupuesto" : "presupuestos"} en total
          {totalPages > 1 && ` · página ${currentPage} de ${totalPages}`}
        </p>

        {totalPages > 1 && (
          <Pagination className="w-auto mx-0 order-1 sm:order-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={currentPage > 1 ? `/?page=${currentPage - 1}` : "#"}
                  aria-disabled={currentPage <= 1}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-40"
                      : ""
                  }
                />
              </PaginationItem>

              {pageNumbers.map((p, idx) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`ell-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href={`/?page=${p}`}
                      isActive={p === currentPage}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href={
                    currentPage < totalPages
                      ? `/?page=${currentPage + 1}`
                      : "#"
                  }
                  aria-disabled={currentPage >= totalPages}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-40"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
