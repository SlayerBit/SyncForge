import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { CommentDto } from '@/types/common.types'

export const commentApi = {
  list: async (taskId: string) => {
    const res = await apiClient.get<ApiResponse<{ content: CommentDto[] }>>(`/tasks/${taskId}/comments`)
    return res.data.data.content
  },

  create: async (taskId: string, content: string) => {
    const res = await apiClient.post<ApiResponse<CommentDto>>(`/tasks/${taskId}/comments`, { content })
    return res.data.data
  },

  update: async (commentId: string, content: string) => {
    const res = await apiClient.patch<ApiResponse<CommentDto>>(`/comments/${commentId}`, { content })
    return res.data.data
  },

  delete: async (commentId: string) => {
    await apiClient.delete(`/comments/${commentId}`)
  },
}
export default commentApi
