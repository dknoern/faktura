const listParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number (1-based)" },
  { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 }, description: "Results per page" },
  { name: "search", in: "query", schema: { type: "string" }, description: "Full-text search across indexed fields" },
] as const;

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "MongoDB ObjectId",
} as const;

const responses = {
  400: { description: "Invalid ID", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  401: { description: "Missing or invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  409: { description: "Conflict (e.g. related records prevent deletion)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  422: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  500: { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
} as const;

function listOp(tag: string, dataKey: string, schemaRef: string, extraParams: object[] = []) {
  return {
    tags: [tag],
    summary: `List ${tag.toLowerCase()}`,
    security: [{ BearerAuth: [] }],
    parameters: [...listParams, ...extraParams],
    responses: {
      200: {
        description: "Paginated list",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "array", items: { $ref: schemaRef } },
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" },
              },
            },
          },
        },
      },
      401: responses[401],
      500: responses[500],
    },
  };
}

function createOp(tag: string, bodyRef: string, responseRef: string) {
  return {
    tags: [tag],
    summary: `Create a ${tag.toLowerCase().replace(/s$/, "")}`,
    security: [{ BearerAuth: [] }],
    requestBody: { required: true, content: { "application/json": { schema: { $ref: bodyRef } } } },
    responses: {
      201: { description: "Created", content: { "application/json": { schema: { $ref: responseRef } } } },
      401: responses[401],
      422: responses[422],
      500: responses[500],
    },
  };
}

function getByIdOp(tag: string, schemaRef: string) {
  return {
    tags: [tag],
    summary: `Get a ${tag.toLowerCase().replace(/s$/, "")} by ID`,
    security: [{ BearerAuth: [] }],
    parameters: [idParam],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: { $ref: schemaRef } } } },
      400: responses[400],
      401: responses[401],
      404: responses[404],
      500: responses[500],
    },
  };
}

function updateOp(tag: string, bodyRef: string, responseRef: string) {
  return {
    tags: [tag],
    summary: `Update a ${tag.toLowerCase().replace(/s$/, "")}`,
    security: [{ BearerAuth: [] }],
    parameters: [idParam],
    requestBody: { required: true, content: { "application/json": { schema: { $ref: bodyRef } } } },
    responses: {
      200: { description: "Updated", content: { "application/json": { schema: { $ref: responseRef } } } },
      400: responses[400],
      401: responses[401],
      404: responses[404],
      422: responses[422],
      500: responses[500],
    },
  };
}

