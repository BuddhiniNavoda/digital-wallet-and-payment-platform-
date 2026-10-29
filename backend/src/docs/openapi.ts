export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Digital Wallet API',
    version: '1.0.0',
    description:
      'Phase 1 wallet API. Request bodies are validated with Zod; invalid input returns 400 VALIDATION_ERROR.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a user and create an empty wallet',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  fullName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created' },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in and receive an access token plus a refresh cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description:
              'Login succeeded. Refresh token is set as an httpOnly cookie.',
          },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Account locked' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Issue a new access token from the refresh cookie',
        responses: {
          '200': { description: 'New access token' },
          '401': { description: 'Missing or invalid refresh cookie' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke the refresh token and clear the cookie',
        responses: {
          '204': { description: 'Logged out' },
        },
      },
    },
    '/wallet/balance': {
      get: {
        summary: 'Return the current wallet balance',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Wallet balance and currency' },
          '401': { description: 'Missing or invalid access token' },
        },
      },
    },
    '/wallet/deposit': {
      post: {
        summary: 'Add simulated funds to the authenticated user wallet',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', exclusiveMinimum: 0, maximum: 10000 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Deposit completed' },
          '400': { description: 'Validation error' },
          '401': { description: 'Missing or invalid access token' },
          '403': { description: 'Wallet is frozen' },
        },
      },
    },
    '/transactions/send': {
      post: {
        summary: 'Send money to another user by email',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['toEmail', 'amount'],
                properties: {
                  toEmail: { type: 'string', format: 'email' },
                  amount: { type: 'number', exclusiveMinimum: 0, maximum: 10000 },
                  note: { type: 'string', maxLength: 200 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Transfer completed' },
          '400': {
            description:
              'Validation error, insufficient funds, or self-transfer',
          },
          '401': { description: 'Missing or invalid access token' },
          '403': { description: 'Wallet is frozen' },
          '404': { description: 'Receiver not found' },
        },
      },
    },
    '/transactions/history': {
      get: {
        summary: 'Paginated transaction history',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['sent', 'received'] },
          },
        ],
        responses: {
          '200': { description: 'Paginated list of transactions' },
          '401': { description: 'Missing or invalid access token' },
        },
      },
    },
  },
};
