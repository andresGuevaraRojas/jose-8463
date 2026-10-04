import { z } from 'zod'
import type { BetInput } from '../types/app.ts'

const fullNameSchema = z.string().trim().refine(
  (name) => name.split(/\s+/).length >= 2,
  'Escribe tu nombre y apellido.',
)

const emailSchema = z.string().trim().pipe(z.email('Escribe un correo electrónico válido.'))

export const registrationSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  confirmation: z.string().min(1, 'Confirma tu contraseña.'),
}).refine((values) => values.password === values.confirmation, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmation'],
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

export const unlockSchema = z.object({
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

export function createPaymentSchema() {
  return z.object({
    cardNumber: z.string().transform((value) => value.replace(/\s/g, '')).pipe(z.string().regex(/^\d{16}$/, 'La tarjeta debe tener 16 dígitos.')),
    expiry: z.string().trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA para el vencimiento.'),
    cvv: z.string().trim().regex(/^\d{3,4}$/, 'El CVV debe tener 3 o 4 dígitos.'),
    cardholder: z.string().trim().min(1, 'Escribe el nombre del titular.'),
    amount: z.string().trim().min(1, 'Escribe un monto.')
      .regex(/^\d+(\.\d{1,2})?$/, 'El monto admite como máximo dos decimales.')
      .refine((value) => {
        const amountCents = Math.round(Number(value) * 100)
        return amountCents > 0 && Number.isSafeInteger(amountCents)
      }, 'El monto debe ser mayor que $0 MXN.')
      .transform((value) => Math.round(Number(value) * 100)),
  })
}

export function createBetSchema(availableBalanceCents: number) {
  return z.object({
    amount: z.string().trim().min(1, 'Escribe un importe para tu apuesta.')
      .regex(/^\d+(\.\d{1,2})?$/, 'El importe admite como máximo dos decimales.')
      .transform((value) => Math.round(Number(value) * 100))
      .refine((amountCents) => amountCents > 0 && Number.isSafeInteger(amountCents), 'El importe debe ser mayor que $0 MXN.')
      .refine((amountCents) => amountCents <= availableBalanceCents, 'No alcanza el saldo disponible para esta apuesta.'),
  }) satisfies z.ZodType<{ amount: number }, BetInput>
}
