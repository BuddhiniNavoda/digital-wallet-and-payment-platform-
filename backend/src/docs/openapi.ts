export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Digital Wallet API',
    version: '1.0.0',
    description: 'Phase 1 authentication endpoints (HS256).',
  },
  servers: [{ url: 'http://localhost:3000' }],
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
  },
};
