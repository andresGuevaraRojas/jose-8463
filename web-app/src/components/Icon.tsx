import type { ReactNode } from 'react'

export type IconName = 'arrow' | 'arrowLeft' | 'chart' | 'check' | 'close' | 'flag' | 'logout' | 'play' | 'shield' | 'ticket' | 'trophy' | 'wallet'

const paths: Record<IconName, ReactNode> = {
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  arrowLeft: <><path d="M20 12H4m6 6-6-6 6-6" /></>,
  chart: <><path d="M4 20V9m5 11V4m5 16v-8m5 8V7" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  close: <><path d="M5 5l14 14M19 5 5 19" /></>,
  flag: <><path d="M5 21V4m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" /></>,
  play: <><path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  ticket: <><path d="M4 8a2 2 0 1 0 0-4V3h16v1a2 2 0 1 0 0 4v8a2 2 0 1 0 0 4v1H4v-1a2 2 0 1 0 0-4V8Z" /><path d="M13 5v14" /></>,
  trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v1a4 4 0 0 0 4 4m8-5h4v1a4 4 0 0 1-4 4M12 12v5m-4 3h8M9 17h6" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18M16 15h2" /></>,
}

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
