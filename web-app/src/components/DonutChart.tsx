export function DonutChart({ won, lost }: { won: number; lost: number }) {
  const total = won + lost
  const wonPercent = total ? Math.round((won / total) * 1000) / 10 : 0

  return <div className="mt-8 flex flex-wrap items-center gap-8 sm:flex-nowrap" role="img" aria-label={`${won} apuestas ganadas y ${lost} perdidas; ${total} en total.`}>
    <div className="grid h-[172px] w-[172px] shrink-0 place-items-center rounded-full" style={{ background: total ? `conic-gradient(#c4e58f 0% ${wonPercent}%, #f1b99b ${wonPercent}% 100%)` : '#e5e8da' }}>
      <div className="flex h-[111px] w-[111px] flex-col items-center justify-center rounded-full bg-white">
        <strong className="text-[34px] leading-none font-extrabold tracking-tight">{total}</strong>
        <span className="mt-1 text-[9px] font-bold tracking-[1.4px] text-muted">APUESTAS</span>
      </div>
    </div>
    <div className="min-w-[145px] flex-1 text-xs">
      <div className="flex items-center gap-2 py-3"><span className="size-2.5 rounded-full bg-lime" /><span className="text-muted">Ganadas</span><strong className="ml-auto text-base text-ink">{won}</strong></div>
      <div className="flex items-center gap-2 py-3"><span className="size-2.5 rounded-full bg-peach" /><span className="text-muted">Perdidas</span><strong className="ml-auto text-base text-ink">{lost}</strong></div>
      <p className="mt-3 border-t border-line pt-3 text-[10px] text-muted">{total ? `${wonPercent}% de victorias` : 'Aún no tienes apuestas.'}</p>
    </div>
  </div>
}
