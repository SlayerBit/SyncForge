import React from 'react'
import { UserStatus } from '@/types/common.types'
import { cn } from '@/lib/utils'

interface UserPresenceProps {
  status: 'ONLINE' | 'AWAY' | 'OFFLINE' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  className?: string
}

export function UserPresence({ status, className }: UserPresenceProps) {
  const colorMap = {
    ONLINE: 'bg-success',
    AWAY: 'bg-warning',
    OFFLINE: 'bg-text-tertiary',
    PENDING: 'bg-text-tertiary',
    ACTIVE: 'bg-success',
    SUSPENDED: 'bg-danger',
    DEACTIVATED: 'bg-danger',
  }

  const labelMap = {
    ONLINE: 'Online',
    AWAY: 'Away',
    OFFLINE: 'Offline',
    PENDING: 'Pending',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    DEACTIVATED: 'Deactivated',
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className={cn('h-2 w-2 rounded-full', colorMap[status])} />
      <span className="text-xs text-text-secondary">{labelMap[status]}</span>
    </div>
  )
}
