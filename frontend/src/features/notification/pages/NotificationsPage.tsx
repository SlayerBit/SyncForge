import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { notificationApi } from '../api/notification.api'
import { NotificationDto } from '@/types/common.types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
  })

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification marked as read')
    },
    onError: () => {
      toast.error('Failed to mark notification as read')
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: notificationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification deleted')
    },
    onError: () => {
      toast.error('Failed to delete notification')
    },
  })

  const handleNotificationClick = (notification: NotificationDto) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id)
    }

    if (notification.referenceType === 'TASK' && notification.referenceId) {
      navigate('/')
    } else if (notification.referenceType === 'WORKSPACE' && notification.referenceId) {
      navigate(`/workspaces/${notification.referenceId}`)
    }
  }

  const list = notificationsData?.data || []
  const filteredNotifications = filter === 'unread' ? list.filter((n: NotificationDto) => !n.read) : list

  return (
    <div className="max-w-[760px] mx-auto py-8 px-4 space-y-6 select-none animate-fade-in text-text-primary">
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-accent-primary/10 border border-accent-primary/20 rounded-lg flex items-center justify-center text-accent-primary">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
            <p className="text-xs text-text-secondary">
              Manage your notifications and alerts.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-xs h-8 gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 select-none relative",
            filter === 'all'
              ? "bg-bg-secondary border border-border/60 text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
          )}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 select-none flex items-center gap-2 relative",
            filter === 'unread'
              ? "bg-bg-secondary border border-border/60 text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
          )}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="bg-accent-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All caught up"
          description="You don't have any notifications right now."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notification: NotificationDto) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99]",
                notification.read
                  ? 'bg-bg-primary hover:bg-bg-secondary/40 border-border/40 text-text-secondary'
                  : 'bg-bg-secondary hover:bg-bg-tertiary/60 border-border/80 shadow-sm text-text-primary'
              )}
            >
              <div className="space-y-1.5 pr-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-text-primary">{notification.title}</span>
                  {!notification.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-primary shrink-0 animate-pulse" />
                  )}
                </div>
                {notification.message && (
                  <p className="text-[11px] text-text-secondary leading-relaxed max-w-[540px]">
                    {notification.message}
                  </p>
                )}
                <span className="text-[9px] text-text-tertiary block pt-0.5">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"
                    onClick={() => markReadMutation.mutate(notification.id)}
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-text-tertiary hover:text-danger hover:bg-danger/10"
                  onClick={() => deleteMutation.mutate(notification.id)}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default NotificationsPage
