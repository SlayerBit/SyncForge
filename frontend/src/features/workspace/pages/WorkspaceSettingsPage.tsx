import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkspaceQuery, useUpdateWorkspaceMutation, useDeleteWorkspaceMutation, useWorkspaceMembersQuery, useTransferOwnershipMutation } from '../api/workspace.queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { data: workspace, isLoading: loadingWorkspace } = useWorkspaceQuery(workspaceId!)
  const { data: members } = useWorkspaceMembersQuery(workspaceId!)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [transferOwnerId, setTransferOwnerId] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const updateMutation = useUpdateWorkspaceMutation(workspaceId!)
  const deleteMutation = useDeleteWorkspaceMutation()
  const transferMutation = useTransferOwnershipMutation(workspaceId!)

  // Populate data when loaded
  React.useEffect(() => {
    if (workspace) {
      setName(workspace.name)
      setDescription(workspace.description || '')
    }
  }, [workspace])

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    updateMutation.mutate(
      { name, description },
      {
        onSuccess: () => {
          toast.success('Workspace updated successfully!')
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to update workspace')
        },
      }
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(workspaceId!, {
      onSuccess: () => {
        toast.success('Workspace deleted successfully!')
        navigate('/')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to delete workspace')
        setDeleteOpen(false)
      },
    })
  }

  const handleTransfer = () => {
    if (!transferOwnerId) return
    transferMutation.mutate(transferOwnerId, {
      onSuccess: () => {
        toast.success('Ownership transferred successfully!')
        setTransferOpen(false)
        navigate(`/workspaces/${workspaceId}`)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to transfer ownership')
        setTransferOpen(false)
      },
    })
  }

  if (loadingWorkspace) {
    return <div className="p-8 text-text-secondary">Loading settings...</div>
  }

  if (!workspace) {
    return <div className="p-8 text-danger text-center">Workspace not found</div>
  }

  return (
    <div className="space-y-8 p-6 max-w-2xl mx-auto animate-fade-in text-text-primary">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage name, description, and admin roles.
        </p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4 rounded-lg border border-border bg-bg-secondary p-6 shadow-sm">
        <div className="space-y-1">
          <Label htmlFor="name">Workspace Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none h-24" />
        </div>

        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>

      {/* Danger Zone */}
      <div className="space-y-4 rounded-lg border border-danger/30 bg-bg-secondary p-6">
        <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
        <p className="text-xs text-text-secondary">
          Perform destructive operations on the workspace. These actions cannot be undone.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border">
          <div>
            <h3 className="text-xs font-semibold text-text-primary">Transfer Ownership</h3>
            <p className="text-[11px] text-text-secondary">Appoint another workspace member as the owner.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
            Transfer Ownership
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border">
          <div>
            <h3 className="text-xs font-semibold text-danger">Delete Workspace</h3>
            <p className="text-[11px] text-text-secondary">Permanently delete this workspace and all of its boards/tasks.</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete Workspace
          </Button>
        </div>
      </div>

      {/* Transfer Ownership Dialog */}
      <ConfirmDialog
        open={transferOpen}
        title="Transfer Ownership"
        description="Choose a member to transfer ownership of the workspace. You will lose owner permissions."
        confirmLabel="Transfer"
        variant="destructive"
        onConfirm={handleTransfer}
        onCancel={() => setTransferOpen(false)}
        loading={transferMutation.isPending}
      >
        <div className="py-4">
          <Label htmlFor="newOwner">Select New Owner</Label>
          <Select onValueChange={setTransferOwnerId}>
            <SelectTrigger id="newOwner" className="mt-1">
              <SelectValue placeholder="Choose a member" />
            </SelectTrigger>
            <SelectContent>
              {members?.filter(m => m.role !== 'OWNER').map((m) => (
                <SelectItem key={m.userId} value={m.userId}>
                  {m.displayName} ({m.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ConfirmDialog>

      {/* Delete Workspace Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Workspace"
        description={`Are you sure you want to delete ${workspace.name}? This will remove all associated boards, tasks, and members. This action is irreversible.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
export default WorkspaceSettingsPage
