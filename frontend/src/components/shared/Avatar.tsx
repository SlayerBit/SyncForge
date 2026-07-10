import React from 'react'
import { cn } from '@/lib/utils'
import { UserStatus } from '@/types/common.types'

interface AvatarProps {
  displayName?: string
  email?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'ONLINE' | 'AWAY' | 'OFFLINE' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  className?: string
}

const sizeMap = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-16 w-16 text-lg',
}

const presenceSizeMap = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4.5 w-4.5',
}

const presenceColorMap = {
  ONLINE: 'bg-success',
  AWAY: 'bg-warning',
  OFFLINE: 'bg-text-tertiary',
  PENDING: 'bg-text-tertiary',
  ACTIVE: 'bg-success',
  SUSPENDED: 'bg-danger',
  DEACTIVATED: 'bg-danger',
}

export function Avatar({ displayName = '?', email, src, size = 'md', status, className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false)

  // Generate initials
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Generate background color class from display name hash
  const getBgColor = (name: string) => {
    const colors = [
      'bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/25',
      'bg-[#fb923c]/15 text-[#fb923c] border border-[#fb923c]/25',
      'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/25',
      'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/25',
      'bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/25',
      'bg-[#60a5fa]/15 text-[#60a5fa] border border-[#60a5fa]/25',
      'bg-[#818cf8]/15 text-[#818cf8] border border-[#818cf8]/25',
      'bg-[#c084fc]/15 text-[#c084fc] border border-[#c084fc]/25',
      'bg-[#f472b6]/15 text-[#f472b6] border border-[#f472b6]/25',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  // Get gravatar url if email is provided
  let finalSrc = src
  if (!finalSrc && email) {
    // Generate simple gravatar URL (without MD5 dependency in frontend, just fallback to standard Gravatar URL structure)
    // For standard Gravatar, we can hash the email. Or let the backend provide the avatarUrl (which it does via GravatarUtils).
    // So we use standard avatarUrl or fallback to initials.
  }

  return (
    <div className={cn('relative inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold', sizeMap[size], className)}>
      {finalSrc && !imgError ? (
        <img
          src={finalSrc}
          alt={displayName}
          onError={() => setImgError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center rounded-full', getBgColor(displayName))}>
          {initials}
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-bg-primary',
            presenceSizeMap[size],
            presenceColorMap[status]
          )}
        />
      )}
    </div>
  )
}
