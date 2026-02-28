import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkToHome?: boolean
  className?: string
  textClassName?: string
}

export function Logo({
  size = 'md',
  showText = true,
  linkToHome = true,
  className,
  textClassName,
}: LogoProps) {
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

  const LogoContent = () => (
    <>
      {/* Logo Icon [iK] */}
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-orange-500 to-lime-500 flex items-center justify-center shadow-lg shadow-orange-200',
          sizeClasses[size],
          className
        )}
      >
        <span className="font-bold text-white tracking-tight">[iK]</span>
      </div>

      {/* Logo Text */}
      {showText && (
        <span
          className={cn(
            'font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent',
            textSizeClasses[size],
            textClassName
          )}
        >
          InvoiceKirim
        </span>
      )}
    </>
  )

  if (linkToHome) {
    return (
      <Link href="/" className="flex items-center gap-2 group">
        <LogoContent />
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <LogoContent />
    </div>
  )
}

// Admin Logo variant
export function AdminLogo({
  size = 'md',
  showText = true,
  linkToHome = true,
  className,
  textClassName,
}: LogoProps) {
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

  const LogoContent = () => (
    <>
      {/* Logo Icon [iK] */}
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30',
          sizeClasses[size],
          className
        )}
      >
        <span className="font-bold text-white tracking-tight">[iK]</span>
      </div>

      {/* Logo Text */}
      {showText && (
        <span className={cn('font-bold text-gray-900', textSizeClasses[size], textClassName)}>
          InvoiceKirim{' '}
          <span className="text-orange-500">Admin</span>
        </span>
      )}
    </>
  )

  if (linkToHome) {
    return (
      <Link href="/admin" className="flex items-center gap-2 group">
        <LogoContent />
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <LogoContent />
    </div>
  )
}
