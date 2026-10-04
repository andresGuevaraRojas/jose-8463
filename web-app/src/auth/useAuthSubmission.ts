import { useState } from 'react'
import { InvalidCredentialsError, UserAlreadyExistsError } from './errors.ts'

export function useAuthSubmission() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setError('')
    setBusy(true)
    try {
      await action()
    } catch (cause) {
      if (cause instanceof UserAlreadyExistsError) setError('Ya existe una cuenta con este correo.')
      else if (cause instanceof InvalidCredentialsError) setError('Correo o contraseña incorrectos.')
      else setError(cause instanceof Error ? cause.message : 'No se pudo continuar. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return { error, busy, clearError: () => setError(''), run }
}
