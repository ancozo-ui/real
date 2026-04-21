interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  )
}

export function ListingsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}
