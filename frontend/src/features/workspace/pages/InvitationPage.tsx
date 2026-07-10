import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { useAcceptInvitationMutation } from '../api/workspace.queries'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function InvitationPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const acceptMutation = useAcceptInvitationMutation()

  const handleAccept = () => {
    if (!token) return

    acceptMutation.mutate(token, {
      onSuccess: () => {
        toast.success('Joined workspace successfully!')
        navigate('/')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to accept invitation. Link may be expired or invalid.')
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12 text-text-primary select-none">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border-default bg-bg-secondary/45 p-8 text-center shadow-xl animate-fade-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary-subtle border border-accent-primary/20 text-accent-primary">
          <Mail className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">Workspace Invitation</h1>
          <p className="text-xs text-text-secondary">
            You have been invited to collaborate on a SyncForge workspace.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleAccept}
            className="w-full h-11.5 gap-2 font-bold tracking-wider uppercase bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] hover:from-[#334155] hover:to-[#0f172a] text-white border-t border-slate-700/60 shadow-[0_4px_16px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none rounded-[12px] hover:-translate-y-0.5"
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining Workspace...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Accept Invitation
              </>
            )}
          </Button>
        </div>

        <p className="text-[10px] text-text-tertiary">
          By accepting, you will gain access to the workspace's boards and shared tasks.
        </p>
      </div>
    </div>
  )
}
export default InvitationPage
