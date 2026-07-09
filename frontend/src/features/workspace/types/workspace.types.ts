import { WorkspaceRole } from '@/types/common.types'

export interface CreateWorkspaceRequest {
  name: string
  description?: string
}

export interface UpdateWorkspaceRequest {
  name: string
  description?: string
}

export interface InviteMemberRequest {
  email: string
  role: WorkspaceRole
}

export interface WorkspaceSummaryDto {
  id: string
  name: string
  slug: string
  description?: string
  memberCount?: number
  boardCount?: number
}
