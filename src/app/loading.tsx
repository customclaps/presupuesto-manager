export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 xl:px-8 py-8 sm:py-12 space-y-6 animate-pulse">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            <div className="space-y-2">
              <div className="h-7 w-52 bg-gray-200 rounded-md" />
              <div className="h-4 w-36 bg-gray-100 rounded-md" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
            <div className="w-44 h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="bg-gray-200 h-12 w-full" />
          {/* Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-5 py-4 border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50" : ""}`}
            >
              <div className="h-4 w-12 bg-gray-200 rounded" />
              <div className="h-4 flex-1 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded ml-auto" />
              <div className="h-4 w-28 bg-gray-100 rounded hidden lg:block" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                <div className="h-8 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  );
}
