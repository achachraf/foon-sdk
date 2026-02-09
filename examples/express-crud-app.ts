import express, { Request, Response } from 'express';
import { createFonRouter } from '../src/express';
import { OpenAIProvider } from '../src';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// In-memory data store
interface User {
  id: string;
  name: {
    given: string;
    family: string;
  };
  email: string;
  age?: number;
  role?: string;
}

const users: Map<string, User> = new Map();
let nextId = 1;

// JSON Schema for creating users
const createUserSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'object',
      properties: {
        given: { type: 'string', minLength: 1 },
        family: { type: 'string', minLength: 1 },
      },
      required: ['given', 'family'],
    },
    email: {
      type: 'string',
      format: 'email',
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150,
    },
    role: {
      type: 'string',
      enum: ['user', 'admin', 'moderator'],
    },
  },
  required: ['name', 'email'],
};

// JSON Schema for updating users (all fields optional)
const updateUserSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'object',
      properties: {
        given: { type: 'string', minLength: 1 },
        family: { type: 'string', minLength: 1 },
      },
    },
    email: {
      type: 'string',
      format: 'email',
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150,
    },
    role: {
      type: 'string',
      enum: ['user', 'admin', 'moderator'],
    },
  },
};

async function main() {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY not found in .env.local');
    console.log('Please create a .env.local file with:');
    console.log('OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  // Create OpenAI provider
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-5-nano',
  });

  // Create FOON router
  const fonRouter = createFonRouter({
    provider,
    prefix: '/foon',
    confidenceThreshold: 0.85,
    verbose: true, // Enable verbose logging to see what's happening
  });

  // ========================================
  // CRUD Handlers
  // ========================================

  // CREATE - Add a new user
  const createUserHandler = (req: Request, res: Response) => {
    const userData = req.body as Omit<User, 'id'>;
    const id = String(nextId++);
    const user: User = { id, ...userData };
    users.set(id, user);

    console.log(`✓ Created user ${id}:`, JSON.stringify(user, null, 2));
    res.status(201).json({ success: true, user });
  };

  // READ - Get all users
  const getAllUsersHandler = (req: Request, res: Response) => {
    const allUsers = Array.from(users.values());
    res.json({ success: true, count: allUsers.length, users: allUsers });
  };

  // READ - Get single user
  const getUserHandler = (req: Request, res: Response) => {
    const user = users.get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  };

  // UPDATE - Update a user
  const updateUserHandler = (req: Request, res: Response) => {
    const user = users.get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updates = req.body;
    const updatedUser = { ...user, ...updates };
    users.set(req.params.id, updatedUser);

    console.log(`✓ Updated user ${req.params.id}:`, JSON.stringify(updatedUser, null, 2));
    res.json({ success: true, user: updatedUser });
  };

  // DELETE - Remove a user
  const deleteUserHandler = (req: Request, res: Response) => {
    const existed = users.delete(req.params.id);
    if (!existed) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log(`✓ Deleted user ${req.params.id}`);
    res.json({ success: true, message: 'User deleted' });
  };

  // ========================================
  // Register Routes with FOON Router
  // ========================================

  fonRouter.post('/users', {
    schema: createUserSchema,
    handler: createUserHandler,
  });

  fonRouter.put('/users/:id', {
    schema: updateUserSchema,
    handler: updateUserHandler,
  });

  // For PATCH, we can use the same schema as PUT
  fonRouter.patch('/users/:id', {
    schema: updateUserSchema,
    handler: updateUserHandler,
  });

  // Mount the FOON router
  app.use(fonRouter.getRouter());

  // Add GET and DELETE routes manually (no transformation needed for these)
  app.get('/users', getAllUsersHandler);
  app.get('/users/:id', getUserHandler);
  app.delete('/users/:id', deleteUserHandler);

  // ========================================
  // Info Endpoint
  // ========================================

  app.get('/', (req, res) => {
    res.json({
      message: 'FOON SDK Express CRUD Example',
      routes: {
        'GET /': 'This info page',
        'GET /users': 'List all users',
        'GET /users/:id': 'Get single user',
        'POST /users': 'Create user (original - NO transformation)',
        'POST /foon/users': 'Create user (FOON - WITH transformation)',
        'PUT /users/:id': 'Update user (original - NO transformation)',
        'PUT /foon/users/:id': 'Update user (FOON - WITH transformation)',
        'PATCH /users/:id': 'Patch user (original - NO transformation)',
        'PATCH /foon/users/:id': 'Patch user (FOON - WITH transformation)',
        'DELETE /users/:id': 'Delete user',
      },
      examples: {
        'Create with exact schema (no transformation needed)': {
          method: 'POST',
          url: 'http://localhost:3000/users',
          body: {
            name: { given: 'John', family: 'Doe' },
            email: 'john@example.com',
            age: 30,
            role: 'user',
          },
        },
        'Create with messy fields (transformation applied)': {
          method: 'POST',
          url: 'http://localhost:3000/foon/users',
          body: {
            firstname: 'Jane',
            lastname: 'Smith',
            email_address: 'jane@example.com',
            user_age: '25',
            user_role: 'admin',
          },
          note: 'FOON will transform firstname/lastname to name.given/family, email_address to email, etc.',
        },
        'Update with messy fields (transformation applied)': {
          method: 'PUT',
          url: 'http://localhost:3000/foon/users/1',
          body: {
            first: 'Alice',
            last: 'Johnson',
            new_email: 'alice@example.com',
          },
          note: 'FOON will semantically map these to the correct schema fields',
        },
      },
    });
  });

  // ========================================
  // Start Server
  // ========================================

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
 ║   FOON SDK Express CRUD Example                     ║
║                                                    ║
║   Server running on http://localhost:${PORT}        ║
║                                                    ║
║   Try these requests:                              ║
║                                                    ║
║   1. GET http://localhost:${PORT}/                  ║
║      → See available routes and examples           ║
║                                                    ║
║   2. POST http://localhost:${PORT}/foon/users       ║
║      Body: {                                       ║
║        "firstname": "John",                        ║
║        "lastname": "Doe",                          ║
║        "email_address": "john@example.com",        ║
║        "user_age": "30"                            ║
║      }                                             ║
 ║      → FOON transforms to schema-compliant format   ║
║                                                    ║
║   3. POST http://localhost:${PORT}/users            ║
║      Body: {                                       ║
║        "name": {"given": "Jane", "family": "Doe"}, ║
║        "email": "jane@example.com"                 ║
║      }                                             ║
║      → No transformation (already correct)         ║
║                                                    ║
║   4. GET http://localhost:${PORT}/users             ║
║      → See all created users                       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
    `);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
