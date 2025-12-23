# Phase 0: Research & Technology Decisions

**Feature**: Cloud Native Todo Chatbot Backend Service
**Date**: 2025-12-23
**Status**: Complete

## Technology Stack Decisions

### Language/Runtime Choice

**Decision**: Node.js 18+ (default) with Express.js
**Rationale**:
- Rapid REST API development; Express is lightweight and battle-tested
- Native UUID support via built-in `crypto.randomUUID()`
- Jest + Supertest provide excellent testing framework for contract tests
- Docker containerization straightforward; Node.js images are small (~150MB)
- Event-driven architecture aligns with stateless, concurrent request handling
- Large ecosystem for logging (winston/pino) and structured logging

**Alternatives Considered**:
- Python 3.10+ FastAPI: Also viable; similar performance; slightly more verbose but very clear syntax. Chose Node.js for speed of development.
- Go with net/http: Fastest runtime; would complicate testing setup; less familiar to potential contributors; deferred.
- Rust with Actix/Axum: Overkill for Phase I requirements; steeper learning curve.

**Alternative Implementation Strategy**: Project remains runtime-agnostic. API contracts defined in OpenAPI 3.0 enable Python FastAPI implementation as drop-in replacement without frontend/chatbot changes.

---

### Storage Solution

**Decision**: In-memory Map/Object (Phase I development)
**Rationale**:
- Zero external dependencies; no database setup required for local development
- Meets performance target (<200ms p95) trivially
- Stateless restart acceptable (data loss expected); specification documents this assumption
- No migrations, no schema versioning complexity
- API contract remains unchanged when swapping storage backend (Phase II)

**Alternatives Considered**:
- SQLite: Added complexity; still requires file I/O; overkill for Phase I
- PostgreSQL: Network latency; required Docker setup; deferred to Phase II when persistence mandatory
- Redis: Still external service; adds ops burden

**Upgrade Path**: Phase II will add database layer behind same API contracts. Route handlers will call repository methods instead of in-memory Map; business logic unchanged.

---

### Testing Framework

**Decision**: Jest + Supertest (Node.js)
**Rationale**:
- Jest: Industry standard; built-in mocking, snapshot testing, code coverage
- Supertest: Elegant HTTP assertion library; minimal boilerplate for API testing
- Both widely used; easy for collaborators to understand
- Excellent contract test support: define expected responses; Supertest verifies

**Alternatives Considered**:
- Mocha + Chai: More verbose; requires separate assertion library and HTTP client (superagent)
- Vitest: Newer; faster; less mature ecosystem; saved for future optimization

---

### Chat Intent Parser Implementation

**Decision**: Keyword-matching based parser (Phase I)
**Rationale**:
- Specification calls for simple intent parsing; no ML NLP required
- Keyword matching sufficient for 95% accuracy on limited vocabulary (create, list, update, delete, done, complete, etc.)
- No external API calls; 100% local processing; <10ms latency
- Easily testable; deterministic

**Alternatives Considered**:
- DialogFlow/Rasa: External service; adds latency, cost, complexity; overkill for fixed intent set
- OpenAI API: Possible future; cost per request; deferred to Phase II when natural language understanding more critical

**Keyword Mapping**:
```
CREATE_TODO: "add", "create", "new"
LIST_TODOS: "list", "show", "get all", "display"
UPDATE_TODO: "mark", "done", "complete", "check", "finish"
DELETE_TODO: "delete", "remove", "clear"
UNKNOWN: anything else
```

---

### Docker & Kubernetes Strategy

**Decision**: Lightweight Node.js image; Alpine base; multi-stage build (optional)
**Rationale**:
- Alpine Linux: ~150MB base image vs ~1GB Ubuntu
- Node official images well-maintained
- Health checks via CMD in Dockerfile (supports /health and /ready endpoints)
- No shell required in production; reduces attack surface
- Kubernetes manifests: simple Deployment with liveness/readiness probes

**Dockerfile Structure**:
1. Build stage: Install dependencies
2. Runtime stage: Copy compiled artifacts; expose port 3000; health check command

