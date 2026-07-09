import React, { useState } from 'react'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { boardApi } from '../api/board.api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ColumnDto } from '@/types/common.types'

interface ColumnSettingsMenuProps {
  boardId: string
  column: ColumnDto
}

export function ColumnSettingsMenu({ boardId, column }: ColumnSettingsMenuProps) {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [name, setName] = useState(column.name)
  const [taskLimit, setTaskLimit] = useState(column.taskLimit?.toString() || '')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const parsedLimit = taskLimit.trim() ? parseInt(taskLimit, 10) : null
      await boardApi.updateColumn(column.id, { name, taskLimit: parsedLimit })
      toast.success('Column updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
      setEditOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update column')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await boardApi.deleteColumn(column.id)
      toast.success('Column deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
      setDeleteOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete column')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-text-tertiary">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-xs">
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
            <Edit className="h-3.5 w-3.5" />
            Edit Column
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-danger hover:text-danger hover:bg-danger-subtle">
            <Trash2 className="h-3.5 w-3.5" />
            Delete Column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Column Settings</DialogTitle>
            <DialogDescription className="text-xs">
              Update column name and work-in-progress (WIP) limit.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="editName">Column Name</Label>
              <Input
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editLimit">WIP Limit</Label>
              <Input
                id="editLimit"
                type="number"
                min="1"
                placeholder="Leave empty for no limit"
                value={taskLimit}
                onChange={(e) => setTaskLimit(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} size="sm">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Column"
        description={`Are you sure you want to delete the column "${column.name}"? Columns containing active tasks cannot be deleted. Ensure all tasks are moved or archived before deleting. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={loading}
      />
    </>
  )
}
export default ColumnSettingsMenu
