import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResetPasswordMutation } from '../api/auth.queries'
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator'
import { toast } from 'sonner'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const resetPasswordMutation = useResetPasswordMutation()
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const passwordVal = watch('password')

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Reset token is missing or invalid')
      return
    }

    resetPasswordMutation.mutate(
      {
        token,
        newPassword: data.password,
      },
      {
        onSuccess: () => {
          toast.success('Password reset successful! Please sign in.')
          navigate('/login')
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || 'Failed to reset password. Token might be expired.'
          toast.error(msg)
        },
      }
    )
  }

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4 animate-fade-in">
        <p className="text-sm text-danger font-medium">Invalid or missing reset token.</p>
        <Link
          to="/login"
          className="inline-block text-sm font-semibold text-accent-primary hover:text-accent-primary-hover"
        >
          Return to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Set New Password</h1>
        <p className="text-xs text-text-secondary">
          Choose a new password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10"
              {...register('password')}
              disabled={resetPasswordMutation.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-secondary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={passwordVal} />
          {errors.password && (
            <p className="text-xs text-danger font-medium">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={resetPasswordMutation.isPending}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-danger font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={resetPasswordMutation.isPending}>
          {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
        </Button>
      </form>
    </div>
  )
}
export default ResetPasswordPage
