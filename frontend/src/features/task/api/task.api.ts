import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { TaskDto } from '@/types/common.types'

export const taskApi = {
  create: async (columnId: string, data: {
    title: string
    description?: string
    priority: string
    dueDate?: string
    assigneeIds?: string[]
    labelIds?: string[]
  }) => {
    const res = await apiClient.post<ApiResponse<TaskDto>>(`/columns/${columnId}/tasks`, data)
    return res.data.data
  },

  get: async (taskId: string) => {
    const res = await apiClient.get<ApiResponse<TaskDto>>(`/tasks/${taskId}`)
    return res.data.data
  },

  update: async (taskId: string, data: {
    title?: string
    description?: string
    priority?: string
    dueDate?: string | null
    version: number
  }) => {
    const res = await apiClient.patch<ApiResponse<TaskDto>>(`/tasks/${taskId}`, data)
    return res.data.data
  },

  move: async (taskId: string, data: {
    targetColumnId: string
    afterTaskId: string | null
    version: number
  }) => {
    const res = await apiClient.post<ApiResponse<TaskDto>>(`/tasks/${taskId}/move`, data)
    return res.data.data
  },

  archive: async (taskId: string) => {
    await apiClient.post(`/tasks/${taskId}/archive`)
  },

  assign: async (taskId: string, userId: string) => {
    await apiClient.post(`/tasks/${taskId}/assign`, { userId })
  },

  unassign: async (taskId: string, userId: string) => {
    await apiClient.delete(`/tasks/${taskId}/assignees/${userId}`)
  },

  addLabel: async (taskId: string, labelId: string) => {
    await apiClient.post(`/tasks/${taskId}/labels/${labelId}`)
  },

  removeLabel: async (taskId: string, labelId: string) => {
    await apiClient.delete(`/tasks/${taskId}/labels/${labelId}`)
  },
}
