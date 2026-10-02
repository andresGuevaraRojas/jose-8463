import type { PaymentInput } from '../types/app.ts'
import { createPaymentSchema } from './validationSchemas.ts'

export class PaymentValidationError extends Error {}

export function validatePayment(input: PaymentInput, today = new Date()): number {
  const result = createPaymentSchema(today).safeParse(input)
  if (!result.success) throw new PaymentValidationError(result.error.issues[0].message)
  return result.data.amount
}

export async function processMockPayment(input: PaymentInput): Promise<number> {
  const amountCents = validatePayment(input)
  await new Promise((resolve) => setTimeout(resolve, 650))
  return amountCents
}
