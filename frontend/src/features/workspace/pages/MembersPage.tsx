import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Mail, RefreshCw } from 'lucide-react'
import {
  useWorkspaceQuery,
  useWorkspaceMembersQuery,
  useWorkspaceInvitationsQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useRevokeInvitationMutation,
} from '../api/workspace.queries'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/shared/Avatar'
import { InviteMemberDialog } from '../components/InviteMemberDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { WorkspaceRole } from '@/types/common.types'

export function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { data: workspace, isLoading: loadingWorkspace } = useWorkspaceQuery(workspaceId!)
  const { data: members, isLoading: loadingMembers } = useWorkspaceMembersQuery(workspaceId!)
  const { data: invitations, isLoading: loadingInvites } = useWorkspaceInvitationsQuery(workspaceId!)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null)

  const updateRoleMutation = useUpdateMemberRoleMutation(workspaceId!)
  const removeMemberMutation = useRemoveMemberMutation(workspaceId!)
  const revokeInviteMutation = useRevokeInvitationMutation(workspaceId!)

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate(
      { userId, role: newRole },
      {
        onSuccess: () => {
          toast.success('Member role updated successfully!')
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to update member role')
        },
      }
    )
  }

  const handleRemoveMember = () => {
    if (!selectedUserId) return
    removeMemberMutation.mutate(selectedUserId, {
      onSuccess: () => {
        toast.success('Member removed successfully!')
        setSelectedUserId(null)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to remove member')
        setSelectedUserId(null)
      },
    })
  }

  const handleRevokeInvitation = () => {
    if (!selectedInviteId) return
    revokeInviteMutation.mutate(selectedInviteId, {
      onSuccess: () => {
        toast.success('Invitation revoked successfully!')
        setSelectedInviteId(null)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to revoke invitation')
        setSelectedInviteId(null)
      },
    })
  }

  if (loadingWorkspace || loadingMembers || loadingInvites) {
    return <div className="p-8 text-text-secondary">Loading members directory...</div>
  }

  if (!workspace) {
    return <div className="p-8 text-danger text-center">Workspace not found</div>
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto animate-fade-in text-text-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <Link to={`/workspaces/${workspaceId}`} className="text-xs font-semibold text-accent-primary flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" />
            Back to Workspace
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Members & Collaborators</h1>
          <p className="text-xs text-text-secondary">
            Manage who has access to {workspace.name} and their role levels.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} size="sm" className="text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Invite Member
        </Button>
      </div>

      {/* Members Directory */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Workspace Members ({members?.length || 0})</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members?.map((member) => {
            const isOwner = member.role === 'OWNER'
            return (
              <div 
                key={member.userId} 
                className="group relative rounded-2xl border border-border/60 bg-bg-secondary/40 p-4.5 hover:border-accent-primary/45 hover:bg-bg-secondary/80 hover:shadow-md transition-all select-none flex flex-col justify-between h-[145px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <Avatar displayName={member.displayName} size="md" status="ONLINE" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-text-primary leading-tight truncate">{member.displayName}</p>
                      <p className="text-[10px] text-text-tertiary truncate leading-none mt-1">{member.email}</p>
                    </div>
                  </div>

                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedUserId(member.userId)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4.5 pt-3 border-t border-border/40">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Role Level</span>
                  {isOwner ? (
                    <span className="text-[9px] font-extrabold text-accent-primary bg-accent-primary-subtle border border-accent-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Owner
                    </span>
                  ) : (
                    <Select
                      defaultValue={member.role}
                      onValueChange={(val) => handleRoleChange(member.userId, val)}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-[110px] h-7 text-[10px] bg-bg-primary rounded-lg border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-sm font-semibold text-text-secondary">Pending Invitations ({invitations?.length || 0})</h2>
        {!invitations || invitations.length === 0 ? (
          <p className="text-xs text-text-tertiary italic">No pending invitations.</p>
        ) : (
          <div className="rounded-lg border border-border bg-bg-secondary overflow-hidden">
            <div className="divide-y divide-border">
              {invitations.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-bg-tertiary text-text-secondary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{invite.email}</p>
                      <p className="text-[10px] text-text-secondary">
                        Role: {invite.role} • Invited on {new Date(invite.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-danger hover:text-white"
                    onClick={() => setSelectedInviteId(invite.id)}
                    disabled={revokeInviteMutation.isPending}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <InviteMemberDialog workspaceId={workspaceId!} open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={!!selectedUserId}
        title="Remove Member"
        description="Are you sure you want to remove this member from the workspace? They will lose access to all boards and tasks."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemoveMember}
        onCancel={() => setSelectedUserId(null)}
        loading={removeMemberMutation.isPending}
      />

      <ConfirmDialog
        open={!!selectedInviteId}
        title="Revoke Invitation"
        description="Are you sure you want to revoke this pending invitation? The recipient will not be able to join using their link."
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={handleRevokeInvitation}
        onCancel={() => setSelectedInviteId(null)}
        loading={revokeInviteMutation.isPending}
      />
    </div>
  )
}
export default MembersPage
