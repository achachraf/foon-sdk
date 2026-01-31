# FON SDK Examples

This folder contains example applications demonstrating how to use the FON SDK.

## Prerequisites

1. **Install dependencies** from the root directory:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```

3. **Build the SDK** (if not already built):
   ```bash
   npm run build
   ```

## Examples

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates core FON SDK functionality without Express:
- Simple field transformation
- Type conversion (string to integer)
- Nested field mapping
- Validation failures

**Run it:**
```bash
npx ts-node examples/basic-usage.ts
```

### 2. Express CRUD App (`express-crud-app.ts`)

Complete CRUD application using Express with FON middleware:
- Dual routes (original + FON-transformed)
- Create, Read, Update, Delete operations
- Different schemas for create vs update
- Real-time transformation of messy JSON input

**Run it:**
```bash
npx ts-node examples/express-crud-app.ts
```

The server will start on `http://localhost:3000`

## Testing the Express CRUD App

### Using curl

After starting the Express app, try these commands:

#### 1. View available routes
```bash
curl http://localhost:3000/
```

#### 2. Create a user with messy fields (FON route)
```bash
curl -X POST http://localhost:3000/foon/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email_address": "john@example.com",
    "user_age": "30",
    "user_role": "admin"
  }'
```

**What happens:** FON transforms the messy fields to match the schema:
- `firstname` + `lastname` → `name.given` + `name.family`
- `email_address` → `email`
- `user_age` (string) → `age` (integer)
- `user_role` → `role`

#### 3. Create a user without transformation (original route)
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "given": "Jane",
      "family": "Smith"
    },
    "email": "jane@example.com",
    "age": 25,
    "role": "user"
  }'
```

**What happens:** No transformation, JSON must already match the schema.

#### 4. Get all users
```bash
curl http://localhost:3000/users
```

#### 5. Get a specific user
```bash
curl http://localhost:3000/users/1
```

#### 6. Update a user with messy fields (FON route)
```bash
curl -X PUT http://localhost:3000/foon/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "first": "Jonathan",
    "email_addr": "jonathan@example.com"
  }'
```

**What happens:** FON transforms `first` → `name.given`, `email_addr` → `email`

#### 7. Update a user (original route)
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "given": "Jon"
    },
    "age": 31
  }'
```

#### 8. Delete a user
```bash
curl -X DELETE http://localhost:3000/users/1
```

### Using Postman or Thunder Client

Import these requests or create them manually:

1. **GET** `http://localhost:3000/` - View routes
2. **POST** `http://localhost:3000/foon/users` - Create with transformation
3. **POST** `http://localhost:3000/users` - Create without transformation
4. **GET** `http://localhost:3000/users` - List all users
5. **PUT** `http://localhost:3000/foon/users/:id` - Update with transformation
6. **DELETE** `http://localhost:3000/users/:id` - Delete user

## Key Differences: Original vs FON Routes

### Original Routes (e.g., `POST /users`)
- **No transformation** applied
- JSON must **exactly match** the schema
- Faster (no LLM call)
- Use when you control the input format

### FON Routes (e.g., `POST /foon/users`)
- **Semantic transformation** applied
- JSON can have **different field names**
- LLM maps fields intelligently
- Type conversion (string → integer, etc.)
- Use when accepting external/messy input

## Response Headers

FON routes include these headers:
- `X-FON-Trace-Id` - Unique trace ID for debugging
- `X-FON-Timing-Total` - Total processing time (verbose mode)
- `X-FON-Timing-Proposal` - LLM call time (verbose mode)
- `X-FON-Cache-Hit` - Whether cache was hit (verbose mode)

## Error Handling

### Confidence Too Low
If FON can't confidently map fields, you'll get a 400 error:
```json
{
  "error": "CONFIDENCE_TOO_LOW",
  "message": "1 assignment(s) below confidence threshold 0.85",
  "traceId": "uuid",
  "details": { ... }
}
```

### Validation Error
If the transformed output doesn't match the schema:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Output failed schema validation",
  "traceId": "uuid",
  "details": { ... }
}
```

## Tips

1. **Enable verbose mode** to see detailed logs:
   ```typescript
   createFonRouter({ provider, verbose: true })
   ```

2. **Adjust confidence threshold** per route:
   ```typescript
   fonRouter.post('/users', {
     schema: userSchema,
     handler: createHandler,
     confidenceThreshold: 0.90, // Higher threshold for critical routes
   })
   ```

3. **Disable original routes** if you only want FON routes:
   ```typescript
   createFonRouter({ provider, createOriginalRoutes: false })
   ```

4. **Use caching** to reduce LLM calls:
   ```typescript
   import { LRUCache } from 'fon-sdk';
   const cache = new LRUCache({ max: 100 });
   createFonRouter({ provider, cache })
   ```
