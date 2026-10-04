import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import type { PaymentService } from '../payments/service.ts';

function isSimulationRequest(req: Request): boolean {
  return req.get('X-SnailPay-Simulate-System-Error') === 'true';
}

function sendSystemError(payments: PaymentService, req: Request, res: Response): void {
  const result = payments.systemError(req.body);
  res.status(result.httpStatus).json(result.body);
}

export function simulateSystemError(payments: PaymentService): RequestHandler {
  return (req, res, next) => {
    if (!isSimulationRequest(req)) return next();
    sendSystemError(payments, req, res);
  };
}

export function simulateSystemErrorAfterParseFailure(payments: PaymentService): ErrorRequestHandler {
  return (error, req, res, next) => {
    if (req.path !== '/api/pay' || !isSimulationRequest(req)) return next(error);
    sendSystemError(payments, req, res);
  };
}
