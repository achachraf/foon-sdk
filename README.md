# FOON SDK

> TypeScript SDK for semantic JSON transformation using LLMs

FOON SDK transforms free-form JSON to schema-compliant JSON using AI-powered semantic mapping. It accepts structurally incorrect but semantically correct JSON and transforms it to match your target schema.

## Key Features

- **Semantic Mapping**: Uses LLMs to understand intent and map fields intelligently
- **Schema Validation**: Ensures output always matches your JSON Schema
- **Explainability**: Comprehensive trace of all mapping decisions with confidence scores
- **Type Safety**: Full TypeScript support with type definitions
- **Caching**: Built-in LRU cache reduces API calls for repeated patterns
- **Security**: Input validation, redaction, and prompt injection protection
- **Multiple Providers**: Supports Gemini, OpenAI, and Ollama

## Installation

```bash
npm install foon-sdk
```

## Quick Start

```typescript
import { transform, OpenAIProvider } from 'foon-sdk';

// Define your target schema
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

// Transform messy input
const result = await transform(
  {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
  },
  {
    schema: userSchema,
    provider: new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-5-nano',
    }),
    confidenceThreshold: 0.85,
  }
);

if (result.ok) {
  console.log('Output:', result.output);
  // Output: { name: { given: 'John', family: 'Doe' }, email: 'john.doe@example.com' }
} else {
  console.error('Error:', result.error);
  console.log('Trace:', result.trace);
}
```

## Express Middleware

FOON SDK includes Express middleware for seamless integration with Express applications.

### Quick Start

```typescript
import express from 'express';
import { createFonRouter } from 'foon-sdk/express';
import { OpenAIProvider } from 'foon-sdk';

const app = express();
app.use(express.json());

// Create FOON router
const fonRouter = createFonRouter({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-5-nano'
  }),
  prefix: '/foon', // Default: '/foon'
  confidenceThreshold: 0.85, // Default: 0.85
});

// Register routes with schemas
fonRouter.post('/users', {
  schema: userCreateSchema,
  handler: (req, res) => {
    // req.body is now transformed and validated
    res.json({ success: true, user: req.body });
  },
});

fonRouter.put('/users/:id', {
  schema: userUpdateSchema,
  handler: updateUserHandler,
});

// Mount the router
app.use(fonRouter.getRouter());

app.listen(3000);
```

### How It Works

The Express middleware creates **two routes** for each registration:

1. **Original route** (e.g., `/users`) - Works normally without transformation
2. **FOON route** (e.g., `/foon/users`) - Applies FOON transformation before handler

Requests to FOON routes:

- Transform `req.body` using the configured schema
- Replace `req.body` with validated output
- Add trace ID header (`X-FON-Trace-Id`)
- Forward to the same handler

### Configuration

```typescript
interface FonRouterConfig {
  provider: Provider; // LLM provider (required)
  prefix?: string; // Route prefix (default: '/foon')
  methods?: HttpMethod[]; // Methods to transform (default: ['POST', 'PUT', 'PATCH'])
  confidenceThreshold?: number; // Confidence threshold (default: 0.85)
  cache?: Cache; // Cache instance
  security?: SecurityOptions; // Security options
  traceHeader?: string; // Trace header name (default: 'X-FON-Trace-Id')
  onError?: ErrorHandler; // Custom error handler
  createOriginalRoutes?: boolean; // Create original routes (default: true)
  verbose?: boolean; // Verbose logging (default: false)
}
```

### Route Configuration

```typescript
interface RouteConfig {
  schema: object; // JSON Schema for this route
  handler: RequestHandler; // Express handler
  createOriginal?: boolean; // Override: create original route
  confidenceThreshold?: number; // Override: confidence threshold for this route
}
```

### Examples

#### Basic Usage

```typescript
fonRouter.post('/users', {
  schema: userSchema,
  handler: (req, res) => {
    // req.body is transformed and validated
    res.json(req.body);
  },
});

// Now you have:
// POST /users       - Original route (untransformed)
// POST /foon/users  - FOON route (transformed)
```

#### Custom Error Handler

```typescript
const fonRouter = createFonRouter({
  provider,
  onError: (error, req, res, next) => {
    res.status(400).json({
      error: error.category,
      message: error.message,
      traceId: error.traceId,
      // Include trace for debugging
      trace: req.fonTrace,
    });
  },
});
```

