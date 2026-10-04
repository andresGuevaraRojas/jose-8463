import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../dist/app.js';
import { InMemoryPaymentRepository } from '../dist/payments/repository.js';
import { paymentResponseSchema } from '../dist/payments/schemas.js';

const payerId = 'a'.repeat(64);
const validPayment = {
  card_number: '1234123412341234',
  expiry: '12/26',
  cvv: '543',
  full_name: 'Ana',
  transaction_amount: 10.25,
  payer_id: payerId,
  payer_email: 'ana@example.com',
};

test('POST /api/pay simula cobros y preserva el saldo ante errores', async (t) => {
  const repository = new InMemoryPaymentRepository();
  const server = createApp(repository).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/api/pay`;

  async function pay(body, headers = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    paymentResponseSchema.parse(result);
    assert.equal(result.reference, `SNP-${result.id}`);
    return { status: response.status, body: result };
  }

  await t.test('aprueba la tarjeta indicada y acredita centavos', async () => {
    const result = await pay(validPayment);
    assert.equal(result.status, 201);
    assert.equal(result.body.status, 'approved');
    assert.equal(result.body.status_detail.code, 'APPROVED');
    assert.equal(result.body.transaction_amount, 10.25);
    assert.equal(result.body.payer_id, payerId);
    assert.equal(result.body.payer_email, 'ana@example.com');
    assert.match(result.body.authorization_code, /^\d{6}$/);
    assert.equal(await repository.getBalanceCents(payerId), 1025);
  });

  await t.test('acepta el monto mínimo y mantiene saldos separados por usuario', async () => {
    const anotherPayerId = 'b'.repeat(64);
    const result = await pay({ ...validPayment, transaction_amount: 0.01, payer_id: anotherPayerId });
    assert.equal(result.status, 201);
    assert.equal(await repository.getBalanceCents(anotherPayerId), 1);
    assert.equal(await repository.getBalanceCents(payerId), 1025);
  });

  await t.test('rechaza otra tarjeta sin acreditar saldo', async () => {
    const result = await pay({ ...validPayment, card_number: '4000000000000002' });
    assert.equal(result.status, 402);
    assert.equal(result.body.status, 'rejected');
    assert.equal(result.body.status_detail.code, 'CARD_DECLINED');
    assert.equal(result.body.authorization_code, null);
    assert.equal(await repository.getBalanceCents(payerId), 1025);
  });

  await t.test('rechaza montos y nombres inválidos sin acreditar saldo', async () => {
    for (const body of [
      { ...validPayment, transaction_amount: 0 },
      { ...validPayment, transaction_amount: 1.001 },
      { ...validPayment, transaction_amount: 1.00000000001 },
      { ...validPayment, full_name: '   ' },
      { ...validPayment, payer_id: 'invalid' },
    ]) {
      const result = await pay(body);
      assert.equal(result.status, 400);
      assert.equal(result.body.status_detail.code, 'INVALID_REQUEST');
      assert.equal(result.body.authorization_code, null);
      assert.ok(result.body.status_detail.message.length > 0);
    }
    assert.equal(await repository.getBalanceCents(payerId), 1025);
  });

  await t.test('rechaza datos de tarjeta con formato válido que no coinciden', async () => {
    for (const body of [
      { ...validPayment, card_number: '4111111111111112' },
      { ...validPayment, expiry: '11/26' },
      { ...validPayment, cvv: '544' },
    ]) {
      const result = await pay(body);
      assert.equal(result.status, 402);
      assert.equal(result.body.status_detail.code, 'CARD_DECLINED');
    }
    assert.equal(await repository.getBalanceCents(payerId), 1025);
  });

  await t.test('rechaza JSON malformado con todos los campos de respuesta', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    paymentResponseSchema.parse(body);
    assert.equal(body.status_detail.code, 'INVALID_REQUEST');
    assert.equal(body.transaction_amount, null);
    assert.equal(body.payer_id, null);
    assert.equal(await repository.getBalanceCents(payerId), 1025);
  });

  await t.test('simula indisponibilidad sin guardar operación ni acreditar saldo', async () => {
    const count = (await repository.listOperations()).length;
    const result = await pay(validPayment, { 'X-SnailPay-Simulate-System-Error': 'true' });
    assert.equal(result.status, 503);
    assert.equal(result.body.status, 'error');
    assert.equal(result.body.status_detail.code, 'SYSTEM_UNAVAILABLE');
    assert.equal(result.body.transaction_amount, 10.25);
    assert.equal(result.body.payer_id, payerId);
    assert.equal(result.body.authorization_code, null);
    assert.equal((await repository.listOperations()).length, count);
    assert.equal(await repository.getBalanceCents(payerId), 1025);

    const malformed = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SnailPay-Simulate-System-Error': 'true' },
      body: '{',
    });
    assert.equal(malformed.status, 503);
    const malformedBody = await malformed.json();
    paymentResponseSchema.parse(malformedBody);
    assert.equal(malformedBody.status_detail.code, 'SYSTEM_UNAVAILABLE');
    assert.equal((await repository.listOperations()).length, count);
    assert.equal(await repository.getBalanceCents(payerId), 1025);
  });

  await t.test('no guarda datos de tarjeta en el repositorio', async () => {
    const operations = await repository.listOperations();
    for (const operation of operations) {
      for (const field of ['card_number', 'expiry', 'cvv', 'full_name']) {
        assert.ok(!(field in operation));
      }
    }
    assert.ok(!JSON.stringify(operations).includes(validPayment.card_number));
  });
});
