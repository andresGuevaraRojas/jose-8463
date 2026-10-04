import { describe, expect, it } from 'vitest'
import { createBetSchema, loginSchema, registrationSchema, unlockSchema } from '../src/services/validationSchemas.ts'

const validRegistration = {
  fullName: 'María González',
  email: 'maria@example.com',
  password: 'clave-segura',
  confirmation: 'clave-segura',
}

describe('validaciones de acceso', () => {
  it('normaliza nombre y correo en el registro', () => {
    const result = registrationSchema.parse({
      ...validRegistration,
      fullName: '  María González  ',
      email: '  maria@example.com  ',
    })
    expect(result.fullName).toBe('María González')
    expect(result.email).toBe('maria@example.com')
  })

  it('rechaza datos incompletos y contraseñas distintas', () => {
    expect(registrationSchema.safeParse({ ...validRegistration, fullName: 'María' }).success).toBe(false)
    expect(registrationSchema.safeParse({ ...validRegistration, email: 'correo inválido' }).success).toBe(false)
    expect(registrationSchema.safeParse({ ...validRegistration, password: 'corta' }).success).toBe(false)
    const result = registrationSchema.safeParse({ ...validRegistration, confirmation: 'otra-clave' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toEqual(['confirmation'])
  })

  it('exige credenciales al iniciar o desbloquear sesión', () => {
    expect(loginSchema.safeParse({ email: 'mal', password: 'clave' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'maria@example.com', password: '' }).success).toBe(false)
    expect(unlockSchema.safeParse({ password: '' }).success).toBe(false)
  })

  it('valida el importe de una apuesta contra el saldo disponible', () => {
    const schema = createBetSchema(10_000)
    expect(schema.parse({ amount: '20.50' }).amount).toBe(2050)
    expect(schema.safeParse({ amount: '' }).success).toBe(false)
    expect(schema.safeParse({ amount: '0' }).success).toBe(false)
    expect(schema.safeParse({ amount: '100.01' }).success).toBe(false)
    expect(schema.safeParse({ amount: 'importe' }).success).toBe(false)
  })
})
