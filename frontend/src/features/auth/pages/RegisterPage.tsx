import React from 'react'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Create Account</h1>
        <p className="text-xs text-text-secondary">
          Enter your details below to create your SyncForge account
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
export default RegisterPage
