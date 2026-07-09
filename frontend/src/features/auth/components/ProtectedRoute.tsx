import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary dark">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary mx-auto" />
          <p className="text-xs text-text-secondary font-medium">Restoring session...</p>
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
