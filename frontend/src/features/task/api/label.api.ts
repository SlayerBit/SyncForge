import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { LabelDto } from '@/types/common.types'

export const labelApi = {
  list: async (workspaceId: string) => {
    const res = await apiClient.get<ApiResponse<LabelDto[]>>(`/workspaces/${workspaceId}/labels`)
    return res.data.data
  },

  create: async (workspaceId: string, name: string, color: string) => {
    const res = await apiClient.post<ApiResponse<LabelDto>>(`/workspaces/${workspaceId}/labels`, { name, color })
    return res.data.data
  },

  delete: async (labelId: string) => {
    await apiClient.delete(`/labels/${labelId}`)
  },
}
export default labelApi
