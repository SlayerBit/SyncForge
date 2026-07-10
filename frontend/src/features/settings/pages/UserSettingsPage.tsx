import React, { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useMutation } from '@tanstack/react-query'
import { User, Settings, AlertTriangle, ShieldAlert, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export function UserSettingsPage() {
  const navigate = useNavigate()
  const { user, updateUser, clearAuth } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.emailNotifications ?? true)
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
    <div className="max-w-[760px] mx-auto py-8 px-4 space-y-8 text-text-primary select-none animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border/40 pb-5">
        <div className="h-8 w-8 bg-accent-primary/10 border border-accent-primary/20 rounded-lg flex items-center justify-center text-accent-primary">
          <Settings className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-text-secondary">
            Manage your personal profile, theme preferences, and account security.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Profile Section */}
          <section className="bg-bg-secondary border border-border/80 rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2.5 text-text-tertiary">
              <User className="h-4 w-4 text-accent-primary" />
              Profile Details
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] uppercase font-bold text-text-tertiary">Email Address</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled className="bg-bg-primary border-border/60 text-text-tertiary text-xs h-8.5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-[10px] uppercase font-bold text-text-tertiary">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  required
                  className="text-xs h-8.5"
                />
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending} size="sm" className="h-8.5 text-xs font-medium">
                Save Profile
              </Button>
            </form>
          </section>

          {/* Preferences Section */}
          <section className="bg-bg-secondary border border-border/80 rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2.5 text-text-tertiary">
              <Settings className="h-4 w-4 text-accent-primary" />
              Application Preferences
            </h2>
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] uppercase font-bold text-text-tertiary">UI Theme</Label>
                <div className="grid grid-cols-2 p-0.5 bg-bg-primary border border-border/60 rounded-lg w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-md transition-all select-none flex items-center justify-center gap-1",
                      theme === 'light'
                        ? "bg-bg-secondary text-text-primary shadow-sm border border-border/50"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {theme === 'light' && <Check className="h-3 w-3 text-accent-primary" />}
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-md transition-all select-none flex items-center justify-center gap-1",
                      theme === 'dark'
                        ? "bg-bg-secondary text-text-primary shadow-sm border border-border/50"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {theme === 'dark' && <Check className="h-3 w-3 text-accent-primary" />}
                    Dark
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotif" className="text-xs font-semibold text-text-primary">Email Notifications</Label>
                  <p className="text-[10px] text-text-secondary">Receive daily activity digest updates.</p>
                </div>
                {/* Custom switch component */}
                <button
                  type="button"
                  id="emailNotif"
                  role="switch"
                  aria-checked={emailNotifications}
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-accent-primary",
                    emailNotifications ? "bg-accent-primary" : "bg-bg-primary border-border/80"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      emailNotifications ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <Button type="submit" disabled={updatePreferencesMutation.isPending} size="sm" className="h-8.5 text-xs font-medium">
                Save Preferences
              </Button>
            </form>
          </section>

          {/* Danger Zone Section */}
          <section className="border border-danger/30 bg-danger-subtle/5 rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-danger/20 pb-2.5 text-danger">
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
                className="h-8.5 text-xs font-medium"
              >
                Deactivate Account
              </Button>
            </div>
          </section>
        </div>

        {/* Info card column */}
        <div className="space-y-4">
          <div className="bg-bg-secondary border border-border/80 rounded-xl p-4.5 space-y-3 text-xs leading-relaxed text-text-secondary shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <ShieldAlert className="h-4 w-4 text-warning" />
              Profile details summary
            </div>
            <p className="text-[11px] text-text-secondary/90 leading-relaxed">
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
