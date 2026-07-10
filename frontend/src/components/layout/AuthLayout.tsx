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
    <div className="relative flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12 sm:px-6 lg:px-8 dark overflow-hidden">
      {/* Premium background mesh gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-primary/10 via-bg-primary to-bg-primary pointer-events-none" />
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-accent-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-[400px] space-y-8 rounded-xl border border-border bg-bg-secondary/70 backdrop-blur-md p-6 shadow-xl sm:p-8 animate-scale-in">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary-subtle border border-accent-primary/20 shadow-inner">
            <svg className="h-7 w-7 text-accent-primary" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
              </defs>
              <path d="M16 2L30 10V22L16 30L2 22V10L16 2Z" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M16 8L24 12V20L16 24L8 20V12L16 8Z" fill="url(#logo-grad)" fillOpacity="0.1" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="16" cy="16" r="3.5" fill="url(#logo-grad)" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-text-primary">SyncForge</h1>
          <p className="mt-1 text-xs text-text-secondary">Forge your team's workflow</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
export default AuthLayout

