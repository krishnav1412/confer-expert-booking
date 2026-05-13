export const ExpertCardSkeleton = () => (
  <div className="card p-5">
    <div className="flex items-start gap-4">
      <div className="skeleton h-16 w-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-5 w-24 rounded-md" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-11/12" />
      <div className="skeleton h-3 w-3/4" />
    </div>
    <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-4 w-12" />
    </div>
  </div>
);

export const ExpertGridSkeleton = ({ count = 6 }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <ExpertCardSkeleton key={i} />
    ))}
  </div>
);

export const ExpertDetailSkeleton = () => (
  <div className="grid gap-8 lg:grid-cols-3">
    <div className="lg:col-span-2 space-y-6">
      <div className="card p-6">
        <div className="flex gap-5">
          <div className="skeleton h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-11/12" />
          <div className="skeleton h-3 w-9/12" />
        </div>
      </div>
      <div className="card p-6">
        <div className="skeleton h-5 w-32" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
    <div className="card h-fit p-6">
      <div className="skeleton h-5 w-24" />
      <div className="mt-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  </div>
);

export const RowSkeleton = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="card flex items-center gap-4 p-5">
        <div className="skeleton h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-3 w-1/4" />
        </div>
        <div className="skeleton h-6 w-20 rounded-md" />
      </div>
    ))}
  </div>
);
