import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { NotificationDto } from '@/types/common.types'
import { CursorResponse } from '@/types/api.types'

export const notificationApi = {
  list: async (cursor?: string, size = 50) => {
    const queryParams = new URLSearchParams()
    if (cursor) queryParams.append('cursor', cursor)
    queryParams.append('size', size.toString())
    
    const res = await apiClient.get<ApiResponse<CursorResponse<NotificationDto>>>(
      `/notifications?${queryParams.toString()}`
    )
    return res.data.data
  },

  getUnreadCount: async () => {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count')
    return res.data.data.unreadCount
  },

  markRead: async (id: string) => {
    await apiClient.post(`/notifications/${id}/read`)
  },

  markAllRead: async () => {
    await apiClient.post('/notifications/read-all')
  },

  delete: async (id: string) => {
    await apiClient.delete(`/notifications/${id}`)
  },
}
export default notificationApi