#### Disable Original Routes

```typescript
const fonRouter = createFonRouter({
  provider,
  createOriginalRoutes: false, // Only create FOON routes
});

// Now only /foon/users exists, not /users
```

#### Custom Prefix

```typescript
const fonRouter = createFonRouter({
  provider,
  prefix: '/api/semantic',
});

fonRouter.post('/users', { schema, handler });
// Creates: POST /api/semantic/users
```

#### Per-Route Configuration

```typescript
fonRouter.post('/users', {
  schema: userSchema,
  handler: createUserHandler,
  createOriginal: false, // Don't create /users for this route
  confidenceThreshold: 0.9, // Higher threshold for this route
});
```

### Trace Headers

FOON routes automatically add headers to responses:

- `X-FON-Trace-Id`: Unique trace ID for debugging
- `X-FON-Timing-Total`: Total processing time (verbose mode)
- `X-FON-Timing-Proposal`: LLM call time (verbose mode)
- `X-FON-Cache-Hit`: Whether cache was hit (verbose mode)

### Error Handling

When transformation fails, the default error handler returns:

```json
{
  "error": "CONFIDENCE_TOO_LOW",
  "message": "1 assignment(s) below confidence threshold 0.85",
  "traceId": "uuid",
  "details": { ... }
}
```

HTTP status codes:

- `400` - Bad Request (validation error, confidence too low)
- `413` - Payload Too Large (security limits exceeded)
- `500` - Internal Server Error (execution error)
- `502` - Bad Gateway (provider error)

### Accessing Trace Data

The trace is attached to the request object:

```typescript
fonRouter.post('/users', {
  schema: userSchema,
  handler: (req, res) => {
    const trace = (req as any).fonTrace;
    console.log('Confidence:', trace.confidenceSummary);
    console.log('Timings:', trace.timings);
    res.json(req.body);
  },
});
```

## How It Works

1. **LLM Generates Mapping Plan**: The LLM analyzes your input and target schema, returning a mapping plan (not the final JSON)
2. **Deterministic Execution**: The SDK applies the mapping plan using JSONPath resolution and safe type conversions
3. **Validation**: Output is validated against your schema with detailed error reporting
4. **Trace Output**: Complete trace includes confidence scores, warnings, dropped fields, and timing

### Key Principle

FOON SDK does NOT let the LLM generate the final JSON. Instead:

- LLM returns a **mapping plan** with confidence scores
- SDK executes the plan **deterministically**
- Output is **always validated** against your schema

This approach ensures reliability, explainability, and prevents hallucinations.

## API Reference

### `transform(input, options)`

Main transformation function.

**Parameters:**

- `input: unknown` - The input JSON to transform
- `options: TransformOptions` - Transformation options

**Options:**

```typescript
interface TransformOptions {
  mode?: 'SEMANTIC'; // Only SEMANTIC mode in v1.0
  schema: object | SchemaAdapter; // JSON Schema object
  provider: Provider; // LLM provider instance
  confidenceThreshold?: number; // Default: 0.85
  cache?: Cache; // Optional cache instance
  verbose?: boolean; // Enable verbose output
  security?: SecurityOptions; // Security settings
  hooks?: TransformHooks; // Observability hooks
}
```

**Returns:** `Promise<TransformResult>`

```typescript
interface TransformResult {
  ok: boolean; // Success flag
  output?: unknown; // Transformed output (if successful)
  error?: FONError; // Error details (if failed)
  trace: TraceReport; // Complete trace report
}
```

### Providers

#### GeminiProvider

```typescript
import { GeminiProvider } from 'foon-sdk';

const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-1.5-flash', // Optional, default: gemini-1.5-flash
  timeout: 30000, // Optional, default: 30s
});
```

#### OpenAIProvider

```typescript
import { OpenAIProvider } from 'foon-sdk';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini', // Optional, default: gpt-4o-mini
  timeout: 30000, // Optional, default: 30s
  baseUrl: 'https://api.openai.com/v1', // Optional, for custom endpoints
});
```

#### OllamaProvider

```typescript
import { OllamaProvider } from 'foon-sdk';

const provider = new OllamaProvider({
  apiKey: process.env.OLLAMA_API_KEY, // Optional for local Ollama
  model: 'llama2', // Optional, default: llama2
  timeout: 60000, // Optional, default: 30s (Ollama can be slower)
  baseUrl: 'http://localhost:11434', // Optional, default: http://localhost:11434
});
```

