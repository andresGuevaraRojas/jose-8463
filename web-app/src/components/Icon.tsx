import type { ReactNode } from 'react'

export type IconName = 'arrow' | 'chart' | 'check' | 'close' | 'flag' | 'logout' | 'shield' | 'wallet'

const paths: Record<IconName, ReactNode> = {
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  chart: <><path d="M4 20V9m5 11V4m5 16v-8m5 8V7" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  close: <><path d="M5 5l14 14M19 5 5 19" /></>,
  flag: <><path d="M5 21V4m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18M16 15h2" /></>,
}

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
