import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { UserProfile } from '../auth'
import { Brand } from '../components/Brand'
import { AppSidebar } from '../components/AppSidebar'
import { Icon } from '../components/Icon'
import { PrimaryButton } from '../components/PrimaryButton'
import { money } from '../data/simulation'
import { currentRaceTimestamp, racingSnails, runSimulatedRace, type RacingSnail, type SimulatedRace } from '../services/raceService'
import { preserveSnailPayTestMode } from '../services/snailPayTestMode'
import { createBetSchema } from '../services/validationSchemas'
import type { AppUserData, BetRecord } from '../types/app'

type FlowStep = 'choose' | 'confirm' | 'race' | 'result'
type RacePhase = 'ready' | 'middle' | 'finish'

interface RacePageProps {
  profile: UserProfile
  data: AppUserData
  onLogout: () => void
  onSettleBet: (bet: BetRecord) => Promise<void>
}

function Track({ race, phase }: { race: SimulatedRace; phase: RacePhase }) {
  const positionFor = (snail: RacingSnail) => {
    const finish = race.standings.findIndex(({ id }) => id === snail.id)
    if (phase === 'ready') return 4
    if (phase === 'middle') return [56, 44, 49, 35, 39, 29][finish]
    return [93, 83, 75, 66, 56, 47][finish]
  }

  return <section className="overflow-hidden rounded-[18px] border border-line bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-extrabold">Jardín del club</h2><p className="mt-1 text-[11px] text-muted">Recorrido ilustrativo</p></div><span className="rounded-full bg-cream px-3 py-1.5 text-[10px] font-bold tracking-wide text-muted">SIMULADO</span></div>
    <div className="mt-5 flex items-center justify-between px-[2%] text-[9px] font-bold tracking-[1.3px] text-muted"><span>SALIDA</span><span>META</span></div>
    <div className="mt-2 space-y-2">
      {racingSnails.map((snail, index) => <div key={snail.id} className="grid grid-cols-[92px_1fr] items-center gap-2 sm:grid-cols-[128px_1fr]">
        <span className="truncate text-[11px] font-bold text-forest"><span className="mr-2 text-muted">{String(index + 1).padStart(2, '0')}</span>{snail.name}</span>
        <div className="relative h-10 overflow-hidden rounded-lg border border-line bg-cream"><div aria-hidden="true" className="absolute inset-y-0 right-[7%] border-l-4 border-dashed border-forest-2" /><img src={snail.portrait} alt="" className="absolute top-1/2 size-9 -translate-y-1/2 object-contain transition-all duration-[1800ms] ease-out" style={{ left: `${positionFor(snail)}%` }} /></div>
      </div>)}
    </div>
  </section>
}

