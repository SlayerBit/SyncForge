import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { WorkspaceDto } from '@/types/common.types'
import { motion } from 'framer-motion'

interface WorkspaceCardProps {
  workspace: WorkspaceDto
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const initials = workspace.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Link
        to={`/workspaces/${workspace.id}`}
        className="group block h-full rounded-2xl border border-border/60 bg-bg-secondary p-5 shadow-xs transition-colors hover:border-accent-primary/45 select-none relative overflow-hidden bg-gradient-to-b from-bg-secondary to-bg-secondary/40"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary font-bold border border-accent-primary/20 text-sm shadow-inner">
              {initials}
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors leading-tight">
                {workspace.name}
              </h3>
              <p className="text-[10px] font-mono text-text-tertiary mt-0.5">
                /{workspace.slug}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:text-accent-primary -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
        </div>
        
        <p className="text-xs text-text-secondary mt-3.5 line-clamp-2 leading-relaxed min-h-[32px]">
          {workspace.description || 'No description provided for this workspace.'}
        </p>
      </Link>
    </motion.div>
  )
}
export default WorkspaceCard
