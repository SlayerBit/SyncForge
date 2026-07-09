import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { WorkspaceDto, WorkspaceMemberDto, WorkspaceInvitationDto } from '@/types/common.types'
import { CreateWorkspaceRequest, UpdateWorkspaceRequest, InviteMemberRequest } from '../types/workspace.types'

export const workspaceApi = {
  create: async (data: CreateWorkspaceRequest) => {
    const res = await apiClient.post<ApiResponse<WorkspaceDto>>('/workspaces', data)
    return res.data.data
  },

  list: async () => {
    const res = await apiClient.get<ApiResponse<WorkspaceDto[]>>('/workspaces')
    return res.data.data
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<WorkspaceDto>>(`/workspaces/${id}`)
    return res.data.data
  },

  update: async (id: string, data: UpdateWorkspaceRequest) => {
    const res = await apiClient.patch<ApiResponse<WorkspaceDto>>(`/workspaces/${id}`, data)
    return res.data.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/workspaces/${id}`)
  },

  listMembers: async (id: string) => {
    const res = await apiClient.get<ApiResponse<WorkspaceMemberDto[]>>(`/workspaces/${id}/members`)
    return res.data.data
  },

  removeMember: async (workspaceId: string, userId: string) => {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`)
  },

  updateMemberRole: async (workspaceId: string, userId: string, role: string) => {
    await apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role })
  },

  listInvitations: async (workspaceId: string) => {
    const res = await apiClient.get<ApiResponse<WorkspaceInvitationDto[]>>(`/workspaces/${workspaceId}/invitations`)
    return res.data.data
  },

  invite: async (workspaceId: string, data: InviteMemberRequest) => {
    const res = await apiClient.post<ApiResponse<WorkspaceInvitationDto>>(`/workspaces/${workspaceId}/invitations`, data)
    return res.data.data
  },

  acceptInvitation: async (token: string) => {
    await apiClient.post(`/invitations/${token}/accept`)
  },

  revokeInvitation: async (workspaceId: string, invitationId: string) => {
    await apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`)
  },

  transferOwnership: async (workspaceId: string, newOwnerId: string) => {
    await apiClient.post(`/workspaces/${workspaceId}/transfer-ownership`, { newOwnerId })
  },
}
