import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/auth-context'
import { useAuthSubmission } from '../auth/useAuthSubmission'
import { AuthPanel } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { unlockSchema } from '../services/validationSchemas'

export function UnlockPage() {
  const { unlock, logout } = useAuth()
  const { error, busy, run } = useAuthSubmission()
  const [password, setPassword] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await run(async () => {
      const result = unlockSchema.safeParse({ password })
      if (!result.success) throw new Error(result.error.issues[0].message)
      await unlock(result.data.password)
    })
  }

  return <AuthPanel
    top={<span className="font-bold tracking-wide text-forest-2">SESIÓN ACTIVA</span>}
    title="Desbloquea tu sesión"
    description="Tu sesión sigue activa. Ingresa tu contraseña para ver tus datos."
    footer={<button type="button" className="mt-6 w-full text-center text-xs text-muted hover:text-forest" onClick={logout}>Cerrar sesión y usar otra cuenta</button>}
    error={error} busy={busy} submitLabel="Desbloquear sesión" onSubmit={submit}
  >
    <FormField label="Contraseña" id="password" type="password" autoComplete="current-password" placeholder="••••••••" required value={password} onChange={(event) => setPassword(event.target.value)} />
  </AuthPanel>
}
