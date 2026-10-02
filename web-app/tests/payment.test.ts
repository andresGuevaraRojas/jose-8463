import { describe, expect, it } from 'vitest'
import { processMockPayment, validatePayment } from '../src/services/paymentService.ts'
import type { PaymentInput } from '../src/types/app.ts'

const validPayment: PaymentInput = {
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/30',
  cvv: '123',
  cardholder: 'María González',
  amount: '250.50',
}

describe('SnailPay simulado', () => {
  it('convierte una recarga válida a centavos', () => {
    expect(validatePayment(validPayment, new Date(2026, 9, 1))).toBe(25050)
  })

  it('acepta tarjetas de prueba y montos fuera del antiguo límite', () => {
    expect(validatePayment({ ...validPayment, cardNumber: '1234', amount: '0.01' })).toBe(1)
    expect(validatePayment({ ...validPayment, cardNumber: '4242 4242 4242 4241', amount: '10001' })).toBe(1000100)
  })

  it('rechaza datos incompletos, vencimiento y montos inválidos', () => {
    expect(() => validatePayment({ ...validPayment, cardNumber: '' })).toThrow('número de tarjeta')
    expect(() => validatePayment({ ...validPayment, expiry: '01/20' })).toThrow('vencida')
    expect(() => validatePayment({ ...validPayment, amount: '10.001' })).toThrow('dos decimales')
    expect(() => validatePayment({ ...validPayment, amount: '0' })).toThrow('mayor que $0')
    expect(() => validatePayment({ ...validPayment, cvv: '12' })).toThrow('CVV')
    expect(() => validatePayment({ ...validPayment, cardholder: 'María' })).toThrow('nombre completo')
  })

  it('procesa también la tarjeta antes reservada para rechazos', async () => {
    await expect(processMockPayment({ ...validPayment, cardNumber: '4000 0000 0000 0002' })).resolves.toBe(25050)
  })

  it('aprueba una tarjeta de prueba sin comprobación de dígito de control', async () => {
    await expect(processMockPayment({ ...validPayment, cardNumber: '1234', amount: '0.01' })).resolves.toBe(1)
  })
})
