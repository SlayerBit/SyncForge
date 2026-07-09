import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Users, Settings, Activity, FolderKanban } from 'lucide-react'
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
    return <div className="p-8 text-text-secondary">Loading workspace...</div>
  }

  if (!workspace) {
    return <div className="p-8 text-danger text-center">Workspace not found</div>
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto animate-fade-in text-text-primary">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
          <p className="text-xs text-text-secondary mt-1">{workspace.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/workspaces/${workspaceId}/members`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Users className="h-4 w-4" />
              Members
            </Button>
          </Link>
          <Link to={`/workspaces/${workspaceId}/settings`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button onClick={() => setCreateBoardOpen(true)} size="sm" className="text-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            New Board
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Boards List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-accent-primary" />
            Workspace Boards
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
                  className="block rounded-lg border border-border bg-bg-secondary p-5 hover:bg-bg-tertiary transition-all"
                >
                  <h3 className="font-semibold text-sm">{board.name}</h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                    {board.description || 'No description'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity Logs */}
        <div className="space-y-4 rounded-lg border border-border bg-bg-secondary p-5 h-fit">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Activity className="h-4 w-4 text-warning" />
            Workspace Activity
          </h2>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
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
