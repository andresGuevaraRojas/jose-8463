import type { SnailResult } from '../data/simulation'

export function WinsChart({ snails }: { snails: readonly SnailResult[] }) {
  const maxWins = Math.max(1, ...snails.map((snail) => snail.wins))
  return <div className="relative mt-8 h-[190px]" role="img" aria-label={`Tus victorias: ${snails.map((snail) => `${snail.name} ${snail.wins}`).join(', ')}`}>
    <div aria-hidden="true" className="absolute inset-x-0 top-2 bottom-9 flex flex-col justify-between text-[10px] text-muted">
      {[maxWins, Math.floor(maxWins / 2), 0].map((tick, index) => <div key={index} className="flex items-center gap-2"><span className="w-3">{tick}</span><span className="h-px flex-1 border-t border-dashed border-line" /></div>)}
    </div>
    <div aria-hidden="true" className="absolute inset-y-0 right-0 left-6 flex items-end justify-around">
      {snails.map((snail) => <div key={snail.name} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
        <div className="flex h-[140px] flex-col items-center justify-end">
          <strong className="mb-1 text-[10px]">{snail.wins}</strong>
          <div className="w-7 rounded-t-md sm:w-9" style={{ height: `${snail.wins ? Math.max(snail.wins / maxWins * 134, 4) : 0}px`, backgroundColor: snail.color }} />
        </div>
        <span className="mt-1 text-base leading-none">🐌</span>
        <span className="mt-1 text-[10px] font-bold text-muted">{snail.name}</span>
      </div>)}
    </div>
  </div>
}
