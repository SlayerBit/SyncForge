import React from 'react'
import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { motion } from 'framer-motion'
import { Sparkles, Activity, CheckCircle, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export function AuthLayout() {
  const accessToken = useAuthStore((state) => state.accessToken)

  // Redirect to dashboard if already authenticated
  if (accessToken) {
    return <Navigate to="/" replace />
  }

  // Showcase elements to float in the background
  const mockCards = [
    {
      title: '🎨 Revisit Visual Grammar',
      tag: 'Design',
      priority: 'HIGH',
      color: 'border-amber-500',
      delay: 0.1,
      x: -40,
      y: -90,
    },
    {
      title: '⚡ Handcraft Motion Library',
      tag: 'Engineering',
      priority: 'URGENT',
      color: 'border-rose-500',
      delay: 0.3,
      x: 120,
      y: -30,
    },
    {
      title: '👥 Align Team Milestones',
      tag: 'Product',
      priority: 'MEDIUM',
      color: 'border-indigo-500',
      delay: 0.5,
      x: -80,
      y: 60,
    },
  ]

  return (
    <div className="relative min-h-screen bg-bg-primary select-none overflow-hidden md:grid md:grid-cols-12 text-text-primary">
      {/* Forms Panel (Left Column) */}
      <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col justify-between p-6 sm:p-10 bg-bg-primary relative z-10 min-h-screen border-r border-border/40 shadow-xl">
        {/* Header */}
        <Logo />

        {/* Dynamic Outlet */}
        <div className="my-auto py-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-[10px] text-text-tertiary">
          © {new Date().getFullYear()} SyncForge. All rights reserved. Premium workflow crafting.
        </div>
      </div>

      {/* Brand & Animation Showcase Panel (Right Column) - Overhauled to Premium Light-First */}
      <div className="hidden md:flex col-span-7 lg:col-span-8 bg-bg-secondary relative overflow-hidden items-center justify-center p-12">
        {/* Abstract grids and lights */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-accent-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

        <div className="relative text-center max-w-lg space-y-8 z-10">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Next-Gen Collaborative Board
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl leading-tight">
              Create, sync, and forge workflows.
            </h2>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              SyncForge keeps your product team in sync. Live avatars, interactive Kanban cards, and seamless transitions update immediately.
            </p>
          </div>

          {/* Interactive Floating Canvas */}
          <div className="relative h-64 w-full flex items-center justify-center pointer-events-none">
            {/* Live moving cursors */}
            <motion.div
              animate={{ 
                x: [-100, 80, -20, -100], 
                y: [40, -60, 20, 40] 
              }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
              className="absolute pointer-events-none flex items-center gap-1.5 z-20"
            >
              <svg className="h-4.5 w-4.5 text-accent-primary drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 2l16 12.2-6.5 1.5 5.5 6.6-3 2.5-5.5-6.6L4 21V2z" />
              </svg>
              <span className="bg-accent-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm">Sophia</span>
            </motion.div>

            <motion.div
              animate={{ 
                x: [120, -40, 60, 120], 
                y: [-80, 20, -40, -80] 
              }}
              transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 2 }}
              className="absolute pointer-events-none flex items-center gap-1.5 z-20"
            >
              <svg className="h-4.5 w-4.5 text-emerald-500 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 2l16 12.2-6.5 1.5 5.5 6.6-3 2.5-5.5-6.6L4 21V2z" />
              </svg>
              <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm">Mark</span>
            </motion.div>

            {mockCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9, x: card.x, y: card.y + 20 }}
                animate={{ opacity: 1, scale: 1, y: card.y }}
                transition={{
                  duration: 0.8,
                  delay: card.delay,
                  type: 'spring',
                  stiffness: 100,
                }}
                className={`absolute w-60 rounded-2xl border border-border/60 bg-bg-primary/95 p-4 text-left shadow-xl border-l-4 ${card.color} backdrop-blur-md`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">{card.tag}</span>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-bg-secondary text-text-primary">{card.priority}</span>
                </div>
                <h4 className="text-xs font-semibold text-text-primary mt-2 leading-relaxed">{card.title}</h4>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex -space-x-1.5">
                    <div className="h-5.5 w-5.5 rounded-full bg-accent-primary border border-bg-primary text-[8px] font-bold text-white flex items-center justify-center">
                      JD
                    </div>
                    <div className="h-5.5 w-5.5 rounded-full bg-indigo-500 border border-bg-primary text-[8px] font-bold text-white flex items-center justify-center">
                      TA
                    </div>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive features badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-secondary pt-4">
            <div className="flex items-center gap-1.5 bg-bg-primary border border-border/40 px-3 py-1.5 rounded-lg shadow-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="font-medium text-text-secondary">Realtime Synced</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bg-primary border border-border/40 px-3 py-1.5 rounded-lg shadow-sm">
              <Activity className="h-4 w-4 text-accent-primary" />
              <span className="font-medium text-text-secondary">Activity Feeds</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bg-primary border border-border/40 px-3 py-1.5 rounded-lg shadow-sm">
              <ShieldCheck className="h-4 w-4 text-warning" />
              <span className="font-medium text-text-secondary">JWT Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AuthLayout