function deleteOp(tag: string) {
  return {
    tags: [tag],
    summary: `Soft-delete a ${tag.toLowerCase().replace(/s$/, "")}`,
    description: "Sets `status` to `Deleted`. The record is preserved in the database.",
    security: [{ BearerAuth: [] }],
    parameters: [idParam],
    responses: {
      204: { description: "Deleted (no content)" },
      400: responses[400],
      401: responses[401],
      404: responses[404],
      409: responses[409],
      500: responses[500],
    },
  };
}

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Inventory REST API",
    version: "1.0.0",
    description:
      "Read/write access to Faktura data for external integrations.\n\n" +
      "**Authentication**: All endpoints require a Bearer API key in the `Authorization` header.\n\n" +
      "```\nAuthorization: Bearer <your-api-key>\n```\n\n" +
      "Generate API keys from **Profile → API Keys** inside the app.\n\n" +
      "All data is automatically scoped to the tenant associated with the API key.",
  },
  servers: [{ url: "/api/v1", description: "Current environment" }],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", description: "API key generated from Profile → API Keys" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
      Email: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          type: { type: "string", enum: ["home", "work", "other"] },
        },
      },
      Phone: {
        type: "object",
        properties: {
          phone: { type: "string" },
          type: { type: "string", enum: ["home", "work", "mobile", "other"] },
        },
      },
      Customer: {
        type: "object",
        properties: {
          _id: { type: "string" },
          customerNumber: { type: "integer" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          company: { type: "string" },
          emails: { type: "array", items: { $ref: "#/components/schemas/Email" } },
          phones: { type: "array", items: { $ref: "#/components/schemas/Phone" } },
          address1: { type: "string" },
          address2: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          country: { type: "string" },
          customerType: { type: "string" },
          status: { type: "string" },
          lastUpdated: { type: "string", format: "date-time" },
        },
      },
      CustomerInput: {
        type: "object",
        required: ["firstName", "lastName"],
        properties: {
          firstName: { type: "string", minLength: 2 },
          lastName: { type: "string", minLength: 2 },
          company: { type: "string" },
          emails: { type: "array", items: { $ref: "#/components/schemas/Email" } },
          phones: { type: "array", items: { $ref: "#/components/schemas/Phone" } },
          address1: { type: "string" },
          address2: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          country: { type: "string" },
          customerType: { type: "string" },
        },
      },
      LineItem: {
        type: "object",
        required: ["name", "amount"],
        properties: {
          productId: { type: "string" },
          itemNumber: { type: "string" },
          name: { type: "string" },
          amount: { type: "number" },
          serialNumber: { type: "string" },
          longDesc: { type: "string" },
        },
      },
      Invoice: {
        type: "object",
        properties: {
          _id: { type: "string" },
          invoiceNumber: { type: "integer" },
          customerId: { type: "string" },
          customerFirstName: { type: "string" },
          customerLastName: { type: "string" },
          customerEmail: { type: "string" },
          date: { type: "string", format: "date-time" },
          subtotal: { type: "number" },
          tax: { type: "number" },
          shipping: { type: "number" },
          total: { type: "number" },
          invoiceType: { type: "string", enum: ["Sale", "Estimate", "Consignment", "Partner"] },
          paidBy: { type: "string" },
          salesPerson: { type: "string" },
          status: { type: "string" },
          lineItems: { type: "array", items: { $ref: "#/components/schemas/LineItem" } },
        },
      },
      InvoiceInput: {
        type: "object",
        required: ["customerFirstName", "customerLastName", "date", "total", "lineItems"],
        properties: {
          customerId: { type: "string" },
          customerFirstName: { type: "string" },
          customerLastName: { type: "string" },
          customerEmail: { type: "string" },
          date: { type: "string", format: "date" },
          subtotal: { type: "number" },
          tax: { type: "number" },
          shipping: { type: "number" },
          total: { type: "number" },
          invoiceType: { type: "string", enum: ["Sale", "Estimate", "Consignment", "Partner"] },
          paidBy: { type: "string" },
          salesPerson: { type: "string" },
          taxExempt: { type: "boolean" },
          lineItems: { type: "array", items: { $ref: "#/components/schemas/LineItem" } },
        },
      },
      Repair: {
        type: "object",
        properties: {
          _id: { type: "string" },
          repairNumber: { type: "string" },
          itemNumber: { type: "string" },
          description: { type: "string" },
          customerFirstName: { type: "string" },
          customerLastName: { type: "string" },
          customerId: { type: "string" },
          vendor: { type: "string" },
          repairCost: { type: "number" },
          repairIssues: { type: "string" },
          repairNotes: { type: "string" },
          warrantyService: { type: "boolean" },
          email: { type: "string" },
          phone: { type: "string" },
          dateOut: { type: "string", format: "date-time" },
          returnDate: { type: "string", format: "date-time", nullable: true },
          status: { type: "string" },
        },
      },
      RepairInput: {
        type: "object",
        required: ["description", "customerFirstName", "customerLastName"],
        properties: {
          repairNumber: { type: "string", description: "Leave blank to auto-generate" },
          itemNumber: { type: "string" },
          description: { type: "string" },
          customerFirstName: { type: "string" },
          customerLastName: { type: "string" },
          selectedCustomerId: { type: "string" },
          selectedProductId: { type: "string" },
          vendor: { type: "string" },
          repairCost: { type: "number" },
          repairIssues: { type: "string" },
          repairNotes: { type: "string" },
          warrantyService: { type: "boolean" },
          email: { type: "string" },
          phone: { type: "string" },
          returnDate: { type: "string", format: "date" },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          itemNumber: { type: "string" },
          title: { type: "string" },
          manufacturer: { type: "string" },
          model: { type: "string" },
          serialNo: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["In Stock", "Sold", "Repair", "At Show", "Memo", "Consignment", "Deleted"],
          },
          price: { type: "number" },
          cost: { type: "number" },
          lastUpdated: { type: "string", format: "date-time" },
        },
      },
      ProductInput: {
        type: "object",
        required: ["itemNumber", "title"],
        properties: {
          itemNumber: { type: "string" },
          title: { type: "string" },
          manufacturer: { type: "string" },
          model: { type: "string" },
          serialNo: { type: "string" },
          description: { type: "string" },
          status: { type: "string" },
          price: { type: "number" },
          cost: { type: "number" },
        },
      },
      ReturnLineItem: {
        type: "object",
        required: ["itemNumber", "amount", "included"],
        properties: {
          productId: { type: "string" },
          itemNumber: { type: "string" },
          name: { type: "string" },
          amount: { type: "number" },
          serialNo: { type: "string" },
          included: { type: "boolean" },
        },
      },
      Return: {
        type: "object",
        properties: {
          _id: { type: "string" },
          returnNumber: { type: "integer" },
          customerName: { type: "string" },
          customerId: { type: "string" },
          invoiceId: { type: "string" },
          invoiceNumber: { type: "integer" },
          returnDate: { type: "string", format: "date-time" },
          subTotal: { type: "number" },
          salesTax: { type: "number" },
          shipping: { type: "number" },
          totalReturnAmount: { type: "number" },
          salesPerson: { type: "string" },
          status: { type: "string" },
          lineItems: { type: "array", items: { $ref: "#/components/schemas/ReturnLineItem" } },
        },
      },
      ReturnInput: {
        type: "object",
        required: ["customerName", "invoiceId", "returnDate", "subTotal", "salesTax", "shipping", "totalReturnAmount", "lineItems"],
        properties: {
          customerName: { type: "string" },
          customerId: { type: "string" },
          customerNumber: { type: "integer" },
          invoiceId: { type: "string" },
          invoiceNumber: { type: "integer" },
          returnDate: { type: "string", format: "date" },
          subTotal: { type: "number" },
          taxable: { type: "boolean" },
          salesTax: { type: "number" },
          shipping: { type: "number" },
          totalReturnAmount: { type: "number" },
          salesPerson: { type: "string" },
          lineItems: { type: "array", items: { $ref: "#/components/schemas/ReturnLineItem" } },
        },
      },
      Wanted: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          customerName: { type: "string" },
          customerId: { type: "string" },
          customerNumber: { type: "integer" },
          createdDate: { type: "string", format: "date-time" },
          foundDate: { type: "string", format: "date-time", nullable: true },
          createdBy: { type: "string" },
          status: { type: "string" },
        },
      },
      WantedInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          customerName: { type: "string" },
          customerId: { type: "string" },
          customerNumber: { type: "integer" },
        },
      },
    },
  },
  paths: {
    "/customers": {
      get: listOp("Customers", "customers", "#/components/schemas/Customer"),
      post: createOp("Customers", "#/components/schemas/CustomerInput", "#/components/schemas/Customer"),
    },
    "/customers/{id}": {
      get: getByIdOp("Customers", "#/components/schemas/Customer"),
      put: updateOp("Customers", "#/components/schemas/CustomerInput", "#/components/schemas/Customer"),
      delete: deleteOp("Customers"),
    },
    "/invoices": {
      get: listOp("Invoices", "invoices", "#/components/schemas/Invoice"),
      post: createOp("Invoices", "#/components/schemas/InvoiceInput", "#/components/schemas/Invoice"),
    },
    "/invoices/{id}": {
      get: getByIdOp("Invoices", "#/components/schemas/Invoice"),
      put: updateOp("Invoices", "#/components/schemas/InvoiceInput", "#/components/schemas/Invoice"),
      delete: deleteOp("Invoices"),
    },
    "/repairs": {
      get: {
        ...listOp("Repairs", "repairs", "#/components/schemas/Repair", [
          {
            name: "filter",
            in: "query",
            schema: { type: "string", enum: ["outstanding", "all"], default: "all" },
            description: "`outstanding` returns only repairs with no return date",
          },
        ]),
      },
      post: createOp("Repairs", "#/components/schemas/RepairInput", "#/components/schemas/Repair"),
    },
    "/repairs/{id}": {
      get: getByIdOp("Repairs", "#/components/schemas/Repair"),
      put: updateOp("Repairs", "#/components/schemas/RepairInput", "#/components/schemas/Repair"),
      delete: deleteOp("Repairs"),
    },
    "/products": {
      get: {
        ...listOp("Products", "products", "#/components/schemas/Product", [
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["lastUpdated", "status"], default: "lastUpdated" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
        ]),
      },
      post: createOp("Products", "#/components/schemas/ProductInput", "#/components/schemas/Product"),
    },
    "/products/{id}": {
      get: getByIdOp("Products", "#/components/schemas/Product"),
      put: updateOp("Products", "#/components/schemas/ProductInput", "#/components/schemas/Product"),
      delete: deleteOp("Products"),
    },
    "/returns": {
      get: listOp("Returns", "returns", "#/components/schemas/Return"),
      post: createOp("Returns", "#/components/schemas/ReturnInput", "#/components/schemas/Return"),
    },
    "/returns/{id}": {
      get: getByIdOp("Returns", "#/components/schemas/Return"),
      put: updateOp("Returns", "#/components/schemas/ReturnInput", "#/components/schemas/Return"),
      delete: deleteOp("Returns"),
    },
    "/wanted": {
      get: listOp("Wanted", "wanted", "#/components/schemas/Wanted"),
      post: createOp("Wanted", "#/components/schemas/WantedInput", "#/components/schemas/Wanted"),
    },
    "/wanted/{id}": {
      get: getByIdOp("Wanted", "#/components/schemas/Wanted"),
      put: updateOp("Wanted", "#/components/schemas/WantedInput", "#/components/schemas/Wanted"),
      delete: deleteOp("Wanted"),
    },
  },
};
