export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="block relative group animate-pulse">
          {/* Full width OG Image skeleton */}
          <div className="relative aspect-video w-full">
            <div className="w-full h-full rounded-md border border-gray-200 bg-gray-200"></div>
          </div>

          {/* Favicon and Title skeleton below image */}
          <div className="flex items-center gap-2 mt-3">
            <div className="relative size-5 flex-shrink-0">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
