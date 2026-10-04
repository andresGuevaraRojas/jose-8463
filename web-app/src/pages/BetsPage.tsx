import { Link, useLocation } from 'react-router'
import type { UserProfile } from '../auth'
import { AppSidebar } from '../components/AppSidebar'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { money } from '../data/simulation'
import { racingSnails } from '../services/raceService'
import { preserveSnailPayTestMode } from '../services/snailPayTestMode'
import type { AppUserData } from '../types/app'

interface BetsPageProps {
  profile: UserProfile
  data: AppUserData
  onLogout: () => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value))

export function BetsPage({ profile, data, onLogout }: BetsPageProps) {
  const bets = data.bets ?? []
  const racesPath = preserveSnailPayTestMode('/races', useLocation().search)
  return <div className="flex min-h-screen bg-cream">
    <AppSidebar onLogout={onLogout} />
    <div className="min-w-0 flex-1">
      <header className="flex h-20 items-center justify-between border-b border-line bg-white px-5 sm:px-8 xl:px-12">
        <div className="lg:hidden"><Brand /></div>
        <div className="hidden items-center gap-2 rounded-full border border-line bg-cream px-3 py-2 text-[10px] font-bold tracking-[1.1px] text-forest-2 lg:flex"><span className="size-1.5 rounded-full bg-[#86bd70]" /> DÍA DE CARRERAS · SIMULADO</div>
        <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-lime text-xs font-bold text-forest">{profile.fullName.charAt(0).toUpperCase()}</span><span className="hidden text-xs font-bold sm:inline">{profile.fullName}</span><button type="button" className="ml-1 text-forest lg:hidden" onClick={onLogout} aria-label="Cerrar sesión"><Icon name="logout" size={19} /></button></div>
      </header>
      <main className="mx-auto max-w-[1230px] px-5 py-9 sm:px-8 xl:px-12">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-[10px] font-bold tracking-[1.7px] text-forest-2">TU HISTORIAL</p><h1 className="mt-2 text-[35px] leading-tight font-extrabold tracking-[-1.8px] sm:text-[45px]">Mis apuestas</h1><p className="mt-1 text-sm text-muted">Resultados de ejemplo y apuestas que has realizado.</p></div>
          <Link to={racesPath} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-xs font-bold text-white hover:bg-forest-2"><Icon name="flag" size={16} /> Ir a carreras</Link>
        </div>
        {bets.length === 0 ? <section className="mt-8 rounded-[18px] border border-line bg-white p-8 text-center"><h2 className="text-xl font-extrabold">Aún no tienes apuestas</h2><p className="mt-2 text-sm text-muted">Elige un caracol para empezar.</p></section> :
          <div className="mt-8 grid gap-4">
            {bets.map((bet) => <article key={bet.id} className="flex flex-wrap items-center justify-between gap-5 rounded-[18px] border border-line bg-white p-5 sm:p-6">
              <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-xl bg-soft text-2xl" aria-hidden="true">🐌</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-extrabold">{bet.snailName}</h2>{bet.sample && <span className="rounded-full bg-cream px-2 py-1 text-[9px] font-bold text-muted">EJEMPLO</span>}</div><p className="mt-1 text-xs text-muted">{formatDate(bet.createdAt)} · Ganó {racingSnails.find((snail) => snail.id === bet.winnerId)?.name ?? 'un caracol'}</p></div></div>
              <div className="flex items-center gap-6 text-xs"><div><p className="text-muted">Apuesta</p><strong className="mt-1 block text-sm">{money(bet.amountCents)}</strong></div><div><p className="text-muted">Cobro</p><strong className="mt-1 block text-sm">{money(bet.payoutCents)}</strong></div><span className={`rounded-full px-3 py-1.5 font-bold ${bet.status === 'won' ? 'bg-soft text-forest-2' : 'bg-[#fff0ea] text-[#9a4d39]'}`}>{bet.status === 'won' ? 'Ganada' : 'Perdida'}</span></div>
            </article>)}
          </div>}
      </main>
    </div>
  </div>
}