**Note:** Ollama can run locally without an API key. If using a hosted Ollama instance, provide the `apiKey` and `baseUrl`.

### Security Options

```typescript
const result = await transform(input, {
  schema,
  provider,
  security: {
    maxInputSize: 1024 * 1024, // 1MB default
    maxDepth: 10, // Max nesting depth
    maxKeys: 1000, // Max number of keys
    redactKeys: ['password', 'token'], // Keys to redact
    sanitizePrompt: true, // Prompt injection protection
    includeValues: false, // Don't send values to LLM (structure only)
  },
});
```

## Examples

### Type Conversion

```typescript
const result = await transform(
  { age: '30' }, // String instead of number
  {
    schema: {
      type: 'object',
      properties: {
        age: { type: 'integer' },
      },
    },
    provider,
  }
);
// Output: { age: 30 }  - Automatically converted to number
```

### Nested Field Mapping

```typescript
const result = await transform(
  {
    city: 'San Francisco',
    country: 'USA',
  },
  {
    schema: {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            country: { type: 'string' },
          },
        },
      },
    },
    provider,
  }
);
// Output: { address: { city: 'San Francisco', country: 'USA' } }
```

### Confidence Threshold

```typescript
const result = await transform(input, {
  schema,
  provider,
  confidenceThreshold: 0.9, // Fail if any mapping < 90% confidence
});

if (!result.ok && result.error?.category === 'CONFIDENCE_TOO_LOW') {
  console.log('Rejected assignments:', result.trace.execution.assignmentsRejected);
}
```

### Using Cache

```typescript
import { transform, OpenAIProvider, LRUCache } from 'foon-sdk';

const cache = new LRUCache({ max: 100, ttl: 3600000 }); // 100 entries, 1 hour TTL

const result = await transform(input, {
  schema,
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-5-nano',
  }),
  cache,
});

console.log('Cache hit:', result.trace.cache.hit);
```

## Error Handling

FOON SDK provides detailed error categories:

```typescript
if (!result.ok) {
  switch (result.error?.category) {
    case 'SCHEMA_LOAD_ERROR':
      // Invalid schema
      break;
    case 'PROVIDER_ERROR':
      // LLM API error
      break;
    case 'MAPPING_PLAN_PARSE_ERROR':
      // LLM returned invalid mapping plan
      break;
    case 'CONFIDENCE_TOO_LOW':
      // Mapping confidence below threshold
      break;
    case 'EXECUTION_ERROR':
      // Error applying mapping plan
      break;
    case 'VALIDATION_ERROR':
      // Output doesn't match schema
      break;
    case 'SECURITY_LIMIT_EXCEEDED':
      // Input exceeded security limits
      break;
  }
}
```

## Trace Output

Every transformation includes a comprehensive trace:

```typescript
interface TraceReport {
  traceId: string; // Unique trace ID
  mode: 'SEMANTIC';
  provider: string; // Provider name
  promptVersion: string; // Prompt version
  timings: {
    total: number; // Total time (ms)
    proposal: number; // LLM call time
    execution: number; // Execution time
    validation: number; // Validation time
  };
  mappingPlan: {
    raw: string; // Raw LLM response
    parsed: MappingPlan; // Parsed mapping plan
  };
  execution: {
    assignmentsApplied: AssignmentTrace[];
    assignmentsRejected: RejectedAssignment[];
    droppedFields: Drop[];
    warnings: Warning[];
    conflicts: Conflict[];
  };
  validation: {
    success: boolean;
    errors: ValidationError[];
  };
  cache: {
    hit: boolean;
    key: string;
  };
  confidenceSummary: {
    min: number;
    max: number;
    avg: number;
    countBelowThreshold: number;
    threshold: number;
  };
}
```

## Testing

```bash
# Run deterministic tests (unit + integration, no external providers)
npm test

# Run all tests (including e2e provider tests)
npm run test:all

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (requires provider credentials in .env.local)
npm run test:e2e
```

## Building

```bash
npm run build
```

## License

MIT License - Copyright (c) 2026 Achraf Achkari

See [LICENSE](LICENSE) for details.

## Contributing

Issues and pull requests are welcome.
