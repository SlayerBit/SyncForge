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
import { motion } from 'framer-motion'

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
      className="space-y-6 text-text-primary"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-xs text-text-secondary">
          Enter your workspace details below to sign in.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            {...register('email')}
            disabled={loginMutation.isPending}
            className="h-9 text-xs focus:ring-1 focus:ring-accent-primary"
          />
          {errors.email && (
            <p className="text-[10px] text-danger font-semibold mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-[10px] font-bold text-accent-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10 h-9 text-xs focus:ring-1 focus:ring-accent-primary"
              {...register('password')}
              disabled={loginMutation.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-secondary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[10px] text-danger font-semibold mt-1">{errors.password.message}</p>
          )}
        </div>

        {showResend && (
          <div className="p-3.5 rounded-xl border border-warning/35 bg-warning/5 text-xs text-text-primary space-y-2">
            <p className="text-text-secondary leading-relaxed">
              Your email is not verified yet. Please check your inbox or request a new verification link.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full h-8.5 text-xs font-semibold"
              onClick={handleResendVerification}
              disabled={resending}
            >
              {resending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Resend Verification Link
            </Button>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11.5 mt-4 text-[11px] font-bold tracking-wider uppercase bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] hover:from-[#334155] hover:to-[#0f172a] text-white border-t border-slate-700/60 shadow-[0_4px_16px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none rounded-[12px] hover:-translate-y-0.5"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
          ) : (
            'Sign In'
          )}
        </Button>

        <p className="text-center text-xs text-text-secondary pt-2">
          New to SyncForge?{' '}
          <Link
            to="/register"
            className="font-bold text-accent-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </motion.div>
  )
}
export default LoginForm
