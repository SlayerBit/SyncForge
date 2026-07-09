import React from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Users } from 'lucide-react'
import { WorkspaceDto } from '@/types/common.types'

interface WorkspaceCardProps {
  workspace: WorkspaceDto
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  // We can calculate initials or a nice placeholder badge
  const initials = workspace.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Link
      to={`/workspaces/${workspace.id}`}
      className="group block rounded-lg border border-border bg-bg-secondary p-5 shadow-sm transition-all hover:bg-bg-tertiary hover:shadow-md animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-accent-primary-subtle text-accent-primary font-bold">
          {initials}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-primary">
            {workspace.name}
          </h3>
          <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
            {workspace.description || 'No description provided'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="h-3.5 w-3.5" />
          <span>Boards</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>Members</span>
        </div>
      </div>
    </Link>
  )
}
