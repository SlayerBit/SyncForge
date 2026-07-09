import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export function AuthLayout() {
  const accessToken = useAuthStore((state) => state.accessToken)

  // Redirect to dashboard if already authenticated
  if (accessToken) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12 sm:px-6 lg:px-8 dark">
      <div className="w-full max-w-[400px] space-y-8 rounded-lg border border-border bg-bg-secondary p-6 shadow-lg sm:p-8">
        <div className="flex flex-col items-center">
          <span className="text-3xl" role="img" aria-label="SyncForge logo">⚡</span>
          <span className="mt-2 text-xl font-bold tracking-tight text-text-primary">SyncForge</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
export default AuthLayout
