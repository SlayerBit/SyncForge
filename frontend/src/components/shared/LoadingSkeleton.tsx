import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function TaskCardSkeleton() {
  return (
    <div className="rounded-md border border-border bg-bg-secondary p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-12" />
        <div className="flex gap-1">
          <Skeleton className="h-4 w-8 rounded-sm" />
          <Skeleton className="h-4 w-8 rounded-sm" />
        </div>
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex -space-x-1">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-lg bg-bg-secondary p-3 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto p-6">
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-4 rounded-md border border-border p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
