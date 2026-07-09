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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInviteMemberMutation } from '../api/workspace.queries'
import { WorkspaceRole } from '@/types/common.types'
import { toast } from 'sonner'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteMemberDialogProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ workspaceId, open, onOpenChange }: InviteMemberDialogProps) {
  const inviteMutation = useInviteMemberMutation(workspaceId)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'MEMBER',
    },
  })

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(
      {
        email: data.email,
        role: data.role as WorkspaceRole,
      },
      {
        onSuccess: () => {
          toast.success('Invitation sent successfully!')
          reset()
          onOpenChange(false)
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to send invitation')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) reset()
      onOpenChange(v)
    }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription className="text-xs">
            Send an invitation link to invite someone to this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="collaborator@example.com"
              {...register('email')}
              disabled={inviteMutation.isPending}
            />
            {errors.email && (
              <p className="text-xs text-danger font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="role">Workspace Role</Label>
            <Select
              disabled={inviteMutation.isPending}
              onValueChange={(val) => setValue('role', val as any)}
              defaultValue="MEMBER"
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin (Manage members & settings)</SelectItem>
                <SelectItem value="MEMBER">Member (Create & edit boards/tasks)</SelectItem>
                <SelectItem value="VIEWER">Viewer (Read-only access)</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-danger font-medium">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={inviteMutation.isPending}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending} size="sm">
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
