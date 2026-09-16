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
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'clientId', 'amount', 'currency', 'dueDate'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  clientId: { type: 'string', format: 'uuid' },
                  amount: { type: 'string', description: 'Amount in minor units (e.g. paise, cents)' },
                  currency: { type: 'string', example: 'INR' },
                  status: { type: 'string', enum: ['draft', 'pending', 'paid', 'failed', 'expired'], default: 'draft' },
                  paymentLinkId: { type: 'string', format: 'uuid' },
                  dueDate: { type: 'string', format: 'date-time' },
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Invoice created successfully' },
          '400': { description: 'Validation error' },
          '404': { description: 'Client not found' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/invoice/client/{clientId}': {
      get: {
        summary: 'List Invoices by Client', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'clientId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'UUID of the client' }],
        responses: {
          '200': { description: 'List of invoices for the client' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/invoice/{id}': {
      get: {
        summary: 'Get Invoice', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Invoice details' },
          '404': { description: 'Invoice not found' },
          '500': { description: 'Internal Server Error' }
        }
      },
      patch: {
        summary: 'Update Invoice', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  amount: { type: 'string', description: 'Amount in minor units' },
                  currency: { type: 'string' },
                  status: { type: 'string', enum: ['draft', 'pending', 'paid', 'failed', 'expired'] },
                  paymentLinkId: { type: 'string', format: 'uuid' },
                  dueDate: { type: 'string', format: 'date-time' },
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Updated invoice' },
          '400': { description: 'Validation error' },
          '404': { description: 'Invoice not found' },
          '500': { description: 'Internal Server Error' }
        }
      },
      delete: {
        summary: 'Delete Invoice', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Deleted invoice record' },
          '404': { description: 'Invoice not found' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/invoice/notify/{id}': {
      post: {
        summary: 'Send Invoice Notification', tags: ['Invoice'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Invoice sent successfully' },
          '400': { description: 'Client email not found' },
          '404': { description: 'Invoice or client not found' },
          '500': { description: 'Internal Server Error / Email Failed' }
        }
      }
    },

    // ─── WEBHOOK ───────────────────────────────────────────
    '/webhook': {
      post: {
        summary: 'Create Webhook Endpoint', tags: ['Webhook'], security: [{ bearerAuth: [] }],
        description: 'Registers a new webhook on the payment provider and creates a local receive endpoint. The local URL is auto-generated and registered with the provider via the adapter.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['providerId', 'companyId', 'events'],
                properties: {
                  providerId: { type: 'string', format: 'uuid', description: 'ID of the connected provider row' },
                  companyId: { type: 'string', format: 'uuid', description: 'ID of the company' },
                  events: { type: 'array', items: { type: 'string' }, description: 'Provider event names to subscribe to', example: ['payment.captured', 'refund.created'] },
                  alert_email: { type: 'string', format: 'email', description: 'Email for provider failure alerts (optional)' },
                  accountId: { type: 'string', description: 'Razorpay sub-account ID (optional)' },
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Webhook registered on provider and local endpoint created' }, '400': { description: 'Validation error' }, '404': { description: 'Provider not found' }, '500': { description: 'Internal Server Error' } }
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
    '/webhook/{companyId}/{provider}': {
      get: {
        summary: 'Get Webhook Endpoints', tags: ['Webhook'], security: [{ bearerAuth: [] }],
        description: 'Returns a list of webhook endpoints registered for the given company and provider.',
        parameters: [
          { name: 'companyId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID of the company' },
          { name: 'provider', in: 'path', required: true, schema: { type: 'string' }, description: 'Payment provider name (e.g. stripe, razorpay)' }
        ],
        responses: {
          '200': { description: 'List of webhook endpoints' },
          '400': { description: 'Bad Request' },
          '404': { description: 'Not Found' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/webhook/event/logs/{webhookId}': {
      get: {
        summary: 'Get Webhook Event Logs', tags: ['Webhook'], security: [{ bearerAuth: [] }],
        description: 'Returns the event logs for a specific webhook endpoint.',
        parameters: [
          { name: 'webhookId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID of the webhook endpoint' }
        ],
        responses: {
          '200': { description: 'Webhook event logs' },
          '400': { description: 'Bad Request' },
          '404': { description: 'Not Found' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },

    // ─── PAYMENT LINK ──────────────────────────────────────
    '/payment-link': {
      post: {
        summary: 'Create Payment Link', tags: ['Payment Link'], security: [{ bearerAuth: [] }],
        description: 'Calls the resolved payment provider adapter to generate a real payment link, then persists the resulting URL.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['providerId', 'companyId', 'amount', 'currency', 'callback_url'],
                properties: {
                  providerId: { type: 'string', format: 'uuid', description: 'ID of the connected provider row' },
                  companyId: { type: 'string', format: 'uuid', description: 'ID of the company' },
                  amount: { type: 'integer', description: 'Amount in smallest currency unit (paise / cents)', example: 50000 },
                  currency: { type: 'string', example: 'INR' },
                  description: { type: 'string' },
                  callback_url: { type: 'string', format: 'uri', description: 'URL to redirect after payment' },
                  callback_method: { type: 'string', example: 'get' },
                  upi_link: { type: 'boolean', description: 'Razorpay: create UPI-only link' },
                  metadata: { type: 'object', additionalProperties: { type: 'string' } },
                  customer: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      contact: { type: 'string' },
                    },
                    required: ['name', 'email', 'contact'],
                  },
                  expiresAt: { type: 'string', format: 'date-time' },
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Payment link created on provider and record saved' },
          '400': { description: 'Validation error' },
          '404': { description: 'Provider not found' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/payment-link/company/{companyId}': {
      get: {
        summary: 'List Payment Links by Company', tags: ['Payment Link'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'UUID of the company' }],
        responses: {
          '200': { description: 'List of payment links for the company' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/payment-link/{id}': {
      get: {
        summary: 'Get Payment Link', tags: ['Payment Link'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Payment link details' },
          '404': { description: 'Payment link not found' },
          '500': { description: 'Internal Server Error' }
        }
      },
      patch: {
        summary: 'Update Payment Link', tags: ['Payment Link'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                  status: { type: 'string', enum: ['active', 'expired', 'consumed'] },
                  expiresAt: { type: 'string', format: 'date-time' },
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Updated payment link' },
          '400': { description: 'Validation error' },
          '404': { description: 'Payment link not found' },
          '500': { description: 'Internal Server Error' }
        }
      },
      delete: {
        summary: 'Delete Payment Link', tags: ['Payment Link'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Deleted payment link record' },
          '404': { description: 'Payment link not found' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },

    // ─── PROVIDER ──────────────────────────────────────────
    '/provider': {
      post: {
        summary: 'Create Provider', tags: ['Provider'], security: [{ bearerAuth: [] }],
        description: 'Connect a payment provider (razorpay, stripe, or paypal) to a company. Each company may have at most one instance of each provider type.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['companyId', 'type', 'credentials'],
                properties: {
                  companyId: { type: 'string', format: 'uuid', description: 'UUID of the company' },
                  type: { type: 'string', enum: ['razorpay', 'stripe', 'paypal'], description: 'Payment provider type' },
                  credentials: {
                    type: 'object',
                    description: 'Provider-specific credentials (e.g. API keys, secrets)',
                    additionalProperties: true,
                    example: { keyId: 'rzp_live_xxx', keySecret: 'yyy' }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Provider connected successfully' },
          '400': { description: 'Validation error' },
          '409': { description: 'Provider of this type already exists for the company' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/provider/company/{companyId}': {
      get: {
        summary: 'List Providers by Company', tags: ['Provider'], security: [{ bearerAuth: [] }],
        description: 'Returns all payment providers connected to a given company.',
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'UUID of the company' }],
        responses: {
          '200': { description: 'List of providers for the company' },
          '500': { description: 'Internal Server Error' }
        }
      }
    },
    '/provider/{id}': {
      get: {
        summary: 'Get Provider', tags: ['Provider'], security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Provider details' },
          '404': { description: 'Provider not found' },
          '500': { description: 'Internal Server Error' }
        }
      },
      patch: {
        summary: 'Update Provider Credentials', tags: ['Provider'], security: [{ bearerAuth: [] }],
        description: 'Update the stored credentials for a connected provider.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  credentials: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Updated provider-specific credentials',
                    example: { keyId: 'rzp_live_zzz', keySecret: 'aaa' }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Updated provider record' },
          '400': { description: 'Validation error' },
          '404': { description: 'Provider not found' },
          '500': { description: 'Internal Server Error' }
        }
      },
      delete: {
        summary: 'Delete Provider', tags: ['Provider'], security: [{ bearerAuth: [] }],
        description: 'Disconnect and remove a payment provider from a company.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Deleted provider record' },
          '404': { description: 'Provider not found' },
          '500': { description: 'Internal Server Error' }
        }
      }
    }
  }
};
