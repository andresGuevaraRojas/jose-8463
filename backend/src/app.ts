import express, { type Express, type ErrorRequestHandler } from 'express';
import { simulateSystemError, simulateSystemErrorAfterParseFailure } from './middleware/simulate-system-error.ts';
import { InMemoryPaymentRepository } from './payments/repository.ts';
import type { PaymentRepository } from './payments/repository.ts';
import { PaymentService } from './payments/service.ts';

export function createApp(repository: PaymentRepository = new InMemoryPaymentRepository()): Express {
  const app = express();
  const payments = new PaymentService(repository);

  app.use(express.json({ limit: '16kb' }));

  app.get('/', (_req, res) => {
    res.send('Hello World!');
  });

  app.post('/api/pay', simulateSystemError(payments), async (req, res, next) => {
    try {
      const result = await payments.process(req.body);
      res.status(result.httpStatus).json(result.body);
    } catch (error) {
      next(error);
    }
  });

  app.use(simulateSystemErrorAfterParseFailure(payments));

  const handleError: ErrorRequestHandler = (error: unknown, req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      void payments.invalidJson().then((result) => {
        res.status(result.httpStatus).json(result.body);
      }).catch(() => {
        res.status(503).json(payments.systemError(req.body).body);
      });
      return;
    }

    res.status(503).json(payments.systemError(req.body).body);
  };
  app.use(handleError);

  return app;
}
