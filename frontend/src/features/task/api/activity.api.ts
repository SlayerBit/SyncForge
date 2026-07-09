import { apiClient } from '@/lib/api-client'
import { ApiResponse, CursorResponse } from '@/types/api.types'

export interface ActivityLogDto {
  id: string
  action: string
  details: string
  actorDisplayName: string
  createdAt: string
}

export const activityApi = {
  listTaskActivity: async (taskId: string, cursor?: string, size = 50) => {
    const queryParams = new URLSearchParams()
    if (cursor) queryParams.append('cursor', cursor)
    queryParams.append('size', size.toString())

    const res = await apiClient.get<ApiResponse<CursorResponse<ActivityLogDto>>>(
      `/tasks/${taskId}/activity?${queryParams.toString()}`
    )
    return res.data.data
  },
}
export default activityApi
