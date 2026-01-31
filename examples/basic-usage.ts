import { transform, GeminiProvider } from '../src';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Define target schema
const userSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'object',
      properties: {
        given: {
          type: 'string',
          description: 'First name',
        },
        family: {
          type: 'string',
          description: 'Last name',
        },
      },
      required: ['given', 'family'],
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Email address',
    },
    age: {
      type: 'integer',
      description: 'Age in years',
    },
    address: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
        },
        country: {
          type: 'string',
        },
      },
    },
  },
  required: ['name', 'email'],
};

async function main() {
  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not found in .env.local');
    console.log('Please create a .env.local file with:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  // Create provider
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  });

  // Example 1: Simple transformation
  console.log('=== Example 1: Simple Transformation ===\n');

  const result1 = await transform(
    {
      firstname: 'Alice',
      lastname: 'Smith',
      email: 'alice@example.com',
    },
    {
      schema: userSchema,
      provider,
      confidenceThreshold: 0.85,
    }
  );

  if (result1.ok) {
    console.log('✓ Success!');
    console.log('Output:', JSON.stringify(result1.output, null, 2));
    console.log('Trace ID:', result1.trace.traceId);
    console.log('Assignments applied:', result1.trace.execution.assignmentsApplied.length);
  } else {
    console.log('✗ Failed');
    console.log('Error:', result1.error?.message);
  }

  // Example 2: With type conversion
  console.log('\n=== Example 2: Type Conversion ===\n');

  const result2 = await transform(
    {
      firstname: 'Bob',
      lastname: 'Jones',
      email: 'bob@example.com',
      age: '42', // String will be converted to integer
    },
    {
      schema: userSchema,
      provider,
      confidenceThreshold: 0.80,
    }
  );

  if (result2.ok) {
    console.log('✓ Success!');
    const output = result2.output as any;
    console.log('Age (original string):', '"42"');
    console.log('Age (converted):', output.age, typeof output.age);

    // Check if type conversion happened
    const ageAssignment = result2.trace.execution.assignmentsApplied.find(
      (a) => a.assignment.to === '$.age'
    );
    if (ageAssignment) {
      console.log('Type conversion:', ageAssignment.transformed ? 'YES' : 'NO');
    }
  }

  // Example 3: Complex nested mapping
  console.log('\n=== Example 3: Nested Field Mapping ===\n');

  const result3 = await transform(
    {
      first_name: 'Charlie',
      last_name: 'Brown',
      email_address: 'charlie@example.com',
      city: 'New York',
      country: 'USA',
    },
    {
      schema: userSchema,
      provider,
      confidenceThreshold: 0.80,
    }
  );

  if (result3.ok) {
    console.log('✓ Success!');
    console.log('Output:', JSON.stringify(result3.output, null, 2));
    console.log('\nMapping details:');
    result3.trace.execution.assignmentsApplied.forEach((a) => {
      console.log(`  ${a.assignment.from} → ${a.assignment.to} (confidence: ${a.assignment.confidence})`);
    });
  }

  // Example 4: Validation failure
  console.log('\n=== Example 4: Validation Failure ===\n');

  const result4 = await transform(
    {
      // Missing required fields
      city: 'Boston',
    },
    {
      schema: userSchema,
      provider,
      confidenceThreshold: 0.80,
    }
  );

  if (!result4.ok) {
    console.log('✗ Failed (expected)');
    console.log('Error category:', result4.error?.category);
    if (result4.error?.category === 'VALIDATION_ERROR') {
      console.log('Validation errors:');
      result4.trace.validation.errors.forEach((err) => {
        console.log(`  - ${err.message}`);
      });
    }
    console.log('Warnings from LLM:');
    result4.trace.execution.warnings.forEach((w) => {
      console.log(`  - ${w.message}`);
    });
  }

  console.log('\n=== All examples completed ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
