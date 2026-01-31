# PRD: FON SDK (TypeScript, Semantic-only)

**Product:** FON SDK (Free Object Notation Adapter)
**Phase:** SDK only (no SaaS)
**Status:** Draft v0.2 (Semantic-only)

## 1. Summary

FON SDK is a TypeScript library that adds a “semantic compatibility mode” in front of existing JSON-contract APIs. It accepts **free-form JSON** from clients and transforms it into the **target schema-compliant JSON** required by a service, using an LLM to propose a **mapping plan**, then applying that plan deterministically and validating the result.

**Key principle:** Contracts still matter. FON does not replace schemas. It adapts inputs to match them.

---

## 2. Goals

### Primary goals

* Allow clients to submit **semantically correct but structurally incorrect** JSON.
* Produce a **deterministic, schema-valid** output payload.
* Provide **explainability**: mapping decisions, confidence, warnings, dropped fields, trace IDs.
* Provide **operational safety**: schema validation mandatory, configurable confidence thresholds.
* Support multiple LLM providers with clean isolation:

  * OpenAI-compatible APIs
  * Google AI (Gemini)
  * Ollama-compatible endpoints

### Secondary goals

* Caching of mapping plans for repeated payload shapes.
* Provider abstraction designed for easy future additions.

---

## 3. Non-Goals (Explicitly Not Doing)

* No new “data notation” format (still JSON).
* No server/proxy product in this phase.
* No repair loops or retries (v0: **zero retry**).
* No autonomous schema inference from examples (target schema must be provided).
* No “LLM returns final JSON” (forbidden).
* No STRICT or ASSISTED modes in this phase.

---

## 4. Target Users

* Backend developers integrating multiple clients with messy payloads.
* Platform/API teams maintaining backward compatibility across versions.
* Ingestion pipelines where rejecting “almost correct” data is costly.

---

## 5. Core Concepts & Definitions

### Target Schema

The authoritative contract describing what downstream services accept. Supported inputs:

* JSON Schema (preferred)
* OpenAPI schema subset (optional in v0, or treated as future extension)

### Mapping Plan (Non-negotiable output format from LLM)

The LLM must output a **mapping plan**, not the final payload.

Example (illustrative):

```json
{
  "assignments": [
    { "from": "$.firstname", "to": "$.name.given", "confidence": 0.92 },
    { "from": "$.lastname", "to": "$.name.family", "confidence": 0.93 },
    { "from": "$.country", "to": "$.address.country", "confidence": 0.98 },
    { "from": "$.city", "to": "$.address.city", "confidence": 0.98 }
  ],
  "drops": [
    { "path": "$.debugStuff", "reason": "Not in schema", "confidence": 0.9 }
  ],
  "warnings": [
    { "message": "Input key 'firtsname' looks like typo of 'firstname'", "confidence": 0.87 }
  ]
}
```

### Execution Engine

Applies the mapping plan deterministically (pure code), producing output JSON.

### Validation

The resulting JSON must validate against the target schema. Validation failure returns an error. No retries in v0.

---

## 6. Product Scope

### In-scope features

* TypeScript library (Node.js and modern TS runtimes)
* Single package shipping two internal modules:

  * Schema Adapter
  * Mapping Engine
* Single mode: `SEMANTIC`
* Provider support:

  * OpenAI-compatible
  * Google Gemini
  * Ollama-compatible
* Caching (in-memory baseline, extensible interface)
* Explainability/Trace output
* Security guardrails (prompt-injection mitigation + redaction + limits)

### Out-of-scope features (v0)

* STRICT and ASSISTED modes
* Persistent caching store (Redis, disk)
* Retry/repair loops
* Streaming responses
* UI dashboard
* Full OpenAPI lifecycle tooling

---

## 7. User Stories

### US1: Semantic mapping with confidence thresholds

As a developer, I want semantic mapping that refuses low-confidence transformations, so I can avoid “creative” production bugs.

### US2: Debug visibility

As a developer, I want a verbose trace of what was mapped and why, so I can trust and troubleshoot transformations.

### US3: Multiple provider support

As a developer, I want to plug in my own LLM provider credentials (OpenAI/Gemini/Ollama), so billing stays with me.

### US4: Caching for repeated payload shapes

As a developer, I want mapping plans cached, so repeated requests don’t re-bill the LLM unnecessarily.

---

## 8. Mode: SEMANTIC (Behavioral Spec)

### SEMANTIC Mode

