import { User } from '@/stores/auth.store'

export interface LoginResponseData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface RegisterResponseData {
  userId: string
  email: string
  displayName: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
}

export interface VerifyEmailResponseData {
  message: string
}
