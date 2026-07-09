import React from 'react'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Sign In</h1>
        <p className="text-xs text-text-secondary">
          Enter your details to log in to your SyncForge workspace
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
export default LoginPage
