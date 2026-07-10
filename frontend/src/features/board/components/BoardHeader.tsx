import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, Save, Edit3, ShieldAlert } from 'lucide-react'
import { useArchiveBoardMutation, useUpdateBoardMutation } from '../api/board.queries'
import { useWorkspaceMembersQuery } from '@/features/workspace/api/workspace.queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import { usePresenceStore } from '@/stores/presence.store'
import { BoardDto } from '@/types/common.types'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 text-text-primary select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 group">
          {isEditing ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5"
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm font-bold max-w-[200px] focus:ring-1 focus:ring-accent-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 shrink-0" onClick={handleUpdate}>
                <Save className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-extrabold tracking-tight cursor-pointer hover:text-accent-primary transition-colors flex items-center gap-1.5"
                onClick={() => setIsEditing(true)}
              >
                {board.name}
                <Edit3 className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            </div>
          )}
          <span className="text-[9px] font-extrabold text-text-secondary px-2 py-0.5 rounded-full bg-bg-hover border border-border/30">
            v{board.version}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Board Presence list */}
        {activeMembersOnBoard.length > 0 && (
          <div className="flex -space-x-1.5 items-center">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mr-2">Online</span>
            {activeMembersOnBoard.map((p) => (
              <Avatar
                key={p.userId}
                displayName={p.displayName}
                size="xs"
                className="ring-2 ring-bg-primary hover:-translate-y-0.5 transition-transform"
                status="ONLINE"
              />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="text-xs font-semibold h-8 rounded-lg border-border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all gap-1.5 active:scale-[0.98]"
          onClick={() => setArchiveOpen(true)}
        >
          <Archive className="h-3.5 w-3.5" />
          Archive
        </Button>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive Board"
        description="Are you sure you want to archive this board? Active tasks and columns will be hidden from workspace members."
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