---

### Logging & Observability

**Decision**: Winston (structured JSON logging to stdout)
**Rationale**:
- Structured JSON enables log aggregation (ELK, Datadog, etc.)
- stdout redirection: Kubernetes captures container logs automatically
- Winston levels: debug, info, warn, error; configurable via NODE_ENV
- Exclude credentials, PII, secrets from all logs (enforced in code review)

**Log Format**:
```json
{
  "timestamp": "2025-12-23T10:30:45Z",
  "level": "info",
  "requestId": "req-12345",
  "action": "createTodo",
  "message": "Todo created successfully",
  "userId": "anonymous",
  "duration_ms": 15
}
```

---

### Error Handling Strategy

**Decision**: Standardized error responses; development vs production modes
**Rationale**:
- All endpoints return `{"error": "message", "code": "ERROR_CODE"}` format
- HTTP status codes: 400 (validation), 404 (not found), 500 (server error)
- Development mode: stack traces in error response (aids debugging)
- Production mode (NODE_ENV=production): no stack traces; only user-friendly message

---

### Environment Configuration

**Decision**: `.env` file for local development; environment variables for production
**Rationale**:
- No hardcoded config; Constitution principle VI (Security by Default)
- `.env` committed as `.env.example` (no secrets); actual `.env` in `.gitignore`
- Kubernetes: secrets passed as environment variables via deployment manifests

**Required Variables**:
- `PORT` (default 3000)
- `NODE_ENV` (default "development"; set to "production" for Kubernetes)
- `LOG_LEVEL` (default "info")

---

## Performance & Load Testing Plan

**Performance Target**: <200ms p95 latency; 100 req/s throughput

**Load Testing Approach** (Phase II):
- Use Apache JMeter or autocannon
- 100 concurrent clients; 60-second test duration
- Measure: latency (p50, p95, p99), throughput (req/s), errors

**Expected Results**:
- Local development (in-memory): <50ms p95
- Production (Docker on modern hardware): <100ms p95
- Throughput: 500+ req/s (well above 100 req/s target)

---

## Security Review

**Input Validation**:
- Todo title: required, non-empty, max 500 characters, no executable code patterns (XSS prevention)
- Todo ID: UUID only; strict validation; reject malformed UUIDs
- JSON parsing: framework handles; rejects invalid JSON with 400 Bad Request

**Secret Management**:
- No secrets in code
- Environment variables for config (PORT, LOG_LEVEL, etc.)
- No credentials stored locally; no API keys hardcoded

**Error Disclosure**:
- Development: full error details (stack traces) for debugging
- Production: sanitized errors (no internal state leakage)

**Logging**:
- All requests logged with request ID
- Excluded from logs: passwords, API keys, PII, todo content (in production)
- Log rotation: configured in docker-compose

---

## Dependencies Summary

**Production**:
- `express` (4.18+): HTTP server framework
- `uuid`: UUID generation
- `winston`: Structured logging

**Development & Testing**:
- `jest`: Test runner
- `supertest`: HTTP assertion library
- `nodemon`: Auto-restart on file changes

**Docker**:
- `node:18-alpine`: Base image

**Total**: ~10-15 direct dependencies; minimal footprint; no bloat

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| In-memory data loss on restart | Documented in spec as acceptable for Phase I; add database in Phase II |
| Concurrent request race conditions | Node.js event loop single-threaded; JSON mutations via Object.assign (atomic from JS perspective) |
| Chat parsing accuracy <95% | Expand keyword list during testing; log failed intents for analysis |
| Performance regression | Contract tests verify latency bounds; load tests before release |
| Security: environment variable leakage | Code review; never log env vars; use `.env.example` template |

---

## Next Steps

Phase 0 research complete. All unknowns resolved. Proceed to Phase 1:
1. Generate `data-model.md` (Todo entity schema)
2. Generate `contracts/` (OpenAPI 3.0 schema)
3. Generate `quickstart.md` (local development setup)
4. Generate agent-specific context file (for Claude Code)

Then proceed to `/sp.tasks` for granular task generation and TDD code generation.
