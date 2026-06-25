export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-screen-xl mx-auto px-4 space-y-4 animate-pulse">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="h-9 w-40 bg-gray-200 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-gray-200 rounded-lg" />
            <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Header fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-200 h-11 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-t border-gray-100">
              <div className="h-9 flex-1 bg-gray-100 rounded" />
              <div className="h-9 w-24 bg-gray-100 rounded" />
              <div className="h-9 w-24 bg-gray-100 rounded" />
              <div className="h-9 w-28 bg-gray-100 rounded" />
              <div className="h-9 w-8 bg-gray-100 rounded" />
            </div>
          ))}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="h-9 w-36 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Notes + totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-100 rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
