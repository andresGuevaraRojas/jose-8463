import type { PaymentResponse } from './schemas.ts';

export interface PaymentRepository {
  saveRejected(operation: PaymentResponse): Promise<void>;
  approveAndCredit(operation: PaymentResponse): Promise<void>;
  getBalanceCents(payerId: string): Promise<number>;
  listOperations(): Promise<PaymentResponse[]>;
}

export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly operations = new Map<string, PaymentResponse>();
  private readonly balances = new Map<string, number>();

  async saveRejected(operation: PaymentResponse): Promise<void> {
    if (operation.status !== 'rejected') throw new Error('Only rejected operations can be saved here.');
    this.operations.set(operation.id, operation);
  }

  async approveAndCredit(operation: PaymentResponse): Promise<void> {
    if (operation.status !== 'approved' || operation.payer_id === null || operation.transaction_amount === null) {
      throw new Error('Only complete approved operations can be credited.');
    }
    const cents = Math.round(operation.transaction_amount * 100);
    const balance = this.balances.get(operation.payer_id) ?? 0;
    if (!Number.isSafeInteger(cents) || !Number.isSafeInteger(balance + cents)) {
      throw new Error('The resulting balance is out of range.');
    }
    // Both in-memory writes happen synchronously; a database adapter must use a transaction.
    this.operations.set(operation.id, operation);
    this.balances.set(operation.payer_id, balance + cents);
  }

  async getBalanceCents(payerId: string): Promise<number> {
    return this.balances.get(payerId) ?? 0;
  }

  async listOperations(): Promise<PaymentResponse[]> {
    return [...this.operations.values()];
  }
}
