import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-bg-secondary/20 p-8 text-center select-none relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#5c4fe502_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      
      <div className="relative z-10 space-y-4 max-w-sm flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 border border-accent-primary/20 shadow-xs transition-transform hover:scale-105 duration-300">
          <Icon className="h-6.5 w-6.5 text-accent-primary" aria-hidden="true" />
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary tracking-tight">{title}</h3>
          <p className="text-[11px] text-text-secondary leading-relaxed">{description}</p>
        </div>

        {actionLabel && onAction && (
          <div className="pt-2">
            <Button 
              onClick={onAction} 
              className="h-9 rounded-xl bg-accent-primary hover:bg-accent-primary-hover text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all"
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
export default EmptyState
