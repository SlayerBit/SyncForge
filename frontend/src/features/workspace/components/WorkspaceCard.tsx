import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { WorkspaceDto } from '@/types/common.types'

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
    <Link
      to={`/workspaces/${workspace.id}`}
      className="group block rounded-xl border border-border bg-bg-secondary p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent-primary/45 hover:shadow-md select-none relative overflow-hidden active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary font-bold border border-accent-primary/20 text-sm">
            {initials}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
              {workspace.name}
            </h3>
            <p className="text-xs text-text-tertiary line-clamp-1 mt-0.5">
              /{workspace.slug}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:text-accent-primary -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
      </div>
      
      <p className="text-xs text-text-secondary mt-3 line-clamp-2 leading-relaxed min-h-[32px]">
        {workspace.description || 'No description provided for this workspace.'}
      </p>
    </Link>
  )
}
export default WorkspaceCard
