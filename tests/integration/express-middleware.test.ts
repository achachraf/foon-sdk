import express, { Request, Response } from 'express';
import request from 'supertest';
import { createFonRouter } from '../../src/express';
import { MockProvider } from '../helpers/MockProvider';

describe('Express Middleware Integration', () => {
  const userSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'object',
        properties: {
          given: { type: 'string' },
          family: { type: 'string' },
        },
        required: ['given', 'family'],
      },
      email: { type: 'string', format: 'email' },
    },
    required: ['name', 'email'],
  };

  it('should transform request body on FOON route', async () => {
    const app = express();
    app.use(express.json());

    const provider = new MockProvider();
    provider.setMockPlan({
      assignments: [
        { from: '$.firstname', to: '$.name.given', confidence: 0.95 },
        { from: '$.lastname', to: '$.name.family', confidence: 0.95 },
        { from: '$.email', to: '$.email', confidence: 1.0 },
      ],
      drops: [],
      warnings: [],
    });

    const fonRouter = createFonRouter({
      provider,
      prefix: '/foon',
    });

    // Handler that echoes the body (should be transformed on FOON route)
    const handler = (req: Request, res: Response) => {
      res.json(req.body);
    };

    fonRouter.post('/users', {
      schema: userSchema,
      handler,
    });

    app.use(fonRouter.getRouter());

    // Test FOON route (should transform)
    const fonResponse = await request(app)
      .post('/foon/users')
      .send({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      })
      .expect(200);

    expect(fonResponse.body).toEqual({
      name: {
        given: 'John',
        family: 'Doe',
      },
      email: 'john@example.com',
    });

    expect(fonResponse.headers['x-fon-trace-id']).toBeDefined();

    // Test original route (should NOT transform)
    const originalResponse = await request(app)
      .post('/users')
      .send({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      })
      .expect(200);

    // Original route returns untransformed body
    expect(originalResponse.body).toEqual({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
    });
  });

  it('should return error when transformation fails', async () => {
    const app = express();
    app.use(express.json());

    const provider = new MockProvider();
    provider.setMockPlan({
      assignments: [
        { from: '$.firstname', to: '$.name.given', confidence: 0.5 }, // Too low
      ],
      drops: [],
      warnings: [],
    });

    const fonRouter = createFonRouter({
      provider,
      confidenceThreshold: 0.85,
    });

    const handler = (req: Request, res: Response) => {
      res.json(req.body);
    };

    fonRouter.post('/users', {
      schema: userSchema,
      handler,
    });

    app.use(fonRouter.getRouter());

    const response = await request(app)
      .post('/foon/users')
      .send({
        firstname: 'John',
      })
      .expect(400);

    expect(response.body.error).toBe('CONFIDENCE_TOO_LOW');
    expect(response.body.traceId).toBeDefined();
  });

  it('should support custom error handler', async () => {
    const app = express();
    app.use(express.json());

    const provider = new MockProvider();
    provider.setMockPlan({
      assignments: [{ from: '$.firstname', to: '$.name.given', confidence: 0.5 }],
      drops: [],
      warnings: [],
    });

    const customErrorHandler = jest.fn((error, req, res, next) => {
      res.status(422).json({
        custom: true,
        message: 'Custom error',
        originalError: error.category,
      });
    });

    const fonRouter = createFonRouter({
      provider,
      confidenceThreshold: 0.85,
      onError: customErrorHandler,
    });

    const handler = (req: Request, res: Response) => {
      res.json(req.body);
    };

    fonRouter.post('/users', {
      schema: userSchema,
      handler,
    });

    app.use(fonRouter.getRouter());

    const response = await request(app)
      .post('/foon/users')
      .send({
        firstname: 'John',
      })
      .expect(422);

    expect(response.body.custom).toBe(true);
    expect(response.body.originalError).toBe('CONFIDENCE_TOO_LOW');
    expect(customErrorHandler).toHaveBeenCalled();
  });

  it('should support custom prefix', async () => {
    const app = express();
    app.use(express.json());

    const provider = new MockProvider();

    const fonRouter = createFonRouter({
      provider,
      prefix: '/api/fon',
    });

    const handler = (req: Request, res: Response) => {
      res.json({ success: true });
    };

    fonRouter.post('/test', {
      schema: { type: 'object' },
      handler,
    });

    app.use(fonRouter.getRouter());

    await request(app).post('/api/fon/test').send({}).expect(200);
  });

  it('should support disabling original route creation', async () => {
    const app = express();
    app.use(express.json());

    const provider = new MockProvider();

    const fonRouter = createFonRouter({
      provider,
      createOriginalRoutes: false,
    });

    const handler = (req: Request, res: Response) => {
      res.json({ success: true });
    };

    fonRouter.post('/test', {
      schema: { type: 'object' },
      handler,
    });

    app.use(fonRouter.getRouter());

    // FOON route should work
    await request(app).post('/foon/test').send({}).expect(200);

    // Original route should NOT exist
    await request(app).post('/test').send({}).expect(404);
  });
});
