import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Brand } from '../components/Brand'
import { FormField } from '../components/FormField'
import { PrimaryButton } from '../components/PrimaryButton'
import type { AuthScreen } from '../types/app'

export interface AuthFormValues {
  fullName: string
  email: string
  password: string
  confirmation: string
}

interface AuthPageProps {
  screen: AuthScreen
  error: string
  busy: boolean
  onSubmit: (values: AuthFormValues) => Promise<void>
  onNavigate: () => void
  onLogout: () => void
}

export function AuthPage({ screen, error, busy, onSubmit, onNavigate, onLogout }: AuthPageProps) {
  const [values, setValues] = useState<AuthFormValues>({ fullName: '', email: '', password: '', confirmation: '' })
  const isRegister = screen === 'register'
  const isUnlock = screen === 'unlock'

  function update(key: keyof AuthFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(values)
  }

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
      <div className="flex justify-end gap-3 text-xs text-muted">
        {!isUnlock && <><span>{isRegister ? '¿Ya tienes cuenta?' : '¿Nuevo por aquí?'}</span><Link to={isRegister ? '/login' : '/register'} className="font-bold text-forest-2 hover:underline" onClick={onNavigate}>{isRegister ? 'Iniciar sesión' : 'Crear cuenta'} →</Link></>}
        {isUnlock && <span className="font-bold tracking-wide text-forest-2">SESIÓN ACTIVA</span>}
      </div>
      <div className="mx-auto my-auto w-full max-w-[380px] py-12">
        <p className="text-[10px] font-bold tracking-[1.8px] text-forest-2">BIENVENIDO A SNAILCLUB</p>
        <h2 className="mt-3 text-[30px] leading-tight font-extrabold tracking-tight sm:text-[34px]">{isRegister ? 'Únete a la carrera' : isUnlock ? 'Desbloquea tu sesión' : 'Qué gusto verte de nuevo'}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{isRegister ? 'Crea tu cuenta y empieza con un saldo de $0.00.' : isUnlock ? 'Tu sesión sigue activa. Ingresa tu contraseña para ver tus datos.' : 'Ingresa tus datos para entrar a tu dashboard.'}</p>
        <form onSubmit={submit} noValidate className="mt-8 space-y-4">
          {isRegister && <FormField label="Nombre completo" id="full-name" autoComplete="name" placeholder="Ej. María González" required value={values.fullName} onChange={(event) => update('fullName', event.target.value)} />}
          {!isUnlock && <FormField label="Correo electrónico" id="email" type="email" autoComplete="email" placeholder="tu@correo.com" required value={values.email} onChange={(event) => update('email', event.target.value)} />}
          <FormField label="Contraseña" id="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="••••••••" hint={isRegister ? 'Mínimo 8 caracteres' : undefined} required minLength={isRegister ? 8 : undefined} value={values.password} onChange={(event) => update('password', event.target.value)} />
          {isRegister && <FormField label="Confirmar contraseña" id="confirmation" type="password" autoComplete="new-password" placeholder="••••••••" required value={values.confirmation} onChange={(event) => update('confirmation', event.target.value)} />}
          {error && <p role="alert" className="rounded-lg bg-[#fff0e9] px-3 py-2 text-xs font-semibold text-[#9f482e]">{error}</p>}
          <PrimaryButton type="submit" disabled={busy} className="!mt-6 w-full">{busy ? 'Un momento...' : isRegister ? 'Crear mi cuenta' : isUnlock ? 'Desbloquear sesión' : 'Entrar al club'}</PrimaryButton>
        </form>
        {isUnlock ? <button type="button" className="mt-6 w-full text-center text-xs text-muted hover:text-forest" onClick={onLogout}>Cerrar sesión y usar otra cuenta</button> :
          <p className="mt-5 text-center text-xs text-muted">{isRegister ? '¿Ya tienes una cuenta?' : '¿Todavía no tienes cuenta?'} <Link to={isRegister ? '/login' : '/register'} className="font-bold text-forest-2 hover:underline" onClick={onNavigate}>{isRegister ? 'Inicia sesión' : 'Regístrate gratis'}</Link></p>}
      </div>
      <p className="text-center text-[10px] text-muted">🐌 Un juego de datos simulados, sin apuestas reales.</p>
    </section>
  </main>
}