**Goal:** Full semantic mapping plan produced by LLM.

**Flow:**

1. SDK builds prompt from:

   * Target schema field inventory (paths, types, required markers, descriptions)
   * Input payload key inventory (keys + structure; values sanitized based on security settings)
   * Constraints for mapping plan JSON output
2. Provider returns mapping plan JSON.
3. SDK strictly parses mapping plan (must match plan schema).
4. SDK enforces confidence threshold per assignment.
5. Engine applies plan deterministically.
6. Output is validated against target schema.
7. Return output + trace; on any failure, return error + trace.

**No retries** in v0.

---

## 9. Functional Requirements

### FR1: Schema Adapter

* Load schema from object or file/string.
* Normalize schema into an internal representation:

  * list of fields with JSONPath
  * expected types
  * required/optional markers
  * descriptions (strongly recommended for LLM prompt quality)
* Support nested objects and arrays (at minimum: represent them; mapping support may be incremental).
* Provide utilities:

  * `listFields()`
  * `getField(path)`
  * `isRequired(path)`
  * `validate(payload)`

### FR2: Mapping Engine

* Accept:

  * input JSON
  * target schema adapter
  * provider config
  * confidence threshold
  * cache
* Output:

  * transformed JSON (if success)
  * trace report (always, even on error if possible)
* Deterministic application of mapping plan:

  * resolve JSONPaths
  * limited, explicit type conversions
  * stable merge strategy
  * conflict detection (two sources to same target)

### FR3: LLM Mapping Plan Output (Non-negotiable)

* SDK must enforce strict parsing of LLM output:

  * Must be valid JSON
  * Must match mapping plan schema
  * Confidence must be a number in [0..1]
* If invalid or missing: fail with error and trace.

### FR4: Validation Mandatory

* Output must validate against schema.
* Validation errors must be included in trace.

### FR5: Explainability & Trace

Provide a structured trace object:

* `traceId` (UUID)
* `mode` = `SEMANTIC`
* `provider` (which LLM)
* `timings` (proposal time, execution time, validation time)
* `mappingPlan` (raw and parsed)
* `assignmentsApplied[]`
* `assignmentsRejected[]` (below threshold / invalid)
* `droppedFields[]`
* `warnings[]`
* `confidenceSummary`:

  * min/avg confidence for applied assignments
  * count below threshold
* `validation`:

  * success boolean
  * errors array (if any)
* `cache`:

  * hit/miss
  * key used

### FR6: Provider Abstraction (Clean Isolation)

A provider interface that is easy to extend:

* `Provider` interface:

  * `name`
  * `proposeMappingPlan(input, schema, options) -> MappingPlanJSON`
* Providers shipped in v0:

  * `OpenAICompatibleProvider`
  * `GeminiProvider`
  * `OllamaProvider`

Provider code must be isolated in separate folders/modules with minimal shared assumptions.

### FR7: Configurable confidence threshold

* `confidenceThreshold` configurable
* Default value required (e.g., 0.85)
* Enforced per assignment:

  * Any assignment below threshold causes failure (recommended for v0 for predictability)

### FR8: Caching

* Cache mapping plans based on a stable cache key:

  * target schema identifier/version
  * “shape signature” of input (keys + nesting, not values)
  * threshold + provider name + prompt version
* Provide cache interface:

  * `get(key)`
  * `set(key, value, ttl?)`
* Default: in-memory LRU cache with configurable size.
* Cache must store:

  * mapping plan + parsed structure
  * metadata (createdAt, provider, promptVersion)

---

## 10. Security Requirements

### SR1: Prompt injection mitigation

* Do not include raw user payload verbatim in prompt if it contains large untrusted text fields.
* Prefer schema-guided prompt:

  * list input keys and types
  * include a *sanitized* subset of values (or no values) depending on config
* Treat fields like `instructions`, `notes`, `prompt`, `system`, `role` as suspicious by default.

### SR2: Redaction

* Provide redaction hooks for sensitive keys:

  * `password`, `token`, `authorization`, etc.
* Redacted fields should still appear in trace as redacted.

### SR3: Input limits

* Max JSON size (bytes)
* Max depth
* Max number of keys
* Max string length to forward into LLM context

### SR4: Verbose mode safety (SDK-level)

SDK can’t enforce auth, but must:

* make verbose output opt-in
* provide separate “safe trace” (no schema internals, no prompt text) vs “debug trace” (full)

---

## 11. SDK Public API (Proposed)

