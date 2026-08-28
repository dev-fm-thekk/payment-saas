export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Payment Gateway SDK API',
    version: '1.0.0',
    description: 'Complete API documentation for the Payment Gateway SDK dashboard and services',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
  },
  paths: {
    // ─── AUTH ──────────────────────────────────────────────
    '/auth/login': {
      post: {
        summary: 'Login', tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] }
            }
          }
        },
        responses: { '200': { description: 'Success' } }
      }
    },
    '/auth/logout': { post: { summary: 'Logout', tags: ['Authentication'], responses: { '200': { description: 'Success' } } } },
    '/auth/refresh': { post: { summary: 'Refresh Token', tags: ['Authentication'], responses: { '200': { description: 'Success' } } } },
    '/auth/api-key': {
      post: {
        summary: 'Generate API Key', tags: ['Authentication'], security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: { type: 'object', properties: { companyId: { type: 'string' } }, required: ['companyId'] }
            }
          }
        },
        responses: { '201': { description: 'Success' } }
      }
    },

    // ─── USER ──────────────────────────────────────────────
    '/user/register': {
      post: {
        summary: 'Register User', tags: ['User'],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: { type: 'object', properties: { email: { type: 'string' }, passwordHash: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } }, required: ['email', 'passwordHash', 'name', 'role'] }
            }
          }
        },
        responses: { '201': { description: 'Success' } }
      }
    },
    '/user/{id}': {
      get: {
        summary: 'Get User', tags: ['User'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      },
      patch: {
        summary: 'Update User', tags: ['User'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' }, isVerified: { type: 'boolean' } } } }
          }
        },
        responses: { '200': { description: 'Success' } }
      },
      delete: {
        summary: 'Delete User', tags: ['User'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── COMPANY ───────────────────────────────────────────
    '/company': {
      get: { summary: 'List Companies', tags: ['Company'], security: [{ bearerAuth: [] }], responses: { '200': { description: 'Success' } } },
      post: {
        summary: 'Create Company', tags: ['Company'], security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } } } },
        responses: { '201': { description: 'Success' } }
      }
    },
    '/company/{id}': {
      get: {
        summary: 'Get Company', tags: ['Company'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      },
      patch: {
        summary: 'Update Company', tags: ['Company'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
        responses: { '200': { description: 'Success' } }
      },
      delete: {
        summary: 'Delete Company', tags: ['Company'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── SERVICE ───────────────────────────────────────────
    '/service': {
      post: {
        summary: 'Create Service', tags: ['Service'], security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { companyId: { type: 'string' }, name: { type: 'string' }, currency: { type: 'string' } }, required: ['companyId', 'name', 'currency'] } } } },
        responses: { '201': { description: 'Success' } }
      }
    },
    '/service/company/{companyId}': {
      get: {
        summary: 'List Services by Company', tags: ['Service'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/service/{id}': {
      get: {
        summary: 'Get Service', tags: ['Service'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      },
      patch: {
        summary: 'Update Service', tags: ['Service'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { name: { type: 'string' }, currency: { type: 'string' } } } } } },
        responses: { '200': { description: 'Success' } }
      },
      delete: {
        summary: 'Delete Service', tags: ['Service'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── PROVIDER ──────────────────────────────────────────
    '/provider': {
      post: {
        summary: 'Add Provider Config', tags: ['Provider'], security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { serviceId: { type: 'string' }, provider: { type: 'string', enum: ['stripe', 'razorpay'] }, apiKey: { type: 'string' }, apiSecret: { type: 'string' } }, required: ['serviceId', 'provider', 'apiKey', 'apiSecret'] } } } },
        responses: {
          '201': { description: 'Provider created and webhook registered. Returns provider record and webhookUrl.' }
        }
      }
    },
    '/provider/service/{serviceId}': {
      get: {
        summary: 'List Providers by Service', tags: ['Provider'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'serviceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/provider/{id}': {
      get: {
        summary: 'Get Provider', tags: ['Provider'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      },
      patch: {
        summary: 'Update Provider Config', tags: ['Provider'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { credentialsEncrypted: { type: 'string', description: 'JSON-encoded credentials object' } } } } } },
        responses: { '200': { description: 'Success' } }
      },
      delete: {
        summary: 'Delete Provider Config', tags: ['Provider'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── PAYMENT ───────────────────────────────────────────
    '/payment/pay': {
      post: {
        summary: 'Process Payment', tags: ['Payment'], security: [{ apiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { serviceId: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' }, description: { type: 'string' }, receipt: { type: 'string' } }, required: ['serviceId', 'amount', 'currency'] } } } },
        responses: { '200': { description: 'Success' } }
      }
    },
    '/payment/refund': {
      post: {
        summary: 'Process Refund', tags: ['Payment'], security: [{ apiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { serviceId: { type: 'string' }, paymentId: { type: 'string' }, amount: { type: 'number' }, reason: { type: 'string' } }, required: ['serviceId', 'paymentId'] } } } },
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── TRANSACTION ───────────────────────────────────────
    '/transaction/list/{companyId}/{serviceId}': {
      get: {
        summary: 'List Transactions', tags: ['Transaction'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'serviceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/transaction/{companyId}/{serviceId}/id/info': {
      get: {
        summary: 'Get Transaction Info', tags: ['Transaction'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'serviceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── CLIENT ────────────────────────────────────────────
    '/client': {
      post: {
        summary: 'Create Client', tags: ['Client'], security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, serviceId: { type: 'string' } }, required: ['name', 'email', 'serviceId'] } } } },
        responses: { '201': { description: 'Success' } }
      }
    },
    '/client/{serviceId}': {
      get: {
        summary: 'List Clients by Service', tags: ['Client'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'serviceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/client/details/{id}': {
      get: {
        summary: 'Get Client Details', tags: ['Client'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/client/{id}': {
      patch: {
        summary: 'Update Client', tags: ['Client'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } } } } },
        responses: { '200': { description: 'Success' } }
      },
      delete: {
        summary: 'Delete Client', tags: ['Client'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── INVOICE ───────────────────────────────────────────
    '/invoice': {
      post: {
        summary: 'Create Invoice', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, clientId: { type: 'string' }, amount: { type: 'string' }, currency: { type: 'string' }, status: { type: 'string' }, paymentLinkId: { type: 'string' }, dueDate: { type: 'string' } }, required: ['title', 'description', 'clientId', 'amount', 'currency', 'status', 'paymentLinkId', 'dueDate'] } } } },
        responses: { '201': { description: 'Success' } }
      }
    },
    '/invoice/{companyId}/{serviceId}': {
      get: {
        summary: 'List Invoices', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'serviceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/invoice/{id}': {
      get: {
        summary: 'Get Invoice', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      },
      patch: {
        summary: 'Update Invoice', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { status: { type: 'string' } } } } } },
        responses: { '200': { description: 'Success' } }
      },
      delete: {
        summary: 'Delete Invoice', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },

    // ─── WEBHOOK ───────────────────────────────────────────
    '/webhook': {
      post: {
        summary: 'Create Webhook Endpoint', tags: ['Webhook'],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: { type: 'object', properties: { companyId: { type: 'string' }, provider: { type: 'string' } }, required: ['companyId', 'provider'] }
            }
          }
        },
        responses: { '201': { description: 'Success' }, '400': { description: 'Bad Request' }, '500': { description: 'Internal Server Error' } }
      }
    },
    '/webhook/{companyId}/{provider}/{secret}': {
      post: {
        summary: 'Receive Webhook Event', tags: ['Webhook'],
        description: 'Accepts incoming payment-provider events. No auth required.',
        parameters: [
          { name: 'companyId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'provider', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'secret', in: 'path', required: true, schema: { type: 'string' }, description: 'endpointToken associated with the webhook endpoint' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Raw provider event payload',
                additionalProperties: true,
              }
            }
          }
        },
        responses: {
          '201': { description: 'Event acknowledged (success or ignored)' },
          '404': { description: 'Webhook endpoint not found' },
          '500': { description: 'Processing Error' }
        }
      }
    },

    // ─── PAYMENT LINK ──────────────────────────────────────
    '/payment-link': {
      post: {
        summary: 'Create Payment Link', tags: ['Payment Link'], security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { companyId: { type: 'string' }, provider: { type: 'string' }, url: { type: 'string' }, expiresAt: { type: 'string' } }, required: ['companyId', 'provider', 'url', 'expiresAt'] } } } },
        responses: { '201': { description: 'Success' } }
      }
    },
    '/payment-link/{linkId}': {
      get: {
        summary: 'Get Payment Link', tags: ['Payment Link'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'linkId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    }
  }
};
