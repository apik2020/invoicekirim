import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkToHome?: boolean
  className?: string
  textClassName?: string // Kept for backward compatibility
}

const logoSizes = {
  sm: { height: 24, width: 126 },
  md: { height: 32, width: 168 },
  lg: { height: 40, width: 210 },
}

const iconSizes = {
  sm: 'w-6 h-6 text-[8px]',
  md: 'w-8 h-8 text-[10px]',
  lg: 'w-10 h-10 text-xs',
}

// Icon-only logo for small spaces (sidebar, etc.)
function LogoIcon({ size, className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClass = iconSizes[size || 'md']

  return (
    <div
      className={cn(
        'rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0',
        sizeClass,
        className
      )}
    >
      <span className="font-bold text-white tracking-tight">No</span>
    </div>
  )
}

// Full logo with image
function LogoImage({ size, className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimensions = logoSizes[size || 'md']

  return (
    <Image
      src="/images/notabener-logo.png"
      alt="NotaBener"
      width={dimensions.width}
      height={dimensions.height}
      className={cn('h-auto', className)}
      priority
    />
  )
}

export function Logo({
  size = 'md',
  showText = true,
  linkToHome = true,
  className,
  textClassName, // Accepted for backward compatibility but not used with image
}: LogoProps) {
  // Always render the same structure to avoid hydration mismatch
  const content = showText ? (
    <LogoImage size={size} className={className} />
  ) : (
    <LogoIcon size={size} className={className} />
  )

  if (linkToHome) {
    return (
      <Link href="/" className="flex items-center group">
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-center">
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
  const content = showText ? (
    <div className="flex items-center gap-2">
      <LogoImage size={size} className={className} />
      {linkToHome && (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
          Admin
        </span>
      )}
    </div>
  ) : (
    <LogoIcon size={size} className={className} />
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
