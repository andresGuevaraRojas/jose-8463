import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  tone?: 'forest' | 'lime'
}

export function PrimaryButton({ children, tone = 'forest', className = '', ...props }: PrimaryButtonProps) {
  const colors = tone === 'forest'
    ? 'bg-forest text-white hover:bg-forest-2'
    : 'bg-lime text-forest hover:bg-[#d4efa6]'
  return <button {...props} className={`inline-flex min-h-12 items-center justify-between gap-3 rounded-[11px] px-5 text-sm font-bold transition-colors disabled:opacity-60 ${colors} ${className}`}>
    <span>{children}</span><Icon name="arrow" size={18} />
  </button>
}
