import { useState } from 'react'
import type { UserProfile } from '../auth'
import { Brand } from '../components/Brand'
import { DonutChart } from '../components/DonutChart'
import { Icon } from '../components/Icon'
import { PaymentModal } from '../components/PaymentModal'
import { PrimaryButton } from '../components/PrimaryButton'
import { WinsChart } from '../components/WinsChart'
import { money } from '../data/simulation'
import { dashboardStats } from '../services/dashboardStats'
import type { AppUserData } from '../types/app'

interface DashboardPageProps {
  profile: UserProfile
  data: AppUserData
  onLogout: () => void
  onDeposit: (amountCents: number) => Promise<void>
  onStartRace: () => void
}

function PanelHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="flex items-start justify-between gap-3">
    <div>
      <p className="text-[10px] font-bold tracking-[1.3px] text-forest-2">{eyebrow}</p>
      <h3 className="mt-1 text-[20px] font-extrabold tracking-tight">{title}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
    </div>
    <span className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-[9px] font-bold tracking-wider text-muted">SIMULADO</span>
  </div>
}

export function DashboardPage({ profile, data, onLogout, onDeposit, onStartRace }: DashboardPageProps) {
  const [payOpen, setPayOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const firstName = profile.fullName.trim().split(/\s+/)[0]
  const stats = dashboardStats(data)

  async function deposit(amountCents: number) {
    await onDeposit(amountCents)
    setPayOpen(false)
    setNotice(`Recarga de ${money(amountCents)} procesada con éxito.`)
  }

  return <div className="flex min-h-screen bg-cream">
    <aside className="hidden w-[250px] shrink-0 flex-col bg-forest px-5 py-8 text-white lg:flex">
      <div className="px-2"><Brand light /></div>
      <nav aria-label="Navegación principal" className="mt-20">
        <p className="px-3 text-[10px] font-bold tracking-[1.6px] text-[#90b99a]">TU ESPACIO</p>
        <div aria-current="page" className="mt-4 flex h-11 items-center gap-3 rounded-[10px] bg-forest-2 px-4 text-[13px] font-bold"><Icon name="chart" size={18} /> Resumen del día</div>
        <button type="button" onClick={onStartRace} className="mt-2 flex h-11 w-full items-center gap-3 rounded-[10px] px-4 text-left text-[13px] font-bold text-[#c7ddca] hover:bg-forest-2 hover:text-white"><Icon name="flag" size={18} /> Carreras</button>
      </nav>
      <div className="mt-auto">
        <div className="rounded-[13px] border border-[#386a50] bg-forest-2 p-4"><span className="text-xl text-lime">✳</span><strong className="mt-1 block text-xs">Sin prisa, con emoción.</strong><small className="mt-2 block text-[11px] leading-relaxed text-[#b4d0ba]">Seis carreras simuladas cada día.</small></div>
        <button type="button" onClick={onLogout} className="mt-6 flex items-center gap-3 px-3 py-2 text-[13px] text-[#c7ddca] hover:text-white"><Icon name="logout" size={18} /> Cerrar sesión</button>
      </div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="flex h-20 items-center justify-between border-b border-line bg-white px-5 sm:px-8 xl:px-12">
        <div className="lg:hidden"><Brand /></div>
        <div className="hidden items-center gap-2 rounded-full border border-line bg-cream px-3 py-2 text-[10px] font-bold tracking-[1.1px] text-forest-2 lg:flex"><span className="size-1.5 rounded-full bg-[#86bd70]" /> DÍA DE CARRERAS · SIMULADO</div>
        <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-lime text-xs font-bold text-forest">{profile.fullName.charAt(0).toUpperCase()}</span><span className="hidden text-xs font-bold sm:inline">{profile.fullName}</span><button type="button" className="ml-1 text-forest lg:hidden" onClick={onLogout} aria-label="Cerrar sesión"><Icon name="logout" size={19} /></button></div>
      </header>

      <main className="mx-auto max-w-[1230px] px-5 py-9 sm:px-8 xl:px-12">
        <div className="flex items-center justify-between">
          <div><p className="text-[10px] font-bold tracking-[1.7px] text-forest-2">TU PANEL DE CONTROL</p><h1 className="mt-2 text-[35px] leading-tight font-extrabold tracking-[-1.8px] sm:text-[45px]">Hola, {firstName} <span aria-hidden="true">👋</span></h1><p className="mt-1 text-sm text-muted">Un vistazo a tu saldo y al día en la pista.</p></div>
          <span aria-hidden="true" className="hidden -rotate-12 text-5xl opacity-80 sm:block">🐌</span>
        </div>

        {notice && <div role="status" className="mt-6 flex items-center gap-2 rounded-xl bg-soft px-4 py-3 text-xs font-bold text-forest-2"><Icon name="check" size={17} />{notice}<button type="button" className="ml-auto" aria-label="Cerrar mensaje" onClick={() => setNotice('')}><Icon name="close" size={16} /></button></div>}

        <div className="mt-8 grid gap-5 md:grid-cols-[1.6fr_1fr]">
          <section className="relative min-h-[220px] overflow-hidden rounded-[18px] bg-forest p-7 text-white">
            <div aria-hidden="true" className="absolute -right-10 top-8 size-[250px] rounded-full border-[42px] border-forest-2" />
            <div className="relative z-10"><p className="flex items-center gap-2 text-[10px] font-bold tracking-[1.4px] text-lime"><Icon name="wallet" size={18} /> TU SALDO DISPONIBLE</p><strong className="mt-4 block text-[43px] leading-none font-extrabold tracking-[-1.5px]">{money(data.balanceCents)}</strong><p className="mt-2 text-xs text-[#bfd5c1]">Listo para cuando quieras participar.</p><div className="mt-5 flex flex-wrap gap-2"><PrimaryButton tone="lime" type="button" className="!min-h-10 text-xs" onClick={() => setPayOpen(true)}>Cargar saldo</PrimaryButton><button type="button" onClick={onStartRace} className="min-h-10 rounded-[11px] border border-white/25 px-4 text-xs font-bold hover:bg-white/10">Ver carreras</button></div></div>
          </section>
          <section className="relative flex min-h-[220px] gap-4 rounded-[18px] bg-soft p-7">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime text-forest"><Icon name="flag" size={25} /></div>
            <div><p className="mt-2 text-[10px] font-bold tracking-[1.2px] text-forest-2">CARRERAS DE HOY</p><strong className="mt-3 block text-[40px] leading-none font-extrabold tracking-tight">{String(stats.racesToday).padStart(2, '0')}</strong><p className="mt-4 text-xs text-muted">Resultados simulados y propios del día</p></div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.15fr]">
          <section className="min-h-[334px] rounded-[18px] border border-line bg-white p-6"><PanelHeader eyebrow="RENDIMIENTO" title="Mis apuestas" description="Incluye seis resultados de ejemplo al crear tu cuenta." /><DonutChart won={stats.won} lost={stats.lost} /></section>
          <section className="min-h-[334px] rounded-[18px] border border-line bg-white p-6"><PanelHeader eyebrow="EN LA PISTA" title="Victorias por caracol" description="Ganadores de las carreras simuladas y propias." /><WinsChart snails={stats.snails} /></section>
        </div>
        <p className="mt-5 flex items-center gap-2 text-[11px] text-muted"><Icon name="shield" size={16} /> Las estadísticas y carreras son simuladas. SnailPay no realiza cobros reales.</p>
      </main>
    </div>
    {payOpen && <PaymentModal onClose={() => setPayOpen(false)} onSuccess={deposit} />}
  </div>
}
