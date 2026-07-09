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
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12 text-text-primary dark">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-bg-secondary p-8 text-center shadow-lg animate-fade-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary-subtle text-accent-primary">
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
            className="w-full gap-2 font-semibold"
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
