export function Brand({ light = false }: { light?: boolean }) {
  return <div className="flex items-center gap-2.5" aria-label="SnailClub">
    <span aria-hidden="true" className="text-[29px] leading-none">🐌</span>
    <div>
      <div className={`text-[23px] leading-none font-extrabold tracking-[-1px] ${light ? 'text-white' : 'text-ink'}`}>snail<span className={light ? 'text-lime' : 'text-[#6a994d]'}>club</span></div>
      <div className={`mt-1.5 text-[8px] font-bold tracking-[2px] ${light ? 'text-[#bad3bf]' : 'text-muted'}`}>LA LIGA MÁS LENTA</div>
    </div>
  </div>
}
