import type { OpenAPIV3_1 } from 'openapi-types'

export const openApiSpec: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'NotaBener API',
    version: '1.0.0',
    description: 'API for NotaBener - Create, send, and manage invoices with payment integration',
    contact: {
      name: 'NotaBener Support',
      email: 'support@notabener.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://notabener.com/api',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/invoices': {
      get: {
        summary: 'List invoices',
        description: 'Get a paginated list of invoices',
        tags: ['Invoices'],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/StatusParam' },
        ],
        responses: {
          '200': {
            description: 'List of invoices',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invoices: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Invoice' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create invoice',
        description: 'Create a new invoice',
        tags: ['Invoices'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateInvoiceInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Invoice created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/invoices/{id}': {
      get: {
        summary: 'Get invoice',
        description: 'Get a single invoice by ID',
        tags: ['Invoices'],
        parameters: [
          { $ref: '#/components/parameters/InvoiceIdParam' },
        ],
        responses: {
          '200': {
            description: 'Invoice details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update invoice',
        description: 'Update an existing invoice',
        tags: ['Invoices'],
        parameters: [
          { $ref: '#/components/parameters/InvoiceIdParam' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateInvoiceInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Invoice updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete invoice',
        description: 'Delete an invoice',
        tags: ['Invoices'],
        parameters: [
          { $ref: '#/components/parameters/InvoiceIdParam' },
        ],
        responses: {
          '200': {
            description: 'Invoice deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/invoices/{id}/send': {
      post: {
        summary: 'Send invoice',
        description: 'Send invoice to client via email',
        tags: ['Invoices'],
        parameters: [
          { $ref: '#/components/parameters/InvoiceIdParam' },
        ],
        responses: {
          '200': {
            description: 'Invoice sent',
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/clients': {
      get: {
        summary: 'List clients',
        description: 'Get a paginated list of clients',
        tags: ['Clients'],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
        ],
        responses: {
          '200': {
            description: 'List of clients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    clients: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Client' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create client',
        description: 'Create a new client',
        tags: ['Clients'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateClientInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Client created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Client' },
              },
            },
          },
        },
      },
    },
    '/clients/{id}': {
      get: {
        summary: 'Get client',
        tags: ['Clients'],
        parameters: [
          { $ref: '#/components/parameters/ClientIdParam' },
        ],
        responses: {
          '200': {
            description: 'Client details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Client' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update client',
        tags: ['Clients'],
        parameters: [
          { $ref: '#/components/parameters/ClientIdParam' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateClientInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Client updated',
          },
        },
      },
      delete: {
        summary: 'Delete client',
        tags: ['Clients'],
        parameters: [
          { $ref: '#/components/parameters/ClientIdParam' },
        ],
        responses: {
          '200': {
            description: 'Client deleted',
          },
        },
      },
    },
    '/payments': {
      get: {
        summary: 'List payments',
        tags: ['Payments'],
        responses: {
          '200': {
            description: 'List of payments',
          },
        },
      },
    },
    '/analytics': {
      get: {
        summary: 'Get analytics',
        description: 'Get comprehensive analytics data',
        tags: ['Analytics'],
        parameters: [
          {
            name: 'teamId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Team ID for team analytics',
          },
          {
            name: 'months',
            in: 'query',
            schema: { type: 'integer', default: 12 },
            description: 'Number of months for revenue chart',
          },
          {
            name: 'format',
            in: 'query',
            schema: { type: 'string', enum: ['json', 'csv'] },
            description: 'Response format',
          },
        ],
        responses: {
          '200': {
            description: 'Analytics data',
          },
        },
      },
    },
    '/webhooks': {
      get: {
        summary: 'List webhooks',
        tags: ['Webhooks'],
        parameters: [
          {
            name: 'teamId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'List of webhooks',
          },
        },
      },
      post: {
        summary: 'Create webhook',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateWebhookInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Webhook created',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key authentication',
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 },
        description: 'Page number',
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 20, maximum: 100 },
        description: 'Items per page',
      },
      StatusParam: {
        name: 'status',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED'],
        },
        description: 'Filter by status',
      },
      InvoiceIdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Invoice ID',
      },
      ClientIdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Client ID',
      },
    },
    schemas: {
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          invoiceNumber: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED'],
          },
          subtotal: { type: 'number' },
          taxAmount: { type: 'number' },
          total: { type: 'number' },
          clientName: { type: 'string' },
          clientEmail: { type: 'string' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/InvoiceItem' },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      InvoiceItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          quantity: { type: 'integer' },
          price: { type: 'number' },
        },
      },
      CreateInvoiceInput: {
        type: 'object',
        required: ['clientName', 'clientEmail', 'items'],
        properties: {
          clientId: { type: 'string' },
          clientName: { type: 'string' },
          clientEmail: { type: 'string' },
          clientPhone: { type: 'string' },
          clientAddress: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
          taxRate: { type: 'number', default: 11 },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['description', 'quantity', 'price'],
              properties: {
                description: { type: 'string' },
                quantity: { type: 'integer' },
                price: { type: 'number' },
              },
            },
          },
        },
      },
      UpdateInvoiceInput: {
        type: 'object',
        properties: {
          clientName: { type: 'string' },
          clientEmail: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
          status: {
            type: 'string',
            enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED'],
          },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          address: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateClientInput: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          address: { type: 'string' },
        },
      },
      UpdateClientInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          address: { type: 'string' },
        },
      },
      CreateWebhookInput: {
        type: 'object',
        required: ['teamId', 'name', 'url', 'events'],
        properties: {
          teamId: { type: 'string' },
          name: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          events: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Invoices', description: 'Invoice management' },
    { name: 'Clients', description: 'Client management' },
    { name: 'Payments', description: 'Payment management' },
    { name: 'Analytics', description: 'Analytics and reporting' },
    { name: 'Webhooks', description: 'Webhook management' },
  ],
}
