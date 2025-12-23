---
description: "Cloud Native Todo Backend - Comprehensive task list for AI-generated implementation"
---

# Tasks: Cloud Native Todo Chatbot Backend Service

**Input**: Design documents from `specs/001-backend-api/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/openapi.yaml ✅
**Tests**: TDD-first approach - all tests MUST be written before implementation code
**Organization**: Tasks grouped by user story (P1 CRUD + P2 Health/Chat) for independent parallel implementation
**Runtime**: Node.js 18+ with Express.js and Jest/Supertest

## Format: `[ID] [P?] [Story] Description with file paths`

- **[P]**: Can run in parallel (different files, no test→impl dependencies within same story)
- **[Story]**: User story reference (US1–US7) when applicable
- **File paths**: Absolute paths in src/, tests/, root directory

## Implementation Strategy

**MVP Scope**: User Stories 1-4 (Full CRUD - minimum viable product)
- Complete CRUD operations enable all other features to be tested
- Users can create, list, update, delete todos independently
- Forms foundation for chat endpoint (US5) and health checks (US6-7)

**Parallel Execution**:
- Phase 1 (Setup): Sequential foundation
- Phase 2 (Foundational): 2-3 tasks can run in parallel after core infrastructure
- Phase 3+ (User Stories): Each story runs independently in parallel; tests and implementation within story have dependencies (tests first, then implementation)
- Polish Phase: Sequential final touches

**Test-First Mandatory**: Each task includes test case generation BEFORE implementation. Tests must FAIL before implementation code is written.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling configuration, folder structure
**Duration**: ~30 min (AI-generated)
**Blocker**: All subsequent tasks depend on this phase

- [ ] T001 Initialize Node.js project with package.json and npm dependencies (Express, uuid, winston, jest, supertest, nodemon) at project root
- [ ] T002 Create folder structure: src/, tests/contract/, tests/integration/, tests/unit/ directories
- [ ] T003 [P] Initialize .env.example with PORT=3000, NODE_ENV=development, LOG_LEVEL=info at project root
- [ ] T004 [P] Create src/app.js Express application entry point with middleware setup (JSON parsing, logging, error handling)
- [ ] T005 [P] Create .gitignore to exclude node_modules/, .env, *.log, coverage/ files
- [ ] T006 [P] Create Dockerfile with multi-stage Node.js build (Alpine base) for containerization
- [ ] T007 Configure package.json scripts: `npm start`, `npm run dev`, `npm test`, `npm run test:contract`, `npm run test:integration`, `npm run test:unit`

**Checkpoint**: Project skeleton ready; dependencies installed; ready for foundational infrastructure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on
**Duration**: ~45 min (AI-generated)
**Blocker**: CRITICAL - all user stories wait for this phase completion

### Core Infrastructure (No story label - applies to all stories)

- [ ] T008 Create src/models/TodoStore.js class with in-memory Map-based storage (create, getAll, getById, update, delete methods per data-model.md)
- [ ] T009 Create src/utils/logger.js Winston structured logger configuration (JSON format, console output, request ID tracking, no credential logging)
- [ ] T010 [P] Create src/utils/error-handler.js standardized error response class with error code mapping (INVALID_TITLE, NOT_FOUND, INVALID_TYPE, INVALID_JSON, INTERNAL_ERROR)
- [ ] T011 [P] Create src/utils/validator.js input validation functions (titleValidator: non-empty, 1-500 chars, non-whitespace; uuidValidator: RFC 4122)
- [ ] T012 [P] Create src/routes.js Express router setup with placeholder routes (GET/POST /api/v1/todos, PUT/DELETE /api/v1/todos/:id, POST /api/v1/chat, GET /health, GET /ready)
- [ ] T013 Create src/middleware/logging.js request logging middleware that extracts/assigns request IDs for tracing
- [ ] T014 [P] Create src/middleware/error-handler.js Express error handling middleware (catches exceptions, returns standardized error responses)
- [ ] T015 Create jest.config.js test runner configuration (testEnvironment=node, coverage thresholds ≥80%, test patterns)

**Checkpoint**: Infrastructure complete - all user story implementation can now proceed in parallel

---

## Phase 3: User Story 1 - Create Todo via REST API (Priority: P1) 🎯 MVP

**Goal**: Implement POST /api/v1/todos endpoint that creates new todos with UUID, title validation, and 201 response
**Independent Test**: Single POST request creates todo; subsequent GET returns it; validates input (empty title rejected)
**Acceptance Criteria**: FR-001, FR-002 (create endpoint with validation); SC-001 (<200ms latency); SC-004 (title 1-500 chars)

### Tests for User Story 1 (Test-First: Write BEFORE implementation)

- [ ] T016 [P] [US1] Create contract test in tests/contract/create.test.js: valid POST request returns 201 with Todo object (id, title, completed=false)
- [ ] T017 [P] [US1] Create contract test in tests/contract/create.test.js: POST with empty title returns 400 Bad Request with INVALID_TITLE error
- [ ] T018 [P] [US1] Create contract test in tests/contract/create.test.js: POST with title >500 chars returns 400 Bad Request
- [ ] T019 [P] [US1] Create contract test in tests/contract/create.test.js: concurrent POST requests create todos with unique IDs

### Implementation for User Story 1

- [ ] T020 [US1] Implement POST handler in src/handlers/todos.js createTodo(req, res, next): validate title, call TodoStore.create(), return 201 with todo
- [ ] T021 [US1] Integrate POST /api/v1/todos route in src/app.js pointing to createTodo handler
- [ ] T022 [US1] Add request/response logging to createTodo handler (log request with title, response with generated ID)
- [ ] T023 [US1] Verify contract tests pass (npm run test:contract -- create.test.js)

**Checkpoint**: User Story 1 (Create) complete and independently testable. Next user stories can now proceed in parallel.

---

## Phase 4: User Story 2 - List All Todos (Priority: P1)

**Goal**: Implement GET /api/v1/todos endpoint that returns all todos as JSON array
**Independent Test**: GET request returns array; empty array when no todos; includes all todos regardless of completion status
**Acceptance Criteria**: FR-003 (list endpoint); SC-001 (<200ms latency)

### Tests for User Story 2 (Test-First)

- [ ] T024 [P] [US2] Create contract test in tests/contract/list.test.js: GET /api/v1/todos with todos returns 200 OK with array of todos
- [ ] T025 [P] [US2] Create contract test in tests/contract/list.test.js: GET /api/v1/todos with no todos returns 200 OK with empty array []
- [ ] T026 [P] [US2] Create contract test in tests/contract/list.test.js: GET returns todos with mixed completed states (true and false)

### Implementation for User Story 2

- [ ] T027 [US2] Implement GET handler in src/handlers/todos.js listTodos(req, res, next): call TodoStore.getAll(), return 200 with array
- [ ] T028 [US2] Integrate GET /api/v1/todos route in src/app.js pointing to listTodos handler
- [ ] T029 [US2] Add logging to listTodos handler (log request, response with count of returned todos)
- [ ] T030 [US2] Verify contract tests pass (npm run test:contract -- list.test.js)

**Checkpoint**: User Story 2 (List) complete. CRUD read operation verified.

---

## Phase 5: User Story 3 - Update Todo Completion Status (Priority: P1)

**Goal**: Implement PUT /api/v1/todos/{id} endpoint to toggle todo completion status
**Independent Test**: PUT with valid UUID and completed=true updates todo; PUT with invalid UUID returns 404; toggle twice returns to original state
**Acceptance Criteria**: FR-004 (update endpoint); SC-001 (<200ms latency)

### Tests for User Story 3 (Test-First)

- [ ] T031 [P] [US3] Create contract test in tests/contract/update.test.js: PUT with completed=true returns 200 with updated todo (completed=true)
- [ ] T032 [P] [US3] Create contract test in tests/contract/update.test.js: PUT with invalid todo ID returns 404 Not Found
- [ ] T033 [P] [US3] Create contract test in tests/contract/update.test.js: PUT toggle completed twice reverts to original state
- [ ] T034 [P] [US3] Create contract test in tests/contract/update.test.js: PUT with invalid UUID format returns 400 Bad Request

### Implementation for User Story 3

- [ ] T035 [US3] Implement PUT handler in src/handlers/todos.js updateTodo(req, res, next): validate ID (UUID), extract completed, call TodoStore.update(), return 200 with updated todo
- [ ] T036 [US3] Integrate PUT /api/v1/todos/:id route in src/app.js pointing to updateTodo handler
- [ ] T037 [US3] Add logging to updateTodo handler (log request with ID, response with previous and new state)
- [ ] T038 [US3] Verify contract tests pass (npm run test:contract -- update.test.js)

**Checkpoint**: User Story 3 (Update) complete. CRUD update operation verified.

---

## Phase 6: User Story 4 - Delete Todo (Priority: P1)

**Goal**: Implement DELETE /api/v1/todos/{id} endpoint to remove todos
**Independent Test**: DELETE removes todo; subsequent GET returns 404; DELETE invalid ID returns 404
**Acceptance Criteria**: FR-005, FR-006 (delete endpoint, 204 response); SC-001 (<200ms latency)

### Tests for User Story 4 (Test-First)

- [ ] T039 [P] [US4] Create contract test in tests/contract/delete.test.js: DELETE valid todo returns 204 No Content
- [ ] T040 [P] [US4] Create contract test in tests/contract/delete.test.js: DELETE with invalid todo ID returns 404 Not Found
- [ ] T041 [P] [US4] Create contract test in tests/contract/delete.test.js: POST then DELETE then GET(deleted ID) returns 404
- [ ] T042 [P] [US4] Create contract test in tests/contract/delete.test.js: DELETE invalid UUID format returns 400 Bad Request

### Implementation for User Story 4

- [ ] T043 [US4] Implement DELETE handler in src/handlers/todos.js deleteTodo(req, res, next): validate ID (UUID), call TodoStore.delete(), return 204 No Content
- [ ] T044 [US4] Integrate DELETE /api/v1/todos/:id route in src/app.js pointing to deleteTodo handler
- [ ] T045 [US4] Add logging to deleteTodo handler (log request with ID, response with deletion status)
- [ ] T046 [US4] Verify contract tests pass (npm run test:contract -- delete.test.js)

**Checkpoint**: User Story 4 (Delete) complete. Full CRUD operations implemented. MVP COMPLETE ✅

---

## Phase 7: User Story 5 - Chatbot Intent Mapping (Priority: P2)

**Goal**: Implement POST /api/v1/chat endpoint for natural language intent parsing and action execution
**Independent Test**: "add todo X" creates todo and returns CREATE_TODO intent; "show todos" executes LIST; unrecognized returns UNKNOWN
**Acceptance Criteria**: FR-007, FR-008 (chat endpoint, 5 intents); SC-005 (95% accuracy on test messages)

### Tests for User Story 5 (Test-First)

- [ ] T047 [P] [US5] Create contract test in tests/contract/chat.test.js: POST "add todo X" returns 200 with intent=CREATE_TODO, status=SUCCESS
- [ ] T048 [P] [US5] Create contract test in tests/contract/chat.test.js: POST "show todos" returns 200 with intent=LIST_TODOS, status=SUCCESS
- [ ] T049 [P] [US5] Create contract test in tests/contract/chat.test.js: POST "mark todo done" returns 200 with intent=UPDATE_TODO, status=SUCCESS
- [ ] T050 [P] [US5] Create contract test in tests/contract/chat.test.js: POST "delete todo" returns 200 with intent=DELETE_TODO, status=SUCCESS
- [ ] T051 [P] [US5] Create contract test in tests/contract/chat.test.js: POST unrecognized message returns 200 with intent=UNKNOWN, status=FAILED

### Implementation for User Story 5

- [ ] T052 [US5] Create src/chat/parser.js ChatParser class with parseIntent(message) method: keyword matching for 5 intents (add/create→CREATE, list/show→LIST, mark/done/complete→UPDATE, delete/remove→DELETE)
- [ ] T053 [US5] Create src/handlers/chat.js chatHandler(req, res, next): extract message, call ChatParser.parseIntent(), execute corresponding action (POST/GET/PUT/DELETE), return intent result
- [ ] T054 [US5] Integrate POST /api/v1/chat route in src/app.js pointing to chatHandler
- [ ] T055 [US5] Add logging to chat handler (log request with message, response with intent and status)
- [ ] T056 [US5] Verify contract tests pass (npm run test:contract -- chat.test.js)

**Checkpoint**: User Story 5 (Chat) complete. Chatbot integration functional.

---

## Phase 8: User Story 6 - Kubernetes Liveness Probe (Priority: P2)

**Goal**: Implement GET /health endpoint returning {status: "UP"} in <100ms for Kubernetes liveness detection
**Independent Test**: GET /health returns 200 OK with status=UP within 100ms; always responds regardless of internal state
**Acceptance Criteria**: FR-011 (health endpoint); SC-003 (<100ms response)

### Tests for User Story 6 (Test-First)

- [ ] T057 [P] [US6] Create contract test in tests/contract/health.test.js: GET /health returns 200 OK with {status: "UP"}
- [ ] T058 [P] [US6] Create contract test in tests/contract/health.test.js: GET /health response time <100ms (verify latency)

### Implementation for User Story 6

- [ ] T059 [US6] Implement GET handler in src/handlers/health.js healthCheck(req, res, next): return 200 with {status: "UP"}
- [ ] T060 [US6] Integrate GET /health route in src/app.js pointing to healthCheck handler (no middleware processing to minimize latency)
- [ ] T061 [US6] Verify contract tests pass (npm run test:contract -- health.test.js)

**Checkpoint**: User Story 6 (Health probe) complete. Kubernetes liveness probe ready.

---

## Phase 9: User Story 7 - Kubernetes Readiness Probe (Priority: P2)

**Goal**: Implement GET /ready endpoint returning {ready: boolean} for Kubernetes readiness detection before traffic routing
**Independent Test**: GET /ready returns 200 OK with ready=true when service initialized; may return 503 with ready=false during startup
**Acceptance Criteria**: FR-012 (readiness endpoint); SC-003 (<100ms response)

### Tests for User Story 7 (Test-First)

- [ ] T062 [P] [US7] Create contract test in tests/contract/ready.test.js: GET /ready returns 200 OK with {ready: true} when service initialized
- [ ] T063 [P] [US7] Create contract test in tests/contract/ready.test.js: GET /ready response time <100ms

### Implementation for User Story 7

- [ ] T064 [US7] Implement GET handler in src/handlers/health.js readinessCheck(req, res, next): return 200 with {ready: true} (service is always ready in Phase I)
- [ ] T065 [US7] Integrate GET /ready route in src/app.js pointing to readinessCheck handler
- [ ] T066 [US7] Verify contract tests pass (npm run test:contract -- ready.test.js)

**Checkpoint**: User Story 7 (Readiness probe) complete. Kubernetes readiness probe ready.

---

## Phase 10: Integration & Cross-Cutting Tests

**Purpose**: Validate multi-step workflows and system-wide functionality
**Duration**: ~30 min (AI-generated)

### Integration Tests (Multi-step Workflows)

- [ ] T067 [P] Create integration test in tests/integration/workflows.test.js: Create → List → Update → Delete workflow (POST, GET, PUT, DELETE sequence)
- [ ] T068 [P] Create integration test in tests/integration/workflows.test.js: Verify chat parser correctly executes CREATE_TODO intent via /chat endpoint
- [ ] T069 [P] Create integration test in tests/integration/workflows.test.js: Verify health checks respond while handling concurrent CRUD requests

### Unit Tests (Component-level testing)

- [ ] T070 [P] Create unit tests in tests/unit/models.test.js: TodoStore.create, getAll, getById, update, delete methods with edge cases
- [ ] T071 [P] Create unit tests in tests/unit/chat.test.js: ChatParser intent recognition for all 5 intents + edge cases (typos, mixed case, compound messages)
- [ ] T072 [P] Create unit tests in tests/unit/validator.test.js: titleValidator (empty, 1-500 chars, whitespace) and uuidValidator (valid/invalid UUIDs)

### Test Coverage & Metrics

- [ ] T073 Run full test suite: npm test (all contract + integration + unit tests)
- [ ] T074 Verify code coverage ≥80%: npm test -- --coverage
- [ ] T075 Run performance check: Measure p95 latency of CRUD endpoints (should be <100ms locally, <200ms in validation)

**Checkpoint**: All tests passing; coverage ≥80%; integration workflows verified

---

## Phase 11: Polish & Docker Containerization

**Purpose**: Final configuration, Docker readiness, documentation
**Duration**: ~20 min (AI-generated)

### Docker & Configuration

- [ ] T076 Create Dockerfile with Node.js 18 Alpine base, COPY src/, package.json, EXPOSE 3000, HEALTHCHECK for liveness probe
- [ ] T077 Create docker-compose.yml (optional) for local multi-container setup (if future phases require supporting services)
- [ ] T078 Create .dockerignore to exclude node_modules/, .git, .env, tests/ from image build
- [ ] T079 Create .env.example with all required environment variables documented (PORT, NODE_ENV, LOG_LEVEL)

### Documentation & Verification

- [ ] T080 Verify all endpoints documented in contracts/openapi.yaml match implementation
- [ ] T081 Create README.md with setup instructions, API examples, testing commands (reference quickstart.md)
- [ ] T082 Verify all success criteria met (SC-001 through SC-008 from spec.md)
- [ ] T083 Build Docker image: docker build -t todo-api:latest .
- [ ] T084 Test Docker image: docker run -p 3000:3000 todo-api:latest; verify health and endpoints respond

### Code Quality & Final Checks

- [ ] T085 [P] Run linter (ESLint if configured): npm run lint
- [ ] T086 [P] Run all tests one final time: npm test
- [ ] T087 Verify no console.log() statements (use logger instead)
- [ ] T088 Verify no hardcoded secrets or sensitive data in code/config

**Checkpoint**: All code complete, tested, containerized, ready for deployment

---

## Phase 12: Kubernetes Deployment & Final Validation

**Purpose**: Verify Kubernetes readiness, health probes, and deployment manifests
**Duration**: ~15 min (verification only; no new code)

### Kubernetes Readiness

- [ ] T089 Create k8s/deployment.yaml with Deployment spec (3 replicas, health probes, resource limits)
- [ ] T090 Verify liveness probe configuration in deployment: GET /health, initialDelaySeconds=5, periodSeconds=10
- [ ] T091 Verify readiness probe configuration in deployment: GET /ready, initialDelaySeconds=3, periodSeconds=5
- [ ] T092 Verify service spec for port mapping (3000:3000) and load balancer configuration

### Final Validation

- [ ] T093 Verify all 7 endpoints accessible and return correct responses (POST/GET/PUT/DELETE /todos, /chat, /health, /ready)
- [ ] T094 Verify error handling: 400 Bad Request (validation), 404 Not Found (missing resource), 500 Internal Error (unexpected)
- [ ] T095 Verify stateless design: service restart does not lose running requests (in-memory data loss acceptable per spec)
- [ ] T096 Final code review: Verify 100% AI-generated (no manual code modifications)

**Checkpoint**: All validation complete; ready for Kubernetes deployment

---

## Task Summary & Execution Guide

### Total Tasks: 96

**Distribution by Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 8 tasks
- Phase 3 (US1 - Create): 8 tasks
- Phase 4 (US2 - List): 7 tasks
- Phase 5 (US3 - Update): 8 tasks
- Phase 6 (US4 - Delete): 8 tasks
- Phase 7 (US5 - Chat): 10 tasks
- Phase 8 (US6 - Health): 3 tasks
- Phase 9 (US7 - Ready): 3 tasks
- Phase 10 (Integration & Unit Tests): 6 tasks
- Phase 11 (Polish & Docker): 9 tasks
- Phase 12 (Kubernetes & Validation): 8 tasks

**Parallel Opportunities**:
- Phase 1: T003-T007 can run in parallel (different files, no dependencies)
- Phase 2: T010, T011, T012, T014 can run in parallel (different files, no dependencies)
- Phase 3-9: All tests (T016-T066) can run in parallel; implementation tasks within each story have dependencies (tests→implementation)
- Phase 10: T067-T072 can run partially in parallel (different test files)
- Phase 11: T076-T079 and T080-T082 partially parallelizable
- Phase 12: T089-T091 can run in parallel; T093-T096 should run sequentially for final validation

**MVP Scope** (Minimum Viable Product):
- Complete Phases 1-6 (Phases 1-2 + US1-4)
- All CRUD operations functional and tested
- Ready to demonstrate to users and chatbot
- Delivers core value per specification
- Estimated: 56 tasks (T001-T046)

**Full Scope** (Complete Feature):
- All 12 phases and 96 tasks
- CRUD + Chat + Health checks + Docker + Kubernetes
- Production-ready configuration
- Estimated: 96 tasks

**Test-First Execution Model**:
1. For each user story, run tests FIRST (T016-T018, T024-T026, etc.)
2. Verify tests FAIL (Red phase)
3. Then implement handler code (T020-T021, T027-T028, etc.)
4. Verify tests PASS (Green phase)
5. Refactor if needed; verify all tests still PASS

**Runtime**: Node.js 18+ with Express.js. All code AI-generated via Claude Code.

---

## Dependencies & Prerequisites

**Blocking Dependencies**:
- Phase 1 must complete before any other phase
- Phase 2 must complete before Phases 3-9
- Within each user story: Tests must pass before implementation considered complete
- Phase 10 can start after Phase 6 (MVP complete)
- Phase 11-12 only after Phase 10 complete

**Non-Blocking Dependencies**:
- Phases 3-9 can run in any order after Phase 2 (independent stories)
- Parallel test writing across all user stories once Phase 2 complete

---

## Next Steps

1. **Generate Test Files** → Claude Code creates all test files (tests/contract/*.test.js, tests/integration/*.test.js, tests/unit/*.test.js)
2. **Verify Tests Fail** → Run npm test; confirm RED phase (all tests fail with "not implemented")
3. **Implement Handlers** → Claude Code creates src/handlers/*.js, src/chat/parser.js
4. **Verify Tests Pass** → Run npm test; confirm GREEN phase (all tests pass)
5. **Run Integration & Unit Tests** → Verify cross-cutting concerns
6. **Build & Test Docker** → docker build, docker run, verify endpoints
7. **Deploy to Kubernetes** (optional) → Apply k8s/deployment.yaml, verify health probes

---

## Success Criteria Verification

| Criterion | Task(s) | Verification |
|-----------|---------|--------------|
| SC-001: <200ms p95 latency | T023, T030, T038, T046, T056, T061, T066, T075 | npm test; latency assertions in contract tests |
| SC-002: 100 req/s throughput | T075 | Load test with autocannon (npm run load-test) |
| SC-003: <100ms health response | T058, T063, T075 | Health check latency assertions |
| SC-004: Title validation | T017, T018 | Contract tests for empty/>500 char titles |
| SC-005: 95% chat accuracy | T047-T051, T072 | 50+ message test cases in unit tests |
| SC-006: All FR-001-017 verified | T023, T030, T038, T046, T056, T061, T066 | Contract test suite complete |
| SC-007: Stateless restart <5s | T083-T084 | Docker container restart verification |
| SC-008: 100% AI-generated | T096 | Code review audit trail |

---

## Estimated Effort (AI Generation)

- **Phase 1-2 Setup**: 15 min (infrastructure boilerplate)
- **Phase 3-6 CRUD**: 45 min (tests + handlers + routes)
- **Phase 7-9 Features**: 25 min (chat + health probes)
- **Phase 10 Tests**: 30 min (integration + unit)
- **Phase 11 Polish**: 20 min (Docker, config)
- **Phase 12 Validation**: 15 min (verification only)

**Total**: ~2.5 hours for 100% AI-generated, fully tested, production-ready backend

---

**Ready for implementation. All tasks are AI-generatable. No manual coding required. ✅**
