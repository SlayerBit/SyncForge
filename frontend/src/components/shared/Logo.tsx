import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  iconClassName?: string
  showText?: boolean
  textClassName?: string
}

export function Logo({ className, iconClassName, showText = true, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 border border-accent-primary/20 shadow-sm", iconClassName)}>
        <svg className="h-5.5 w-5.5 text-accent-primary" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M10 24C10 21 13 19 16 19C19 19 22 21 22 24C22 27 19 29 16 29C12 29 8 26 8 22C8 16 14 13 18 13" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M22 8C22 11 19 13 16 13C13 13 10 11 10 8C10 5 13 3 16 3C20 3 24 6 24 10C24 16 18 19 14 19" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="18" cy="13" r="2.2" fill="currentColor" />
          <circle cx="14" cy="19" r="2.2" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span className={cn("text-xs font-extrabold tracking-tight text-text-primary uppercase", textClassName)}>
          SyncForge
        </span>
      )}
    </div>
  )
}
export default Logo
