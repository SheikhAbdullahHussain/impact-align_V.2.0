/** Hand-maintained OpenAPI 3.1 description. Extended per feature as endpoints are added. */
const healthResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthCheckResult' } } },
});

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'ImpactAlign SDG API',
    version: '0.1.0',
    description: 'Phase 1 foundation: health endpoints only.',
  },
  servers: [{ url: 'http://localhost:4000' }],
  tags: [{ name: 'Health', description: 'Liveness and dependency checks (unauthenticated)' }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness',
        responses: {
          '200': {
            description: 'Service is running',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LivenessResult' } },
            },
          },
        },
      },
    },
    '/health/database': {
      get: {
        tags: ['Health'],
        summary: 'MongoDB connectivity',
        responses: {
          '200': healthResponse('MongoDB reachable'),
          '503': healthResponse('MongoDB unreachable'),
        },
      },
    },
    '/health/redis': {
      get: {
        tags: ['Health'],
        summary: 'Redis connectivity',
        responses: {
          '200': healthResponse('Redis reachable'),
          '503': healthResponse('Redis unreachable'),
        },
      },
    },
  },
  components: {
    schemas: {
      HealthCheckResult: {
        type: 'object',
        required: ['status', 'check', 'timestamp'],
        properties: {
          status: { type: 'string', enum: ['ok', 'down'] },
          check: { type: 'string', enum: ['liveness', 'database', 'redis'] },
          timestamp: { type: 'string', format: 'date-time' },
          latencyMs: { type: 'number', minimum: 0 },
        },
      },
      LivenessResult: {
        allOf: [
          { $ref: '#/components/schemas/HealthCheckResult' },
          {
            type: 'object',
            required: ['service', 'version', 'uptimeSeconds'],
            properties: {
              service: { type: 'string' },
              version: { type: 'string' },
              uptimeSeconds: { type: 'number', minimum: 0 },
            },
          },
        ],
      },
      ApiError: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'requestId'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
            },
          },
        },
      },
    },
  },
} as const;
