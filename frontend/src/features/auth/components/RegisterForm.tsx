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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="John Doe"
          {...register('displayName')}
          disabled={registerMutation.isPending}
        />
        {errors.displayName && (
          <p className="text-xs text-danger font-medium">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          disabled={registerMutation.isPending}
        />
        {errors.email && (
          <p className="text-xs text-danger font-medium">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pr-10"
            {...register('password')}
            disabled={registerMutation.isPending}
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
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          {...register('confirmPassword')}
          disabled={registerMutation.isPending}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-danger font-medium">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
        {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>

      <p className="text-center text-xs text-text-secondary pt-2">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-accent-primary hover:text-accent-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
