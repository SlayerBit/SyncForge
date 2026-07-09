export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'

export interface LabelDto {
  id: string
  name: string
  color: string
}

export interface UserSummaryDto {
  id: string
  displayName: string
  email: string
  avatarUrl?: string
}

export interface TaskDto {
  id: string
  identifier: string
  title: string
  description?: string
  priority: Priority
  status: TaskStatus
  columnId: string
  position: string
  dueDate?: string
  assignees: UserSummaryDto[]
  labels: LabelDto[]
  commentCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export interface ColumnDto {
  id: string
  name: string
  position: string
  taskLimit?: number | null
  tasks: TaskDto[]
}

export interface BoardDto {
  id: string
  name: string
  description?: string
  workspaceId: string
  archived: boolean
  version: number
  columns: ColumnDto[]
}

export interface WorkspaceDto {
  id: string
  name: string
  slug: string
  description?: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMemberDto {
  id: string
  userId: string
  displayName: string
  email: string
  avatarUrl?: string
  role: WorkspaceRole
  joinedAt: string
}

export interface WorkspaceInvitationDto {
  id: string
  email: string
  role: WorkspaceRole
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  expiresAt: string
}

export interface ActivityLogDto {
  id: string
  workspaceId: string
  actor: UserSummaryDto
  entityType: string
  entityId: string
  action: string
  changes?: Record<string, any>
  createdAt: string
}

export interface CommentDto {
  id: string
  taskId: string
  author: UserSummaryDto
  content: string
  deleted: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface NotificationDto {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  referenceType?: string
  referenceId?: string
  createdAt: string
}
