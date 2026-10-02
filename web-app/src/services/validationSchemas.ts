import { z } from 'zod'

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

export function createPaymentSchema(today = new Date()) {
  return z.object({
    cardNumber: z.string().trim().min(1, 'Escribe un número de tarjeta.'),
    expiry: z.string().trim()
      .regex(/^(\d{2})\/(\d{2})$/, 'Usa el formato MM/AA para el vencimiento.')
      .refine((value) => {
        const [month, shortYear] = value.split('/').map(Number)
        const year = 2000 + shortYear
        return month >= 1 && month <= 12 &&
          (year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1))
      }, 'La tarjeta está vencida o su fecha no es válida.'),
    cvv: z.string().trim().regex(/^\d{3,4}$/, 'El CVV debe tener 3 o 4 dígitos.'),
    cardholder: z.string().trim().refine(
      (name) => name.split(/\s+/).length >= 2,
      'Escribe el nombre completo del titular.',
    ),
    amount: z.string().trim().min(1, 'Escribe un monto.')
      .regex(/^\d+(\.\d{1,2})?$/, 'El monto admite como máximo dos decimales.')
      .refine((value) => {
        const amountCents = Math.round(Number(value) * 100)
        return amountCents > 0 && Number.isSafeInteger(amountCents)
      }, 'El monto debe ser mayor que $0 MXN.')
      .transform((value) => Math.round(Number(value) * 100)),
  })
}
