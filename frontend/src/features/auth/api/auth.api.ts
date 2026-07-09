import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { LoginResponseData, RegisterResponseData, VerifyEmailResponseData } from '../types/auth.types'

export const authApi = {
  register: async (data: Record<string, string>) => {
    const res = await apiClient.post<ApiResponse<RegisterResponseData>>('/auth/register', data)
    return res.data.data
  },

  login: async (data: Record<string, string>) => {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', data)
    return res.data.data
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refreshToken })
  },

  logoutAll: async () => {
    await apiClient.post('/auth/logout-all')
  },

  verifyEmail: async (token: string) => {
    const res = await apiClient.get<ApiResponse<VerifyEmailResponseData>>(`/auth/verify-email?token=${token}`)
    return res.data.data
  },

  resendVerification: async (email: string) => {
    await apiClient.post('/auth/resend-verification', { email })
  },

  forgotPassword: async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email })
  },

  resetPassword: async (data: Record<string, string>) => {
    await apiClient.post('/auth/reset-password', data)
  },
}
