import { Skeleton } from "@/components/ui/skeleton"
 
export function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}


export function SkeletonTable() {
  return (
    <div className="flex items-center space-x-4">
      <div className="space-y-3">
        <Skeleton className="h-6 w-[800px]" />
        <Skeleton className="h-6 w-[800px]" />
        <Skeleton className="h-6 w-[800px]" />
        <Skeleton className="h-6 w-[800px]" />
        <Skeleton className="h-6 w-[800px]" />
      </div>
    </div>
  )
}