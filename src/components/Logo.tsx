import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkToHome?: boolean
  className?: string
  textClassName?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

function LogoIcon({ size, className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClass = sizeClasses[size || 'md']

  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-primary',
        sizeClass,
        className
      )}
    >
      <span className="font-bold text-white tracking-tight">[nB]</span>
    </div>
  )
}

function LogoText({ size, textClassName }: { size?: 'sm' | 'md' | 'lg'; textClassName?: string }) {
  const textSizeClass = textSizeClasses[size || 'md']

  return (
    <span
      className={cn(
        'font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent',
        textSizeClass,
        textClassName
      )}
    >
      NotaBener
    </span>
  )
}

export function Logo({
  size = 'md',
  showText = true,
  linkToHome = true,
  className,
  textClassName,
}: LogoProps) {
  const content = (
    <>
      <LogoIcon size={size} className={className} />
      {showText && <LogoText size={size} textClassName={textClassName} />}
    </>
  )

  if (linkToHome) {
    return (
      <Link href="/" className="flex items-center gap-2 group">
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {content}
    </div>
  )
}

export function AdminLogo({
  size = 'md',
  showText = true,
  linkToHome = true,
  className,
  textClassName,
}: LogoProps) {
  const content = (
    <>
      <LogoIcon size={size} className={className} />
      {showText && (
        <div className="flex items-center gap-2">
          <span className={cn('font-bold text-brand-500', textSizeClasses[size], textClassName)}>
            NotaBener
          </span>
          {linkToHome && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-semibold rounded-full">
              Admin
            </span>
          )}
        </div>
      )}
    </>
  )

  if (linkToHome) {
    return (
      <Link href="/admin" className="flex items-center gap-2 group">
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {content}
    </div>
  )
}
