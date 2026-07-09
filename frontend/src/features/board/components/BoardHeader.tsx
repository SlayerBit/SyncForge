import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FolderKanban, Archive, Save, ArrowLeft } from 'lucide-react'
import { useArchiveBoardMutation, useUpdateBoardMutation } from '../api/board.queries'
import { useWorkspaceMembersQuery } from '@/features/workspace/api/workspace.queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import { usePresenceStore } from '@/stores/presence.store'
import { BoardDto } from '@/types/common.types'
import { toast } from 'sonner'

interface BoardHeaderProps {
  board: BoardDto
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(board.name)
  const [isEditing, setIsEditing] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const updateMutation = useUpdateBoardMutation(board.id)
  const archiveMutation = useArchiveBoardMutation(board.workspaceId)

  // Get active presence
  const { data: members } = useWorkspaceMembersQuery(board.workspaceId)
  const { onlineUserIds } = usePresenceStore()
  
  const activeMembersOnBoard = members?.filter((m) => onlineUserIds.includes(m.userId)) || []

  const handleUpdate = () => {
    if (!name.trim() || name === board.name) {
      setIsEditing(false)
      return
    }

    updateMutation.mutate(
      { name, version: board.version },
      {
        onSuccess: () => {
          toast.success('Board renamed!')
          setIsEditing(false)
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to update board name')
          setName(board.name)
          setIsEditing(false)
        },
      }
    )
  }

  const handleArchive = () => {
    archiveMutation.mutate(board.id, {
      onSuccess: () => {
        toast.success('Board archived successfully!')
        navigate(`/workspaces/${board.workspaceId}`)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to archive board')
        setArchiveOpen(false)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-4 text-text-primary">
      <div className="space-y-1">
        <Link
          to={`/workspaces/${board.workspaceId}`}
          className="text-xs font-semibold text-accent-primary flex items-center gap-1 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Workspace
        </Link>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm font-semibold max-w-[200px]"
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={handleUpdate}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-lg font-bold tracking-tight cursor-pointer hover:text-accent-primary transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {board.name}
            </h1>
          )}
          <span className="text-[10px] text-text-tertiary px-1.5 py-0.5 rounded bg-bg-tertiary">
            v{board.version}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Board Presence avatar list */}
        {activeMembersOnBoard.length > 0 && (
          <div className="flex -space-x-1 items-center">
            <span className="text-[10px] text-text-tertiary mr-2">Viewing:</span>
            {activeMembersOnBoard.map((p) => (
              <Avatar
                key={p.userId}
                displayName={p.displayName}
                size="xs"
                className="ring-1 ring-background"
                status="ONLINE"
              />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="text-xs hover:bg-danger hover:text-white"
          onClick={() => setArchiveOpen(true)}
        >
          <Archive className="h-4 w-4 mr-1.5" />
          Archive Board
        </Button>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive Board"
        description="Are you sure you want to archive this board? You will not be able to interact with its columns or tasks unless it is restored by an admin."
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
        loading={archiveMutation.isPending}
      />
    </div>
  )
}
export default BoardHeader
