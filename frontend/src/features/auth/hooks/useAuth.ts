import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'
import { User } from '@/stores/auth.store'

async function fetchMe(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>('/users/me')
  return res.data.data
}

export function useAuth() {
  const { accessToken, user, updateUser, clearAuth } = useAuthStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    retry: false,
  })

  // Sync profile data to Zustand store if it changes
  if (profile && (!user || user.displayName !== profile.displayName || user.avatarUrl !== profile.avatarUrl)) {
    // defer update to avoid React render updates warning
    setTimeout(() => updateUser(profile), 0)
  }

  return {
    isAuthenticated: !!accessToken,
    user: profile || user,
    isLoading: !!accessToken && isLoading,
    logout: clearAuth,
  }
}
