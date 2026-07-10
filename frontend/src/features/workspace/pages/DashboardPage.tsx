import React, { useState } from 'react'
import { Plus, LayoutGrid, CheckSquare, Clock, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react'
import { useWorkspacesQuery } from '../api/workspace.queries'
import { WorkspaceCard } from '../components/WorkspaceCard'
import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuthStore } from '@/stores/auth.store'

export function DashboardPage() {
  const { data: workspaces, isLoading, error } = useWorkspacesQuery()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-bg-tertiary rounded" />
        <ListSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center text-danger border border-danger/10 rounded-xl bg-danger/5 my-8">
        Failed to load workspaces. Please try again.
      </div>
    )
  }

  const hasWorkspaces = workspaces && workspaces.length > 0

  // Quick helper to determine greeting
  const getGreeting = () => {
    const hrs = new Date().getHours()
    if (hrs < 12) return 'Good morning'
    if (hrs < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto animate-fade-in select-none">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            {getGreeting()}, {user?.displayName || 'User'}
            <Sparkles className="h-4 w-4 text-accent-primary animate-pulse" />
          </h1>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Welcome to your SyncForge dashboard. Select a workspace below to start managing tasks.
          </p>
        </div>
        {hasWorkspaces && (
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex h-8 items-center justify-center rounded-lg bg-accent-primary px-3 text-xs font-semibold text-white shadow hover:bg-accent-primary-hover active:scale-[0.98] transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
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
        <div className="grid gap-6 md:grid-cols-5">
          {/* Workspaces List (Left 3 columns) */}
          <div className="md:col-span-3 space-y-4">
            <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-accent-primary" />
              Active Workspaces ({workspaces.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {workspaces.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} />
              ))}
            </div>
          </div>

          {/* Quick Info & Help Cards (Right 2 columns) */}
          <div className="md:col-span-2 space-y-5">
            {/* Info panel 1 */}
            <div className="space-y-3 rounded-xl border border-border/80 bg-bg-secondary p-5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-success" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Assigned tasks
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Task assignment is scoped within workspaces. Open a workspace and select a board to view your cards and tasks.
              </p>
              <div className="pt-1 text-[10px] text-accent-primary font-semibold flex items-center gap-0.5 group-hover:underline cursor-pointer">
                Learn more about issue tracking
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>

            {/* Info panel 2 */}
            <div className="space-y-3 rounded-xl border border-border/80 bg-bg-secondary p-5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Recent activities
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Track live progress, comments, and task adjustments. Use the sidebar to quickly access your boards.
              </p>
              <div className="pt-1 text-[10px] text-accent-primary font-semibold flex items-center gap-0.5 group-hover:underline cursor-pointer">
                View notification feed
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>

            {/* Info panel 3 */}
            <div className="space-y-3 rounded-xl border border-border/80 bg-bg-secondary p-5 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-primary" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Realtime updates
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                SyncForge keeps your boards in sync. Live team members and changes appear immediately.
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
