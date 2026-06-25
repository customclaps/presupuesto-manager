import { getPresupuestosPage } from "@/lib/db";
import PresupuestosList from "@/components/PresupuestosList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const { rows, total } = getPresupuestosPage(currentPage, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 xl:px-8 py-8 sm:py-12">
        <PresupuestosList
          presupuestos={rows}
          currentPage={safePage}
          totalPages={totalPages}
          total={total}
        />
      </div>
    </main>
  );
}
