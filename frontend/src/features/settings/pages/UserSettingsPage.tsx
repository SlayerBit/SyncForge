import React, { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useMutation } from '@tanstack/react-query'
import { User, Settings, AlertTriangle, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { apiClient } from '@/lib/api-client'

export function UserSettingsPage() {
  const navigate = useNavigate()
  const { user, updateUser, clearAuth } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.emailNotifications ?? true)
  const [loading, setLoading] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string }) => {
      const res = await apiClient.patch('/users/me', data)
      return res.data.data
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success('Profile updated successfully!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    },
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { theme: 'light' | 'dark'; emailNotifications: boolean }) => {
      const res = await apiClient.patch('/users/me/preferences', data)
      return res.data.data
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success('Preferences updated successfully!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update preferences')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/users/me/deactivate')
    },
    onSuccess: () => {
      toast.success('Account deactivated. Goodbye!')
      clearAuth()
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate account')
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return
    updateProfileMutation.mutate({ displayName })
  }

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updatePreferencesMutation.mutate({
      theme,
      emailNotifications,
    })
  }

  return (
    <div className="max-w-[800px] mx-auto py-8 px-4 space-y-8 text-text-primary">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="h-8 w-8 bg-accent-primary-subtle rounded-md flex items-center justify-center text-accent-primary">
          <Settings className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-text-secondary">
            Manage your personal profile, theme preferences, and account security.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Profile Section */}
          <section className="bg-bg-secondary border border-border rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-border/40 pb-2">
              <User className="h-4 w-4 text-accent-primary" />
              Profile Details
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-text-secondary">Email Address</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled className="bg-bg-tertiary border-border/60 text-text-secondary" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  required
                />
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending} size="sm">
                Save Profile
              </Button>
            </form>
          </section>

          {/* Preferences Section */}
          <section className="bg-bg-secondary border border-border rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-border/40 pb-2">
              <Settings className="h-4 w-4 text-accent-primary" />
              Application Preferences
            </h2>
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>UI Theme</Label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      theme === 'dark'
                        ? 'border-accent-primary bg-accent-primary-subtle text-accent-primary'
                        : 'border-border bg-bg-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Dark Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      theme === 'light'
                        ? 'border-accent-primary bg-accent-primary-subtle text-accent-primary'
                        : 'border-border bg-bg-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Light Mode
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotif" className="text-sm">Email Notifications</Label>
                  <p className="text-[10px] text-text-secondary">Receive daily activity digest updates.</p>
                </div>
                <input
                  id="emailNotif"
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-border bg-bg-primary text-accent-primary focus:ring-accent-primary"
                />
              </div>

              <Button type="submit" disabled={updatePreferencesMutation.isPending} size="sm">
                Save Preferences
              </Button>
            </form>
          </section>

          {/* Danger Zone Section */}
          <section className="border border-danger/40 bg-danger-subtle/5 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-danger/20 pb-2 text-danger">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </h2>
            <div className="space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                Deactivating your account will immediately revoke all sessions and mark your profile as inactive. Your data will be retained for 90 days before permanent deletion.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate Account
              </Button>
            </div>
          </section>
        </div>

        {/* Info card column */}
        <div className="space-y-4">
          <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-3 text-xs leading-relaxed text-text-secondary">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <ShieldAlert className="h-4 w-4 text-warning" />
              Profile Details Info
            </div>
            <p>
              Display names are used to mention you in comments. If you change your name, old mentions of your previous name in comments will still be stored logically but will no longer point to your active link.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        title="Deactivate Account"
        description="Are you absolutely sure you want to deactivate your SyncForge account? This will log you out of all sessions immediately. This action cannot be undone."
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={() => deactivateMutation.mutate()}
        onCancel={() => setDeactivateOpen(false)}
        loading={deactivateMutation.isPending}
      />
    </div>
  )
}
export default UserSettingsPage
