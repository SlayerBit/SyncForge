import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Users, Settings, Activity, FolderKanban, Star, BarChart, Calendar, AlertCircle } from 'lucide-react'
import { useWorkspaceQuery } from '../api/workspace.queries'
import { useWorkspaceBoardsQuery, useCreateBoardMutation } from '@/features/board/api/board.queries'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { ActivityLogDto } from '@/types/common.types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Fetch workspace activity helper
async function fetchWorkspaceActivity(workspaceId: string) {
  const res = await apiClient.get<ApiResponse<{ content: ActivityLogDto[] }>>(`/workspaces/${workspaceId}/activity`)
  return res.data.data.content
}

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { data: workspace, isLoading: loadingWorkspace } = useWorkspaceQuery(workspaceId!)
  const { data: boards, isLoading: loadingBoards } = useWorkspaceBoardsQuery(workspaceId!)
  
  const { data: activities, isLoading: loadingActivity } = useQuery({
    queryKey: ['workspace-activity', workspaceId],
    queryFn: () => fetchWorkspaceActivity(workspaceId!),
    enabled: !!workspaceId,
  })

  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [boardDesc, setBoardDesc] = useState('')
  const createBoardMutation = useCreateBoardMutation(workspaceId!)

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!boardName.trim()) return

    createBoardMutation.mutate(
      { name: boardName, description: boardDesc },
      {
        onSuccess: () => {
          toast.success('Board created successfully!')
          setBoardName('')
          setBoardDesc('')
          setCreateBoardOpen(false)
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to create board')
        },
      }
    )
  }

  if (loadingWorkspace || loadingBoards) {
    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto select-none">
        <div className="flex justify-between items-center pb-6 border-b border-border-default/30">
          <div className="space-y-1.5">
            <div className="h-7 w-44 rounded-lg bg-bg-tertiary/60 animate-pulse" />
            <div className="h-3.5 w-64 rounded bg-bg-tertiary/40 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-xl bg-bg-tertiary/50 animate-pulse" />
            <div className="h-9 w-20 rounded-xl bg-bg-tertiary/50 animate-pulse" />
            <div className="h-9 w-24 rounded-xl bg-bg-tertiary/60 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="h-4 w-28 rounded bg-bg-tertiary/50 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-28 rounded-2xl bg-bg-secondary/60 animate-pulse" />
              <div className="h-28 rounded-2xl bg-bg-secondary/60 animate-pulse" />
            </div>
          </div>
          <div className="h-[220px] rounded-2xl bg-bg-secondary/70 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!workspace) {
    return <div className="p-8 text-danger text-center">Workspace not found</div>
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto animate-fade-in text-text-primary">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border-default/45 pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-text-primary">{workspace.name}</h1>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{workspace.description || 'No description provided for this workspace.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/workspaces/${workspaceId}/members`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-secondary hover:text-text-primary">
              <Users className="h-4 w-4" />
              Members
            </Button>
          </Link>
          <Link to={`/workspaces/${workspaceId}/settings`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-secondary hover:text-text-primary">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button onClick={() => setCreateBoardOpen(true)} size="sm" className="text-xs h-8.5 rounded-lg">
            <Plus className="h-4 w-4 mr-1.5" />
            New Board
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Boards List */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2 pl-1">
            <FolderKanban className="h-4 w-4 text-accent-primary" />
            Workspace Boards ({boards?.length || 0})
          </h2>

          {!boards || boards.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No boards yet"
              description="Boards house your workflow columns and task cards."
              actionLabel="Create Board"
              onAction={() => setCreateBoardOpen(true)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  to={`/boards/${board.id}`}
                  className="group block rounded-2xl border border-border-default/80 bg-bg-secondary/40 p-5 hover:border-accent-primary/40 hover:bg-bg-secondary/80 hover:shadow-xs transition-all duration-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-border-default/45 group-hover:bg-accent-primary transition-colors" />
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-text-primary group-hover:text-accent-primary transition-colors leading-tight">{board.name}</h3>
                    <FolderKanban className="h-4 w-4 text-text-tertiary/60 group-hover:text-accent-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-text-secondary mt-2 line-clamp-2 leading-relaxed min-h-[32px]">
                    {board.description || 'No description provided for this board.'}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border-default/35 mt-4">
                    <span className="text-[9px] font-bold text-text-tertiary uppercase">Kanban View</span>
                    <span className="text-[9px] font-bold text-text-secondary bg-bg-primary border border-border-default/50 px-2.5 py-0.5 rounded-md">
                      Open Board →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Health Statistics & Logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Workspace Health & Velocity widget */}
          <div className="border border-border-default bg-bg-secondary/40 rounded-2xl p-5 space-y-4 shadow-sm backdrop-blur-xs">
            <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-border-default/40">
              <BarChart className="h-4.5 w-4.5 text-accent-primary" />
              Workspace Velocity
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary font-medium">Sprint Progress</span>
                <span className="font-bold text-text-primary">82%</span>
              </div>
              <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                <div className="h-full bg-accent-primary rounded-full w-[82%]" />
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="p-3 bg-bg-primary rounded-xl border border-border-default/60">
                  <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block">Blocked Tasks</span>
                  <span className="text-sm font-extrabold text-danger mt-1 block">0</span>
                </div>
                <div className="p-3 bg-bg-primary rounded-xl border border-border-default/60">
                  <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block">Completed</span>
                  <span className="text-sm font-extrabold text-success mt-1 block">14</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="space-y-4 rounded-2xl border border-border-default bg-bg-secondary/45 p-5 shadow-xs h-fit">
            <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-border/40">
              <Activity className="h-4.5 w-4.5 text-warning" />
              Workspace Activity
            </h2>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 pt-1.5 custom-scrollbar">
              {loadingActivity ? (
                <p className="text-xs text-text-secondary">Loading logs...</p>
              ) : !activities || activities.length === 0 ? (
                <p className="text-xs text-text-tertiary">No recent activity.</p>
              ) : (
                activities.map((log) => (
                  <div key={log.id} className="text-xs border-l border-border pl-3 pb-1 space-y-0.5">
                    <div className="flex justify-between text-[10px] text-text-tertiary">
                      <span className="font-semibold">{log.actor.displayName}</span>
                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-text-secondary">
                      {log.action.toLowerCase().replace(/_/g, ' ')} {log.entityType.toLowerCase()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Board Dialog */}
      <Dialog open={createBoardOpen} onOpenChange={setCreateBoardOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new Kanban board to organize your tasks.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBoard} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="boardName">Board Name</Label>
              <Input
                id="boardName"
                placeholder="e.g. Sprint Board, Product Backlog"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="boardDesc">Description</Label>
              <Input
                id="boardDesc"
                placeholder="e.g. Planning and tracking for Q3"
                value={boardDesc}
                onChange={(e) => setBoardDesc(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateBoardOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={createBoardMutation.isPending} size="sm">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default WorkspacePage
