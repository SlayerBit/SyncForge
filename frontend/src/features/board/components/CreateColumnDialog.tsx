import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { boardApi } from '../api/board.api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface CreateColumnDialogProps {
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateColumnDialog({ boardId, open, onOpenChange }: CreateColumnDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [taskLimit, setTaskLimit] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const parsedLimit = taskLimit.trim() ? parseInt(taskLimit, 10) : null
      await boardApi.addColumn(boardId, { name, taskLimit: parsedLimit })
      toast.success('Column added successfully!')
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
      setName('')
      setTaskLimit('')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add column')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
          <DialogDescription className="text-xs">
            Create a new workflow column on this board.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="colName">Column Name</Label>
            <Input
              id="colName"
              placeholder="e.g. In Progress, Done"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="colLimit">WIP Limit (Optional)</Label>
            <Input
              id="colLimit"
              type="number"
              min="1"
              placeholder="e.g. 5 (Leave empty for no limit)"
              value={taskLimit}
              onChange={(e) => setTaskLimit(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? 'Adding...' : 'Add Column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default CreateColumnDialog
