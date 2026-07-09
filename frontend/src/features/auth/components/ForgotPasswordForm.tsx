import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForgotPasswordMutation } from '../api/auth.queries'
import { toast } from 'sonner'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [success, setSuccess] = React.useState(false)
  const forgotPasswordMutation = useForgotPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data.email, {
      onSuccess: () => {
        setSuccess(true)
        toast.success('If an account exists, we have sent a reset link.')
      },
      onError: (err: any) => {
        // Prevent enumeration: always show success in UI but log error
        setSuccess(true)
      },
    })
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4 animate-fade-in">
        <p className="text-sm text-text-secondary">
          An email has been sent to the address provided with instructions to reset your password.
        </p>
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          disabled={forgotPasswordMutation.isPending}
        />
        {errors.email && (
          <p className="text-xs text-danger font-medium">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={forgotPasswordMutation.isPending}>
        {forgotPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Reset Link
      </Button>

      <p className="text-center text-xs text-text-secondary pt-2">
        <Link
          to="/login"
          className="font-semibold text-accent-primary hover:text-accent-primary-hover"
        >
          Back to Sign In
        </Link>
      </p>
    </form>
  )
}