export function RacePage({ profile, data, onLogout, onSettleBet }: RacePageProps) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const dashboardPath = preserveSnailPayTestMode('/dashboard', search)
  const [step, setStep] = useState<FlowStep>('choose')
  const [selectedId, setSelectedId] = useState('rayo')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [race, setRace] = useState<SimulatedRace | null>(null)
  const [phase, setPhase] = useState<RacePhase>('ready')
  const [saving, setSaving] = useState(false)

  const selected = useMemo(() => racingSnails.find(({ id }) => id === selectedId) ?? racingSnails[0], [selectedId])
  const parsedAmount = createBetSchema(data.balanceCents).safeParse({ amount })
  const amountCents = parsedAmount.success ? parsedAmount.data.amount : 0
  const potentialPayout = Math.round(amountCents * selected.odds)
  const firstName = profile.fullName.trim().split(/\s+/)[0]

  useEffect(() => {
    if (step !== 'race' || phase !== 'middle') return
    const finishTimer = window.setTimeout(() => setPhase('finish'), 2200)
    return () => window.clearTimeout(finishTimer)
  }, [step, phase])

  useEffect(() => {
    if (step !== 'race' || phase !== 'finish' || !race) return
    const resultTimer = window.setTimeout(() => setStep('result'), 2200)
    return () => window.clearTimeout(resultTimer)
  }, [step, phase, race])

  function continueToConfirmation() {
    const result = createBetSchema(data.balanceCents).safeParse({ amount })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError('')
    setStep('confirm')
  }

  async function reserveAndStart() {
    if (!parsedAmount.success || saving) return
    setSaving(true)
    const nextRace = runSimulatedRace()
    setRace(nextRace)
    setPhase('ready')
    setStep('race')
    setSaving(false)
  }

  function simulateRace() {
    if (phase !== 'ready') return
    setPhase('middle')
  }

  async function saveResult() {
    if (!race || !parsedAmount.success || saving) return
    setSaving(true)
    const won = race.winner.id === selected.id
    const bet: BetRecord = {
      id: crypto.randomUUID(),
      snailId: selected.id,
      snailName: selected.name,
      amountCents,
      odds: selected.odds,
      winnerId: race.winner.id,
      status: won ? 'won' : 'lost',
      payoutCents: won ? potentialPayout : 0,
      createdAt: currentRaceTimestamp(),
    }
    await onSettleBet(bet)
    setSaving(false)
    navigate(dashboardPath)
  }

  const raceWinner = race?.winner
  const won = raceWinner?.id === selected.id

  return <div className="flex min-h-screen bg-cream"><AppSidebar onLogout={onLogout} /><div className="min-w-0 flex-1"><header className="flex h-20 items-center justify-between border-b border-line bg-white px-5 sm:px-8 xl:px-12"><div className="lg:hidden"><Brand /></div><div className="hidden items-center gap-2 rounded-full border border-line bg-cream px-3 py-2 text-[10px] font-bold tracking-[1.1px] text-forest-2 lg:flex"><span className="size-1.5 rounded-full bg-[#86bd70]" /> DÍA DE CARRERAS · SIMULADO</div><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-lime text-xs font-bold text-forest">{profile.fullName.charAt(0).toUpperCase()}</span><span className="hidden text-xs font-bold sm:inline">{profile.fullName}</span><button type="button" className="ml-1 text-forest lg:hidden" onClick={onLogout} aria-label="Cerrar sesión"><Icon name="logout" size={19} /></button></div></header>
    <main className="mx-auto max-w-[1230px] px-5 py-9 sm:px-8 xl:px-12">
      {step === 'choose' && <><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-[10px] font-bold tracking-[1.7px] text-forest-2">TU PRÓXIMA CARRERA</p><h1 className="mt-2 text-[35px] leading-tight font-extrabold tracking-[-1.8px] sm:text-[45px]">Elige a tu favorito</h1><p className="mt-1 text-sm text-muted">Seis personalidades. Una meta. ¿Con quién vas hoy?</p></div><button type="button" onClick={() => navigate(dashboardPath)} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-xs font-bold text-forest hover:bg-cream"><Icon name="arrowLeft" size={16} /> Volver al resumen</button></div>
        <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_310px]"><section><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Conoce a los seis caracoles</h2><span className="text-[10px] font-bold tracking-wide text-muted">CUOTAS SIMULADAS</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{racingSnails.map((snail) => <button type="button" key={snail.id} onClick={() => setSelectedId(snail.id)} className={`relative rounded-[18px] border p-4 text-left transition ${selected.id === snail.id ? 'border-forest bg-soft shadow-sm' : 'border-line bg-white hover:border-[#aac7aa]'}`}><span className="absolute right-4 top-4 size-4 rounded-full border-2 border-forest bg-white">{selected.id === snail.id && <span className="m-0.5 block size-2 rounded-full bg-forest" />}</span><div className="grid size-20 place-items-center overflow-hidden rounded-2xl" style={{ backgroundColor: snail.accent }}><img src={snail.portrait} alt="" className="size-full object-contain" /></div><p className="mt-4 text-lg font-extrabold">{snail.name}</p><p className="mt-1 text-xs font-bold text-forest-2">{snail.personality}</p><p className="mt-2 text-[11px] text-muted">{snail.trait}</p><div className="mt-4 flex items-center justify-between text-[11px] font-bold text-muted"><span>Cuota simulada</span><span className="text-lg text-forest">×{snail.odds}</span></div></button>)}</div></section>
          <aside className="h-fit rounded-[18px] border border-line bg-white p-6 xl:sticky xl:top-6"><h2 className="text-xl font-extrabold">Tu apuesta</h2><div className="mt-4 rounded-xl bg-forest p-4 text-white"><p className="text-[10px] font-bold tracking-[1.2px] text-lime">SALDO DISPONIBLE</p><strong className="mt-2 block text-3xl">{money(data.balanceCents)}</strong></div><div className="mt-5"><label htmlFor="bet-amount" className="text-xs font-bold">Importe de la apuesta</label><div className="mt-2 flex overflow-hidden rounded-xl border border-line bg-cream focus-within:border-forest"><span className="px-4 py-3 text-sm font-bold text-muted">$</span><input id="bet-amount" type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError('') }} className="min-w-0 flex-1 bg-transparent py-3 pr-4 text-sm font-bold outline-none" /></div></div><div className="mt-5 space-y-2 border-y border-line py-4 text-xs"><div className="flex justify-between"><span className="text-muted">Caracol elegido</span><strong>{selected.name}</strong></div><div className="flex justify-between"><span className="text-muted">Cuota</span><strong>×{selected.odds}</strong></div><div className="flex justify-between text-sm"><span className="font-bold">Pago potencial total</span><strong className="text-forest-2">{money(potentialPayout)}</strong></div></div>{error && <div role="alert" className="mt-4 rounded-xl border border-[#e7b19e] bg-[#fff0ea] p-3 text-xs font-semibold text-[#8b4635]">{error}{error.includes('saldo') && <button type="button" onClick={() => navigate(dashboardPath)} className="mt-2 block underline">Cargar saldo</button>}</div>}<PrimaryButton tone="lime" type="button" className="mt-5 w-full" onClick={continueToConfirmation}>Confirmar apuesta</PrimaryButton><p className="mt-3 text-center text-[10px] leading-relaxed text-muted">Ejemplo de interfaz. Sin dinero real.</p></aside></div></>}

      {step === 'confirm' && <><button type="button" onClick={() => setStep('choose')} className="inline-flex items-center gap-2 text-xs font-bold text-forest-2"><Icon name="arrowLeft" size={17} /> Volver a elegir</button><div className="mt-5 grid gap-5 xl:grid-cols-[1fr_330px]"><section className="rounded-[20px] border border-line bg-soft p-6 sm:p-9"><p className="text-[10px] font-bold tracking-[1.7px] text-forest-2">TODO LISTO PARA LA SALIDA</p><h1 className="mt-2 text-[34px] font-extrabold tracking-tight">Revisa tu apuesta, {firstName}</h1><p className="mt-2 text-sm text-muted">Un último vistazo antes de reservar tu saldo simulado.</p><div className="mt-7 flex flex-wrap items-center gap-5 rounded-[18px] bg-white/65 p-5"><span className="grid size-28 place-items-center overflow-hidden rounded-2xl" style={{ backgroundColor: selected.accent }}><img src={selected.portrait} alt="" className="size-full object-contain" /></span><div><p className="text-[10px] font-bold tracking-[1.2px] text-forest-2">TU FAVORITO EN LA PISTA</p><h2 className="mt-2 text-3xl font-extrabold">{selected.name}</h2><p className="mt-1 text-sm font-bold text-forest-2">{selected.personality} por naturaleza.</p><p className="mt-2 text-xs text-muted">{selected.trait}</p><strong className="mt-4 block text-sm">Cuota simulada ×{selected.odds}</strong></div></div><div className="mt-5 rounded-xl border border-[#cbdcc8] bg-white/50 p-4 text-sm text-forest-2">Si {selected.name} gana, recibes {money(potentialPayout)} en total: recuperas tu apuesta y sumas la ganancia simulada.</div></section><aside className="rounded-[20px] border border-line bg-white p-6"><h2 className="text-xl font-extrabold">Resumen de la apuesta</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-muted">Apuesta</dt><dd className="font-bold">{money(amountCents)}</dd></div><div className="flex justify-between"><dt className="text-muted">Pago potencial</dt><dd className="font-bold text-forest-2">{money(potentialPayout)}</dd></div><div className="flex justify-between"><dt className="text-muted">Saldo inicial</dt><dd className="font-bold">{money(data.balanceCents)}</dd></div><div className="flex justify-between"><dt className="text-muted">Saldo tras reservar</dt><dd className="font-bold">{money(data.balanceCents - amountCents)}</dd></div></dl><PrimaryButton tone="lime" type="button" className="mt-7 w-full" disabled={saving} onClick={reserveAndStart}>Confirmar y reservar</PrimaryButton></aside></div></>}

      {step === 'race' && race && <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[1.7px] text-forest-2">EN LA PISTA · {phase === 'ready' ? 'SALIDA' : phase === 'middle' ? 'EN CURSO' : 'META'}</p><h1 className="mt-2 text-[35px] font-extrabold tracking-tight">{phase === 'ready' ? 'A sus puestos… sin prisa' : phase === 'middle' ? '¡Ya van por la mitad!' : `${race.winner.name} cruza primero!`}</h1><p className="mt-1 text-sm text-muted">{phase === 'ready' ? 'Los seis caracoles esperan la salida.' : phase === 'middle' ? 'La clasificación puede cambiar hasta el último centímetro.' : 'Se cerró la carrera. Este es el orden de llegada.'}</p></div><span className="rounded-full bg-soft px-4 py-2 text-xs font-bold text-forest-2">{phase === 'ready' ? '0%' : phase === 'middle' ? '52%' : '100%'}</span></div><div className="mt-7"><Track race={race} phase={phase} /></div><div className="mt-5 flex flex-col gap-4 rounded-[18px] bg-forest p-5 text-white sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center overflow-hidden rounded-xl bg-white/10"><img src={selected.portrait} alt="" className="size-full object-contain" /></span><div><p className="text-[10px] font-bold tracking-[1.2px] text-lime">APUESTA DE {firstName.toUpperCase()} · RESERVADA</p><p className="mt-1 text-lg font-extrabold">{selected.name} · {money(amountCents)} · cuota ×{selected.odds}</p><p className="text-xs text-[#bfd5c1]">Pago potencial total {money(potentialPayout)} · Saldo disponible {money(data.balanceCents - amountCents)}</p></div></div>{phase === 'ready' && <PrimaryButton tone="lime" type="button" onClick={simulateRace}><span className="inline-flex items-center gap-2"><Icon name="play" size={15} /> Simular carrera</span></PrimaryButton>}{phase === 'middle' && <span className="text-sm font-bold text-lime">Los caracoles avanzan…</span>}{phase === 'finish' && <span className="text-sm font-bold text-lime">Clasificación lista</span>}</div></>}

      {step === 'result' && race && raceWinner && <section className={`rounded-[22px] border p-6 sm:p-10 ${won ? 'border-[#bfdbb0] bg-soft' : 'border-[#f1cbbb] bg-[#fff1eb]'}`}><p className={`text-[10px] font-bold tracking-[1.7px] ${won ? 'text-forest-2' : 'text-[#9a4d39]'}`}>RESULTADO · APUESTA {won ? 'GANADA' : 'PERDIDA'}</p><h1 className="mt-2 text-[36px] font-extrabold tracking-tight">{won ? `¡Ganaste, ${firstName}!` : 'Esta vez, la meta fue de otro'}</h1><p className="mt-2 text-sm text-muted">{won ? `${selected.name} llegó primero. Tu pronóstico se hizo realidad en la simulación.` : `${raceWinner.name} ganó la carrera y ${selected.name} llegó ${race.standings.findIndex(({ id }) => id === selected.id) + 1}º.`}</p><div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="flex flex-wrap items-center gap-5 rounded-[18px] bg-white/70 p-5"><span className="grid size-32 place-items-center overflow-hidden rounded-[18px]" style={{ backgroundColor: won ? selected.accent : raceWinner.accent }}><img src={won ? selected.portrait : raceWinner.portrait} alt="" className="size-full object-contain" /></span><div><p className="text-[10px] font-bold tracking-[1.2px] text-forest-2">PRIMER LUGAR · 01:00.0</p><h2 className="mt-2 text-3xl font-extrabold">{raceWinner.name}</h2><p className="mt-2 text-sm text-muted">{raceWinner.personality} hasta cruzar la meta.</p><strong className={`mt-4 block text-3xl ${won ? 'text-forest' : 'text-[#a8513d]'}`}>{won ? `+${money(potentialPayout - amountCents)} netos` : `−${money(amountCents)}`}</strong></div></div><div className="rounded-[18px] bg-white p-5"><h2 className="text-lg font-extrabold">Tu saldo, al día</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-muted">Apuesta reservada</dt><dd>{money(amountCents)}</dd></div><div className="flex justify-between"><dt className="text-muted">Cobro total</dt><dd>{won ? money(potentialPayout) : money(0)}</dd></div></dl><div className="mt-5 rounded-xl bg-forest p-4 text-white"><p className="text-[10px] font-bold tracking-[1.1px] text-lime">SALDO FINAL SIMULADO</p><strong className="mt-2 block text-3xl">{money(data.balanceCents - amountCents + (won ? potentialPayout : 0))}</strong></div></div></div><div className="mt-6 rounded-[18px] bg-white/70 p-5"><h2 className="text-lg font-extrabold">Clasificación final</h2><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{race.standings.map((snail, index) => <div key={snail.id} className="flex items-center gap-3 rounded-xl bg-cream px-3 py-2 text-xs font-bold"><img src={snail.portrait} alt="" className="size-7 object-contain" /><span>{index + 1}º · {snail.name}</span></div>)}</div></div><div className="mt-7 flex flex-wrap gap-3"><PrimaryButton tone="lime" type="button" disabled={saving} onClick={() => void saveResult()}>{saving ? 'Guardando…' : 'Guardar resultado y volver'}</PrimaryButton><button type="button" onClick={() => { setStep('choose'); setRace(null); setPhase('ready') }} className="rounded-[11px] border border-line bg-white px-5 py-3 text-sm font-bold text-forest">Elegir otra carrera</button></div><p className="mt-4 text-[11px] text-muted">Todo es una simulación. No se realizan cobros reales.</p></section>}
    </main></div></div>
}
