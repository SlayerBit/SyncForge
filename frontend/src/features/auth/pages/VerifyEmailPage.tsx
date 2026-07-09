import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { authApi } from '../api/auth.api'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Verification token is missing')
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success')
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.message || 'Link has expired or is invalid')
      })
  }, [token])

  return (
    <div className="text-center space-y-6 py-6 animate-fade-in">
      {status === 'verifying' && (
        <div className="space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent-primary mx-auto" />
          <h2 className="text-lg font-semibold text-text-primary">Verifying your email...</h2>
          <p className="text-xs text-text-secondary">Please wait while we confirm your email address</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <h2 className="text-lg font-semibold text-text-primary">Email verified!</h2>
          <p className="text-xs text-text-secondary">Your account is now active. You can now log in.</p>
          <div className="pt-4">
            <Link
              to="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-accent-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent-primary-hover transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <XCircle className="h-12 w-12 text-danger mx-auto" />
          <h2 className="text-lg font-semibold text-text-primary">Verification failed</h2>
          <p className="text-xs text-danger font-medium">{errorMsg}</p>
          <p className="text-xs text-text-secondary">
            If the link has expired, you can request a new one by trying to sign in.
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-bg-secondary border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-hover transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
export default VerifyEmailPage
