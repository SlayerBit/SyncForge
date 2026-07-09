import { useMutation } from '@tanstack/react-query'
import { authApi } from './auth.api'
import { useAuthStore } from '@/stores/auth.store'

export function useLoginMutation() {
  const setAuth = useAuthStore((state) => state.setAuth)
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user)
    },
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authApi.register,
  })
}

export function useLogoutMutation() {
  const { refreshToken, clearAuth } = useAuthStore.getState()
  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken)
        } catch (e) {
          // ignore logout errors to ensure client cleanup runs
        }
      }
    },
    onSuccess: () => {
      clearAuth()
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  })
}
