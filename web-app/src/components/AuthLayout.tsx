import type { FormEventHandler, ReactNode } from 'react'
import { Outlet } from 'react-router'
import { Brand } from './Brand'
import { PrimaryButton } from './PrimaryButton'

export function AuthLayout() {
  return <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[44%_56%]">
    <aside className="relative flex min-h-[190px] flex-col justify-between overflow-hidden bg-forest px-7 py-7 text-white sm:px-11 lg:min-h-screen lg:px-[8%] lg:py-10">
      <Brand light />
      <div className="relative z-10 mt-9 lg:mt-12">
        <p className="text-[10px] font-bold tracking-[2px] text-lime">EL CLUB DE LA VELOCIDAD RELATIVA</p>
        <h1 className="mt-5 text-[36px] leading-[1.11] font-extrabold tracking-[-2px] sm:text-[50px] xl:text-[66px]">La emoción va<br /><span className="text-lime">a su ritmo.</span></h1>
        <p className="mt-5 max-w-[360px] text-[15px] leading-relaxed text-[#c5d8ca]">Seis caracoles. Un día de carreras.<br />Toda la emoción de seguir cada victoria.</p>
        <div aria-hidden="true" className="relative mt-8 hidden h-[240px] lg:block">
          <div className="absolute top-0 left-[22%] size-[235px] rounded-full bg-lime" />
          <span className="absolute top-8 left-[28%] text-[150px] leading-none drop-shadow-xl">🐌</span>
        </div>
      </div>
      <div className="relative z-10 mt-8 hidden justify-between text-[9px] font-bold tracking-[1.8px] text-lime lg:flex"><span>✳ TEMPORADA SIMULADA</span><span>01 / 06</span></div>
    </aside>
    <section className="flex flex-col px-6 py-7 sm:px-12 lg:px-[10%] lg:py-10">
      <Outlet />
      <p className="text-center text-[10px] text-muted">🐌 Un juego de datos simulados, sin apuestas reales.</p>
    </section>
  </main>
}

interface AuthPanelProps {
  top: ReactNode
  title: string
  description: string
  footer: ReactNode
  error: string
  busy: boolean
  submitLabel: string
  onSubmit: FormEventHandler<HTMLFormElement>
  children: ReactNode
}

export function AuthPanel({ top, title, description, footer, error, busy, submitLabel, onSubmit, children }: AuthPanelProps) {
  return <>
    <div className="flex justify-end gap-3 text-xs text-muted">{top}</div>
    <div className="mx-auto my-auto w-full max-w-[380px] py-12">
      <p className="text-[10px] font-bold tracking-[1.8px] text-forest-2">BIENVENIDO A SNAILCLUB</p>
      <h2 className="mt-3 text-[30px] leading-tight font-extrabold tracking-tight sm:text-[34px]">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        {children}
        {error && <p role="alert" className="rounded-lg bg-[#fff0e9] px-3 py-2 text-xs font-semibold text-[#9f482e]">{error}</p>}
        <PrimaryButton type="submit" disabled={busy} className="!mt-6 w-full">{busy ? 'Un momento...' : submitLabel}</PrimaryButton>
      </form>
      {footer}
    </div>
  </>
}
