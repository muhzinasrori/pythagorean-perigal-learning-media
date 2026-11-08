export default function TeacherLoading() {
  return (
    <div className="min-h-screen bg-stone-50/50 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-stone-200 rounded-md" />
          <div className="h-8 w-72 sm:w-96 bg-stone-300 rounded-lg" />
          <div className="h-4 w-60 sm:w-80 bg-stone-200 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-stone-200 rounded-xl" />
          <div className="h-10 w-24 bg-stone-200 rounded-xl" />
        </div>
      </div>

      {/* Summary KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-stone-200 rounded-md" />
              <div className="h-5 w-5 bg-stone-200 rounded-full" />
            </div>
            <div className="h-8 w-16 bg-stone-300 rounded-lg" />
            <div className="h-3 w-36 bg-stone-200 rounded-md" />
          </div>
        ))}
      </div>

      {/* Student Progress Table Skeleton */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-stone-100 p-6 space-y-2">
          <div className="h-5 w-32 bg-stone-300 rounded-md" />
          <div className="h-4 w-64 bg-stone-200 rounded-md" />
        </div>
        <div className="p-6 space-y-4">
          {/* Table Header Skeleton */}
          <div className="grid grid-cols-5 gap-4 pb-3 border-b border-stone-100">
            <div className="h-4 w-24 bg-stone-200 rounded-md" />
            <div className="h-4 w-20 bg-stone-200 rounded-md" />
            <div className="h-4 w-20 bg-stone-200 rounded-md" />
            <div className="h-4 w-24 bg-stone-200 rounded-md" />
            <div className="h-4 w-16 bg-stone-200 rounded-md" />
          </div>
          {/* Table Rows Skeleton */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-5 gap-4 items-center py-2">
              <div className="h-4 w-32 bg-stone-200 rounded-md" />
              <div className="h-6 w-16 bg-teal-100 rounded-full" />
              <div className="h-4 w-12 bg-stone-200 rounded-md" />
              <div className="h-4 w-20 bg-stone-200 rounded-md" />
              <div className="h-4 w-14 bg-stone-200 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}