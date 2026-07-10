import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegisterMutation } from '../api/auth.queries'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const passwordVal = watch('password')

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      {
        displayName: data.displayName,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          toast.success('Registration successful! Please check your email.')
          navigate('/login')
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || 'Email already exists'
          toast.error(msg)
        },
      }
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
      className="space-y-6 text-text-primary"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Create your account</h2>
        <p className="text-xs text-text-secondary">
          Get started with SyncForge team collaboration.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
            Display name
          </Label>
          <Input
            id="displayName"
            type="text"
            placeholder="John Doe"
            {...register('displayName')}
            disabled={registerMutation.isPending}
            className="h-9 text-xs focus:ring-1 focus:ring-accent-primary"
          />
          {errors.displayName && (
            <p className="text-[10px] text-danger font-semibold mt-1">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            {...register('email')}
            disabled={registerMutation.isPending}
            className="h-9 text-xs focus:ring-1 focus:ring-accent-primary"
          />
          {errors.email && (
            <p className="text-[10px] text-danger font-semibold mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10 h-9 text-xs focus:ring-1 focus:ring-accent-primary"
              {...register('password')}
              disabled={registerMutation.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={passwordVal} />
          {errors.password && (
            <p className="text-[10px] text-danger font-semibold mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={registerMutation.isPending}
            className="h-9 text-xs focus:ring-1 focus:ring-accent-primary"
          />
          {errors.confirmPassword && (
            <p className="text-[10px] text-danger font-semibold mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11.5 mt-4 text-[11px] font-bold tracking-wider uppercase bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] hover:from-[#334155] hover:to-[#0f172a] text-white border-t border-slate-700/60 shadow-[0_4px_16px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none rounded-[12px] hover:-translate-y-0.5"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
          ) : (
            'Create Account'
          )}
        </Button>

        <p className="text-center text-xs text-text-secondary pt-2">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-accent-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </motion.div>
  )
}
export default RegisterForm
