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
      // In a full implementation, we navigate to the task's board and open it.
      // We can fetch task details to find its boardId or try to route appropriately.
      // Here, if it references a task, we try to navigate if possible.
      // If we don't have boardId, we could check if we can fetch it, or navigate to dashboard.
      // For now, let's open it or direct the user.
      // If we have boardId on reference, that is ideal, otherwise navigate to dashboard
      // Let's redirect to dashboard/board page or let the user know.
      navigate('/')
    } else if (notification.referenceType === 'WORKSPACE' && notification.referenceId) {
      navigate(`/workspaces/${notification.referenceId}`)
    }
  }

  const list = notificationsData?.data || []
  const filteredNotifications = filter === 'unread' ? list.filter((n: NotificationDto) => !n.read) : list

  return (
    <div className="max-w-[800px] mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-accent-primary-subtle rounded-md flex items-center justify-center text-accent-primary">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
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
      <div className="flex items-center gap-2 border-b border-border/20 pb-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filter === 'all'
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
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
        <div className="space-y-2">
          {filteredNotifications.map((notification: NotificationDto) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start justify-between p-3.5 rounded-lg border transition-all cursor-pointer ${
                notification.read
                  ? 'bg-bg-primary hover:bg-bg-secondary border-border/30 text-text-secondary'
                  : 'bg-bg-secondary hover:bg-bg-tertiary border-border shadow-sm text-text-primary'
              }`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{notification.title}</span>
                  {!notification.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-primary shrink-0" />
                  )}
                </div>
                {notification.message && (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {notification.message}
                  </p>
                )}
                <span className="text-[10px] text-text-tertiary block pt-0.5">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                  className="h-7 w-7 text-text-tertiary hover:text-danger hover:bg-danger-subtle"
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
