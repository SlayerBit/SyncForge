import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '../api/auth.queries'
import { authApi } from '../api/auth.api'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showResend, setShowResend] = React.useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = React.useState('')
  const [resending, setResending] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Successfully logged in!')
        navigate('/')
      },
      onError: (err: any) => {
        const errorData = err.response?.data
        const msg = errorData?.message || 'Invalid credentials'
        toast.error(msg)
        
        if (errorData?.error === 'EMAIL_UNVERIFIED') {
          setShowResend(true)
          setUnverifiedEmail(data.email)
        } else {
          setShowResend(false)
        }
      },
    })
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return
    setResending(true)
    try {
      await authApi.resendVerification(unverifiedEmail)
      toast.success('Verification email sent! Please check your inbox.')
      setShowResend(false)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend verification email'
      toast.error(msg)
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          disabled={loginMutation.isPending}
        />
        {errors.email && (
          <p className="text-xs text-danger font-medium">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-accent-primary hover:text-accent-primary-hover"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pr-10"
            {...register('password')}
            disabled={loginMutation.isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-secondary"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-danger font-medium">{errors.password.message}</p>
        )}
      </div>

      {showResend && (
        <div className="p-3.5 rounded-lg border border-warning/30 bg-warning/5 text-xs text-text-primary space-y-2">
          <p className="text-text-secondary leading-normal">
            Your email is not verified yet. Please check your inbox or request a new verification link.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full h-8 text-xs font-semibold"
            onClick={handleResendVerification}
            disabled={resending}
          >
            {resending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Resend Verification Link
          </Button>
        </div>
      )}

      <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
        {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>

      <p className="text-center text-xs text-text-secondary pt-2">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-accent-primary hover:text-accent-primary-hover"
        >
          Sign up
        </Link>
      </p>
    </form>
  )
}