### Top-level function

```ts
transform(input: unknown, options: TransformOptions): Promise<TransformResult>
```

### Types

```ts
type Mode = "SEMANTIC";

interface TransformOptions {
  mode?: Mode; // default: "SEMANTIC"
  schema: object; // JSON Schema object, or SchemaAdapter instance
  provider: Provider; // required
  confidenceThreshold?: number; // default applies
  cache?: Cache;
  verbose?: boolean;
  security?: SecurityOptions;
}

interface TransformResult {
  ok: boolean;
  output?: unknown; // schema-valid JSON
  error?: TransformError;
  trace: TraceReport;
}
```

---

## 12. Prompting Strategy (LLM Contract)

### Requirements

* System prompt must force:

  * output JSON only
  * correct mapping plan structure
  * no prose, no markdown
* Include:

  * target schema fields (paths, types, descriptions)
  * required fields emphasis
  * input payload key inventory
  * constraints (confidence 0..1, include drops/warnings)

### Versioning

* `promptVersion` string must be included in trace and cache key.

---

## 13. Error Handling

### Error categories

* `SCHEMA_LOAD_ERROR`
* `PROVIDER_ERROR`
* `MAPPING_PLAN_PARSE_ERROR`
* `CONFIDENCE_TOO_LOW`
* `EXECUTION_ERROR`
* `VALIDATION_ERROR`
* `SECURITY_LIMIT_EXCEEDED`

Errors must include:

* message
* category
* optional details (safe by default)

---

## 14. Observability Requirements (SDK-level)

* Provide hooks:

  * `onTrace(trace)`
  * `onError(error, traceId)`
  * `onProviderCall(metrics)`
* Keep logs out of the core by default (library should not spam console).

---

## 15. Performance & Cost Considerations

* Cache on by default (in-memory small LRU).
* Prefer schema + key inventory prompts (small tokens).
* Avoid sending large text fields to LLM.
* Fail fast on confidence and validation issues.

---

## 16. Milestones

### M0: Prototype

* Schema Adapter basic JSON Schema support
* One provider (OpenAI-compatible)
* Deterministic execution + validation + trace

### M1: Caching + thresholds

* Confidence threshold config
* LRU cache
* Trace enhancements

### M2: Provider expansion + hardening

* Add Gemini provider
* Add Ollama provider
* Security limits + redaction hooks
* Strict mapping plan schema enforcement

### M3 (vNext): Express middleware adapter (plug-on-top)

Provide an optional `@fon/express` package (or subpath export) that mounts FON on top of existing Express APIs by creating **alternative “FON routes”**.

**Default behavior**

* Given a base path (or Express Router), expose an alternative prefixed route namespace.
* Default prefix: `/foon` (configurable).
* Example: `/users` also becomes `/foon/users`.

**Scope**

* Only create alternatives for “accepting data” endpoints (write methods): `POST`, `PUT`, `PATCH` (optionally `DELETE` via config).
* Read-only endpoints (`GET`, `HEAD`) are not duplicated by default.

**Runtime behavior**

* For requests hitting the prefixed routes, the middleware:

  1. loads the target schema configured for that endpoint,
  2. runs the FON SDK transform (SEMANTIC) on the request body,
  3. replaces `req.body` with the schema-valid output,
  4. forwards to the same handler logic as the original route.

**Developer ergonomics**

* Must provide a clean way to register schemas per route/method (e.g., a route registry or wrapper router).
* Provide consistent trace propagation (e.g., attach `traceId` to response header like `X-FON-Trace-Id`, configurable).

## 17. Acceptance Criteria

* Given an input with wrong keys but correct meaning, SDK returns schema-valid JSON.
* If mapping confidence is below default threshold, SDK fails with `CONFIDENCE_TOO_LOW` and a trace explaining why.
* If output fails validation, SDK fails with `VALIDATION_ERROR` and includes schema validation errors in trace.
* LLM output that is not valid mapping plan JSON fails deterministically with `MAPPING_PLAN_PARSE_ERROR`.
* Providers are isolated and swappable without changing core engine code.
* Cache reduces provider calls for repeated input shapes.

---

## 18. Open Questions (for later, not blockers)

* Do we support arrays mapping in v0 or v0.2?
* How much type coercion is allowed (string -> number, etc.)?
* Should low-confidence assignments be dropped (partial success) or fail hard (recommended initially: fail hard)?
* Best default threshold (0.85 vs 0.9) based on early tests.
