import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen bg-bg-primary overflow-hidden select-none">
        {/* Skeleton Sidebar Dock */}
        <div className="w-[240px] h-full p-4 border-r border-border-default/40 bg-bg-secondary/30 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="h-9.5 rounded-xl bg-bg-tertiary/60 animate-pulse" />
            <div className="space-y-2 pt-6">
              <div className="h-8 rounded-lg bg-bg-tertiary/45 animate-pulse w-[85%]" />
              <div className="h-8 rounded-lg bg-bg-tertiary/45 animate-pulse w-[90%]" />
              <div className="h-8 rounded-lg bg-bg-tertiary/45 animate-pulse w-[75%]" />
            </div>
          </div>
          <div className="h-11 rounded-xl bg-bg-tertiary/50 animate-pulse" />
        </div>
        {/* Skeleton Content Canvas */}
        <div className="flex-1 p-6 space-y-6 overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-border-default/30">
            <div className="space-y-1.5">
              <div className="h-6 w-44 rounded-lg bg-bg-tertiary/60 animate-pulse" />
              <div className="h-3.5 w-64 rounded bg-bg-tertiary/40 animate-pulse" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-bg-tertiary/60 animate-pulse" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div className="h-4 w-28 rounded bg-bg-tertiary/50 animate-pulse" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-28 rounded-2xl bg-bg-secondary/60 animate-pulse" />
                <div className="h-28 rounded-2xl bg-bg-secondary/60 animate-pulse" />
              </div>
            </div>
            <div className="h-[220px] rounded-2xl bg-bg-secondary/70 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
export default ProtectedRoute
