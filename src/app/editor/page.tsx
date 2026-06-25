import { Suspense } from "react";
import BudgetTable from "@/components/BudgetTable";

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Cargando presupuesto...
          </div>
        }
      >
        <BudgetTable />
      </Suspense>
    </main>
  );
}
