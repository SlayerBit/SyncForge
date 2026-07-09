import React from 'react'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password?: string
}

export function PasswordStrengthIndicator({ password = '' }: PasswordStrengthIndicatorProps) {
  const getStrength = (val: string) => {
    let score = 0
    if (!val) return score
    if (val.length >= 8) score += 1
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score += 1
    if (/[0-9]/.test(val)) score += 1
    if (/[^A-Za-z0-9]/.test(val)) score += 1
    return score
  }

  const score = getStrength(password)

  const segments = [
    { color: 'bg-danger', text: 'Weak' },
    { color: 'bg-warning', text: 'Fair' },
    { color: 'bg-warning', text: 'Good' },
    { color: 'bg-success', text: 'Strong' },
  ]

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex h-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-full flex-1 rounded-full transition-all duration-300 bg-bg-tertiary',
              i <= score && segments[score - 1]?.color
            )}
          />
        ))}
      </div>
      {score > 0 && (
        <span className="text-[10px] text-text-secondary">
          Password strength: <span className="font-semibold">{segments[score - 1]?.text}</span>
        </span>
      )}
    </div>
  )
}
