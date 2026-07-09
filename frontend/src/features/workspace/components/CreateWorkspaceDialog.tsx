import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useCreateWorkspaceMutation } from '../api/workspace.queries'
import { toast } from 'sonner'

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
})

type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const createMutation = useCreateWorkspaceMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
  })

  const onSubmit = (data: CreateWorkspaceFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Workspace created successfully!')
        reset()
        onOpenChange(false)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to create workspace')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) reset()
      onOpenChange(v)
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription className="text-xs">
            Workspaces host your boards, tasks, and team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              placeholder="e.g. Acme Marketing, Project Orion"
              {...register('name')}
              disabled={createMutation.isPending}
            />
            {errors.name && (
              <p className="text-xs text-danger font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What this workspace is about..."
              className="resize-none h-24"
              {...register('description')}
              disabled={createMutation.isPending}
            />
            {errors.description && (
              <p className="text-xs text-danger font-medium">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} size="sm">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
