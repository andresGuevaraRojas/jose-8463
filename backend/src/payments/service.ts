import { randomInt, randomUUID } from 'node:crypto';
import type { PaymentRepository } from './repository.ts';
import { SIMULATION_CARD_NUMBER, amountSchema, payerEmailSchema, payerIdSchema, paymentRequestSchema, paymentResponseSchema } from './schemas.ts';
import type { PaymentRequest, PaymentResponse } from './schemas.ts';

export interface PaymentResult {
  httpStatus: number;
  body: PaymentResponse;
}

const approvedExpiry = '12/26';
const approvedCvv = '543';

function matchesApprovedCardDetails(payment: PaymentRequest): boolean {
  return payment.card_number === SIMULATION_CARD_NUMBER
    && payment.expiry === approvedExpiry
    && payment.cvv === approvedCvv;
}

function basicFields(input: unknown): Pick<PaymentResponse, 'transaction_amount' | 'payer_id' | 'payer_email'> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { transaction_amount: null, payer_id: null, payer_email: null };
  }
  const value = input as Record<string, unknown>;
  const amount = amountSchema.safeParse(value.transaction_amount);
  const payerId = payerIdSchema.safeParse(value.payer_id);
  const payerEmail = payerEmailSchema.safeParse(value.payer_email);
  return {
    transaction_amount: amount.success ? amount.data : null,
    payer_id: payerId.success ? payerId.data : null,
    payer_email: payerEmail.success ? payerEmail.data : null,
  };
}

export class PaymentService {
  private readonly repository: PaymentRepository;

  constructor(repository: PaymentRepository) {
    this.repository = repository;
  }

  private response(
    status: PaymentResponse['status'],
    code: PaymentResponse['status_detail']['code'],
    message: string,
    fields: Pick<PaymentResponse, 'transaction_amount' | 'payer_id' | 'payer_email'>,
  ): PaymentResponse {
    const id = randomUUID();
    return paymentResponseSchema.parse({
      id,
      status,
      status_detail: { code, message },
      ...fields,
      date_created: new Date().toISOString(),
      authorization_code: status === 'approved' ? randomInt(0, 1_000_000).toString().padStart(6, '0') : null,
      reference: `SNP-${id}`,
    });
  }

  systemError(input: unknown = undefined): PaymentResult {
    return {
      httpStatus: 503,
      body: this.response('error', 'SYSTEM_UNAVAILABLE',
        'SnailPay no puede procesar la solicitud en este momento. Inténtalo más tarde.',
        basicFields(input)),
    };
  }

  async invalidJson(): Promise<PaymentResult> {
    const body = this.response('rejected', 'INVALID_REQUEST', 'El cuerpo de la solicitud no es JSON válido.',
      { transaction_amount: null, payer_id: null, payer_email: null });
    await this.repository.saveRejected(body);
    return { httpStatus: 400, body };
  }

  async process(input: unknown): Promise<PaymentResult> {
    const parsed = paymentRequestSchema.safeParse(input);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'La solicitud de pago no es válida.';
      const body = this.response('rejected', 'INVALID_REQUEST', message, basicFields(input));
      await this.repository.saveRejected(body);
      return { httpStatus: 400, body };
    }

    const payment: PaymentRequest = parsed.data;
    const fields = {
      transaction_amount: payment.transaction_amount,
      payer_id: payment.payer_id,
      payer_email: payment.payer_email,
    };
    if (!matchesApprovedCardDetails(payment)) {
      const body = this.response('rejected', 'CARD_DECLINED',
        'La tarjeta fue rechazada. Verifica los datos de prueba.', fields);
      await this.repository.saveRejected(body);
      return { httpStatus: 402, body };
    }

    const body = this.response('approved', 'APPROVED', 'Recarga aprobada.', fields);
    await this.repository.approveAndCredit(body);
    return { httpStatus: 201, body };
  }
}
