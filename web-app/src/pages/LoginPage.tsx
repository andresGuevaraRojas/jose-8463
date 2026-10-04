import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/auth-context'
import { useAuthSubmission } from '../auth/useAuthSubmission'
import { AuthPanel } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { loginSchema } from '../services/validationSchemas'

export function LoginPage() {
  const { login } = useAuth()
  const { error, busy, clearError, run } = useAuthSubmission()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const registerPath = '/register'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await run(async () => {
      const result = loginSchema.safeParse({ email, password })
      if (!result.success) throw new Error(result.error.issues[0].message)
      await login(result.data)
    })
  }

  return <AuthPanel
    top={<><span>¿Nuevo por aquí?</span><Link to={registerPath} className="font-bold text-forest-2 hover:underline" onClick={clearError}>Crear cuenta →</Link></>}
    title="Qué gusto verte de nuevo"
    description="Ingresa tus datos para entrar a tu dashboard."
    footer={<p className="mt-5 text-center text-xs text-muted">¿Todavía no tienes cuenta? <Link to={registerPath} className="font-bold text-forest-2 hover:underline" onClick={clearError}>Regístrate gratis</Link></p>}
    error={error} busy={busy} submitLabel="Entrar al club" onSubmit={submit}
  >
    <FormField label="Correo electrónico" id="email" type="email" autoComplete="email" placeholder="tu@correo.com" required value={email} onChange={(event) => setEmail(event.target.value)} />
    <FormField label="Contraseña" id="password" type="password" autoComplete="current-password" placeholder="••••••••" required value={password} onChange={(event) => setPassword(event.target.value)} />
  </AuthPanel>
}
