# Phase 1: Data Model & Entity Design

**Feature**: Cloud Native Todo Chatbot Backend Service
**Date**: 2025-12-23
**Status**: Complete

## Entity: Todo

### Schema Definition

```typescript
interface Todo {
  id: string;           // UUID v4; auto-generated at creation; immutable
  title: string;        // 1-500 characters; required; must contain non-whitespace
  completed: boolean;   // default: false; user-updatable; toggleable
}
```

### Storage Implementation (Phase I)

```javascript
// In-memory Map-based store
class TodoStore {
  constructor() {
    this.todos = new Map();  // key: todo.id, value: todo object
  }

  create(title) {
    // Validate: title non-empty, 1-500 chars
    // Generate: UUID v4 as id
    // Set: completed = false
    // Add to map
    // Return: new todo
  }

  getAll() {
    // Return: Array of all todos (convert Map values to array)
  }

  getById(id) {
    // Return: todo object or undefined
  }

  update(id, updates) {
    // Merge: updates into existing todo
    // Return: updated todo
  }

  delete(id) {
    // Remove: todo from map
    // Return: boolean (success)
  }
}
```

### Validation Rules

| Field | Validation Rule | Error Code | HTTP Status |
|-------|-----------------|-----------|-------------|
| `title` (create) | Required; non-empty; 1-500 chars; non-whitespace | INVALID_TITLE | 400 |
| `completed` (update) | Must be boolean | INVALID_TYPE | 400 |
| `id` (get/update/delete) | Must be valid UUID; must exist | NOT_FOUND | 404 |
| JSON body | Valid JSON; no extra fields | INVALID_JSON | 400 |

### State Transitions

```
CREATION:
  - title provided (validated) → id assigned (UUID) → completed = false

UPDATE:
  - completed: false → completed: true (mark done)
  - completed: true → completed: false (mark incomplete)
  - title: immutable (no update endpoint for title)

DELETION:
  - todo exists → removed from store → subsequent access returns 404
```

### Data Consistency

- **Immutable Fields**: `id` (auto-assigned), `title` (no update endpoint)
- **Mutable Fields**: `completed` (toggle via PUT)
- **Concurrent Updates**: Last-write-wins (no optimistic locking required for Phase I)
- **No Relationships**: Todos are isolated entities; no foreign keys, no cascades

---

## Chat Intent Model

### Intent Entity

```typescript
interface ChatIntent {
  message: string;      // User input from chatbot
  intent: string;       // Parsed intent: CREATE_TODO | LIST_TODOS | UPDATE_TODO | DELETE_TODO | UNKNOWN
  status: string;       // SUCCESS | FAILED
  result?: object;      // Optional result from executed action
  error?: string;       // Optional error message if status = FAILED
}
```

### Intent Parsing Logic

```javascript
class ChatParser {
  parseIntent(message) {
    // Convert to lowercase
    // Check for keywords:
    //   - CREATE_TODO: "add", "create", "new"
    //   - LIST_TODOS: "list", "show", "get all"
    //   - UPDATE_TODO: "mark", "done", "complete", "check"
    //   - DELETE_TODO: "delete", "remove", "clear"
    // Return: { intent: "...", status: "SUCCESS" | "FAILED" }
    // If no keywords match → intent: "UNKNOWN", status: "FAILED"
  }
}
```

### Intent-to-Action Mapping

| Intent | Action | Endpoint Called | Parameters |
|--------|--------|-----------------|-----------|
| CREATE_TODO | Create new todo | POST /api/v1/todos | title extracted from message |
| LIST_TODOS | Retrieve all todos | GET /api/v1/todos | none |
| UPDATE_TODO | Mark todo as done | PUT /api/v1/todos/{id} | id extracted from message; completed=true |
| DELETE_TODO | Remove todo | DELETE /api/v1/todos/{id} | id extracted from message |
| UNKNOWN | Log; return error | none | none |

### Parsing Examples

```
"add todo buy milk" → CREATE_TODO, title="buy milk"
"show my todos" → LIST_TODOS
"mark todo 1 done" → UPDATE_TODO, id="1" (or UUID if provided)
"delete todo 2" → DELETE_TODO, id="2"
"xyz abc 123" → UNKNOWN, status=FAILED, error="Could not parse intent"
```

---

## Health Probe Entities

### Health Response

```typescript
interface HealthResponse {
  status: "UP" | "DOWN";
  timestamp?: string;     // ISO 8601
}
```

### Readiness Response

```typescript
interface ReadinessResponse {
  ready: boolean;
  timestamp?: string;      // ISO 8601
  details?: object;        // Optional: { todoStore: "initialized", ... }
}
```

---

## Error Response Model

```typescript
interface ErrorResponse {
  error: string;           // Human-readable error message
  code: string;            // Machine-readable error code
  requestId?: string;      // For tracing
  timestamp?: string;      // ISO 8601
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|------------|
| INVALID_TITLE | 400 | Title validation failed (empty, too long, etc.) |
| INVALID_TYPE | 400 | Field type mismatch (e.g., completed not boolean) |
| INVALID_JSON | 400 | Request body not valid JSON |
| NOT_FOUND | 404 | Todo ID not found |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Phase II Upgrade: Database Migration

When transitioning to persistent storage (PostgreSQL, MongoDB):

**No API Contract Changes Required**:
- Todo entity schema remains identical
- Request/response structures unchanged
- Validation rules unchanged

**Internal Changes**:
- TodoStore class refactored to use ORM (e.g., Prisma, TypeORM)
- Database schema created (one table: todos with id, title, completed, created_at, updated_at)
- Migration scripts generated
- Indexes created on frequently queried fields (id, created_at)

**Backward Compatibility**:
- Existing API clients work without modification
- Existing tests pass without modification
- Performance may improve with database optimizations

---

## Summary

- **Core Entity**: Todo (id: UUID, title: string, completed: boolean)
- **Storage**: In-memory Map (Phase I); upgradeable to database (Phase II)
- **Chat Intent**: Keyword-based parser mapping natural language to 5 intents
- **Health/Readiness**: Simple status responses for Kubernetes probes
- **Errors**: Standardized error response with code and message
- **Validation**: Title required and constrained; ID immutable; completed toggleable
- **No Relationships**: Single-entity model; no cascades or dependencies

Ready for Phase 1 contract generation and quickstart documentation.
