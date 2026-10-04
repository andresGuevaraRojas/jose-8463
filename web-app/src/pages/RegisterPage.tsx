import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/auth-context'
import { useAuthSubmission } from '../auth/useAuthSubmission'
import { AuthPanel } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { registrationSchema } from '../services/validationSchemas'

export function RegisterPage() {
  const { register } = useAuth()
  const { error, busy, clearError, run } = useAuthSubmission()
  const [values, setValues] = useState({ fullName: '', email: '', password: '', confirmation: '' })
  const loginPath = '/login'

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await run(async () => {
      const result = registrationSchema.safeParse(values)
      if (!result.success) throw new Error(result.error.issues[0].message)
      const { fullName, email, password, confirmation } = result.data
      await register({ fullName, email, password, passwordConfirmation: confirmation })
    })
  }

  return <AuthPanel
    top={<><span>¿Ya tienes cuenta?</span><Link to={loginPath} className="font-bold text-forest-2 hover:underline" onClick={clearError}>Iniciar sesión →</Link></>}
    title="Únete a la carrera"
    description="Crea tu cuenta y empieza con un saldo de $0.00."
    footer={<p className="mt-5 text-center text-xs text-muted">¿Ya tienes una cuenta? <Link to={loginPath} className="font-bold text-forest-2 hover:underline" onClick={clearError}>Inicia sesión</Link></p>}
    error={error} busy={busy} submitLabel="Crear mi cuenta" onSubmit={submit}
  >
    <FormField label="Nombre completo" id="full-name" autoComplete="name" placeholder="Ej. María González" required value={values.fullName} onChange={(event) => update('fullName', event.target.value)} />
    <FormField label="Correo electrónico" id="email" type="email" autoComplete="email" placeholder="tu@correo.com" required value={values.email} onChange={(event) => update('email', event.target.value)} />
    <FormField label="Contraseña" id="password" type="password" autoComplete="new-password" placeholder="••••••••" hint="Mínimo 8 caracteres" required minLength={8} value={values.password} onChange={(event) => update('password', event.target.value)} />
    <FormField label="Confirmar contraseña" id="confirmation" type="password" autoComplete="new-password" placeholder="••••••••" required value={values.confirmation} onChange={(event) => update('confirmation', event.target.value)} />
  </AuthPanel>
}
