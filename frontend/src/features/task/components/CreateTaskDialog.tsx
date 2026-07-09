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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTaskMutation } from '../api/task.queries'
import { toast } from 'sonner'

interface CreateTaskDialogProps {
  boardId: string
  columnId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskDialog({
  boardId,
  columnId,
  open,
  onOpenChange,
}: CreateTaskDialogProps) {
  const createTaskMutation = useCreateTaskMutation(boardId)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !columnId) return

    createTaskMutation.mutate(
      {
        columnId,
        title,
        priority,
        dueDate: dueDate || undefined,
        assigneeIds: [],
        labelIds: [],
      },
      {
        onSuccess: () => {
          toast.success('Task created successfully!')
          setTitle('')
          setPriority('MEDIUM')
          setDueDate('')
          onOpenChange(false)
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to create task')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] text-text-primary">
        <DialogHeader>
          <DialogTitle>Add Task Card</DialogTitle>
          <DialogDescription className="text-xs">
            Create a new task item under this column.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="taskTitle">Task Title</Label>
            <Input
              id="taskTitle"
              placeholder="e.g. Design Landing Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="taskPriority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="taskPriority" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="taskDue">Due Date</Label>
            <Input
              id="taskDue"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending} size="sm">
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default CreateTaskDialog
