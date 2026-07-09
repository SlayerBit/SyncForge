import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { BoardDto, ColumnDto } from '@/types/common.types'

export const boardApi = {
  listWorkspaceBoards: async (workspaceId: string, includeArchived = false) => {
    const res = await apiClient.get<ApiResponse<BoardDto[]>>(
      `/workspaces/${workspaceId}/boards?includeArchived=${includeArchived}`
    )
    return res.data.data
  },

  createBoard: async (workspaceId: string, data: { name: string; description?: string }) => {
    const res = await apiClient.post<ApiResponse<BoardDto>>(`/workspaces/${workspaceId}/boards`, data)
    return res.data.data
  },

  getBoard: async (boardId: string) => {
    const res = await apiClient.get<ApiResponse<BoardDto>>(`/boards/${boardId}`)
    return res.data.data
  },

  updateBoard: async (boardId: string, data: { name: string; version: number }) => {
    const res = await apiClient.patch<ApiResponse<BoardDto>>(`/boards/${boardId}`, data)
    return res.data.data
  },

  archiveBoard: async (boardId: string) => {
    await apiClient.post(`/boards/${boardId}/archive`)
  },

  addColumn: async (boardId: string, data: { name: string; taskLimit?: number | null }) => {
    const res = await apiClient.post<ApiResponse<ColumnDto>>(`/boards/${boardId}/columns`, data)
    return res.data.data
  },

  updateColumn: async (columnId: string, data: { name: string; taskLimit?: number | null }) => {
    const res = await apiClient.patch<ApiResponse<ColumnDto>>(`/columns/${columnId}`, data)
    return res.data.data
  },

  deleteColumn: async (columnId: string) => {
    await apiClient.delete(`/columns/${columnId}`)
  },

  reorderColumn: async (columnId: string, data: { afterColumnId: string | null }) => {
    await apiClient.patch(`/columns/${columnId}/reorder`, data)
  },
}
