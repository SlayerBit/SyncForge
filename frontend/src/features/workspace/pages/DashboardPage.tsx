import React, { useState } from 'react'
import { Plus, LayoutGrid, CheckSquare, Clock } from 'lucide-react'
import { useWorkspacesQuery } from '../api/workspace.queries'
import { WorkspaceCard } from '../components/WorkspaceCard'
import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'

export function DashboardPage() {
  const { data: workspaces, isLoading, error } = useWorkspacesQuery()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-8 w-48 bg-bg-tertiary rounded" />
        <ListSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-danger">
        Failed to load workspaces. Please try again.
      </div>
    )
  }

  const hasWorkspaces = workspaces && workspaces.length > 0

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">
            Overview of your active workspaces and project activity.
          </p>
        </div>
        {hasWorkspaces && (
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex h-8 items-center justify-center rounded-md bg-accent-primary px-3 text-xs font-semibold text-white shadow hover:bg-accent-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Workspace
          </button>
        )}
      </div>

      {!hasWorkspaces ? (
        <EmptyState
          icon={LayoutGrid}
          title="No workspaces yet"
          description="Create a workspace to start organizing your boards and tasks."
          actionLabel="Create Workspace"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-accent-primary" />
              Your Workspaces ({workspaces.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {workspaces.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3 rounded-lg border border-border bg-bg-secondary p-5">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-success" />
                Assigned to You
              </h3>
              <p className="text-xs text-text-secondary">
                Select a workspace to view your assigned tasks and work updates.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-bg-secondary p-5">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Recent Tasks
              </h3>
              <p className="text-xs text-text-secondary">
                Go to a board to see your recently modified cards and activity timeline logs.
              </p>
            </div>
          </div>
        </div>
      )}

      <CreateWorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
export default DashboardPage
