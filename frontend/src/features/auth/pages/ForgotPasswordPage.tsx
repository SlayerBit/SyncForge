import React from 'react'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Reset Password</h1>
        <p className="text-xs text-text-secondary">
          Enter your email and we'll send you a password reset link
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}
export default ForgotPasswordPage
