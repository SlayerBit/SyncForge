import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from './workspace.api'
import { CreateWorkspaceRequest, UpdateWorkspaceRequest, InviteMemberRequest } from '../types/workspace.types'

const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspaces', id] as const,
  members: (workspaceId: string) => ['workspaces', workspaceId, 'members'] as const,
  invitations: (workspaceId: string) => ['workspaces', workspaceId, 'invitations'] as const,
}

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: workspaceApi.list,
  })
}

export function useWorkspaceQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => workspaceApi.get(id),
    enabled: !!id,
  })
}

export function useWorkspaceMembersQuery(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.members(workspaceId),
    queryFn: () => workspaceApi.listMembers(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useWorkspaceInvitationsQuery(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.invitations(workspaceId),
    queryFn: () => workspaceApi.listInvitations(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })
}

export function useUpdateWorkspaceMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateWorkspaceRequest) => workspaceApi.update(workspaceId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.workspace(workspaceId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: workspaceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })
}

export function useInviteMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InviteMemberRequest) => workspaceApi.invite(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations(workspaceId) })
    },
  })
}

export function useRevokeInvitationMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => workspaceApi.revokeInvitation(workspaceId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations(workspaceId) })
    },
  })
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: workspaceApi.acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })
}

export function useUpdateMemberRoleMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      workspaceApi.updateMemberRole(workspaceId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(workspaceId) })
    },
  })
}

export function useRemoveMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => workspaceApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(workspaceId) })
    },
  })
}

export function useTransferOwnershipMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (newOwnerId: string) => workspaceApi.transferOwnership(workspaceId, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.members(workspaceId) })
    },
  })
}
