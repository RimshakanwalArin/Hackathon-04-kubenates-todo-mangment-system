# Tasks: Cloud Native Todo Chatbot Frontend (Phase II)

**Input**: Design documents from `/specs/002-frontend-chatbot-ui/` (spec.md, plan.md)
**Branch**: `002-frontend-chatbot-ui`
**Created**: 2025-12-23
**Status**: Ready for Implementation via `/sp.implement`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Each user story can be implemented and tested independently, with P1 stories forming the MVP.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US5 from spec.md)
- **File paths**: Relative to `frontend/` directory

## Path Conventions

Frontend is a standalone SPA at `frontend/` directory:
- `frontend/src/` - React source code
- `frontend/tests/` - Jest + RTL test files
- `frontend/public/` - Static assets
- `frontend/` root - Config files (vite.config.js, jest.config.js, package.json, .env.example, Dockerfile)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, build tooling, and configuration

- [ ] T001 Create frontend directory structure per implementation plan in `frontend/`
- [ ] T002 [P] Initialize package.json with React 18.x, Tailwind CSS, Vite, Jest dependencies in `frontend/package.json`
- [ ] T003 [P] Configure Vite build tool with vite.config.js (React plugin, build targets, env handling) in `frontend/vite.config.js`
- [ ] T004 [P] Configure Jest test runner with jest.config.js (React Testing Library setup, coverage thresholds ≥80%) in `frontend/jest.config.js`
- [ ] T005 [P] Configure ESLint rules and formatting in `frontend/.eslintrc.json`
- [ ] T006 [P] Create Tailwind CSS configuration in `frontend/src/styles/tailwind.config.js`
- [ ] T007 [P] Create .env.example with API_BASE_URL placeholder in `frontend/.env.example`
- [ ] T008 [P] Create HTML entry point with React root mount in `frontend/index.html`

**Checkpoint**: Project structure initialized, dependencies installed, build tool configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 [P] Create React Context for chat state management in `frontend/src/context/ChatContext.jsx` (stores messages, isConnected, lastError, apiBaseUrl)
- [ ] T010 [P] Implement Fetch API wrapper with error handling in `frontend/src/services/api-client.js` (AbortController for timeout, error mapping, retry logic)
- [ ] T011 [P] Implement health check service in `frontend/src/services/health-check.js` (GET /health with 5s timeout)
- [ ] T012 [P] Create error handler utility mapping backend codes to user messages in `frontend/src/utils/error-handlers.js`
- [ ] T013 [P] Create message formatter utility for display in `frontend/src/utils/message-formatter.js`
- [ ] T014 [P] Create Tailwind CSS directives and base styles in `frontend/src/styles/index.css` (global styles, responsive breakpoints)
- [ ] T015 [P] Create React root component (App.jsx) with context provider and health check on mount in `frontend/src/App.jsx`
- [ ] T016 [P] Create main.jsx React DOM render entry point in `frontend/src/main.jsx`
- [ ] T017 [P] Configure environment variable loading in `frontend/src/config/env.js` (API_BASE_URL with fallback)

**Checkpoint**: Foundation ready - all infrastructure in place, context providers working, API client ready

---

## Phase 3: User Story 1 - Chat Interface & Message Display (Priority: P1) 🎯 MVP

**Goal**: Create a clean chat interface where users can see messages and conversation history

**Independent Test**: Open app → verify chat input field exists → type message → verify message appears in history → scroll up → verify conversation history in chronological order

### Tests for User Story 1 (Test-First)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T018 [P] [US1] Unit test for ChatInterface component rendering in `frontend/tests/unit/components.test.jsx` (verify MessageList, MessageInput, ErrorMessage, WelcomeMessage rendered)
- [ ] T019 [P] [US1] Unit test for MessageList component displaying messages in order in `frontend/tests/unit/components.test.jsx`
- [ ] T020 [P] [US1] Unit test for MessageInput component with input field and send button in `frontend/tests/unit/components.test.jsx`
- [ ] T021 [P] [US1] Integration test for chat message display flow in `frontend/tests/integration/chat-flow.test.jsx`

### Implementation for User Story 1

- [ ] T022 [P] [US1] Create ChatInterface container component in `frontend/src/components/ChatInterface.jsx` (layout: MessageList + MessageInput + ErrorMessage + WelcomeMessage)
- [ ] T023 [P] [US1] Create MessageList component displaying message history in `frontend/src/components/MessageList.jsx` (scrollable, auto-scroll to newest, chronological order)
- [ ] T024 [P] [US1] Create MessageInput component with text input and send button in `frontend/src/components/MessageInput.jsx` (input validation: non-empty, max 500 chars)
- [ ] T025 [P] [US1] Create UserMessage component styling for user messages in `frontend/src/components/UserMessage.jsx`
- [ ] T026 [P] [US1] Create BotMessage component styling for bot responses in `frontend/src/components/BotMessage.jsx`
- [ ] T027 [P] [US1] Create WelcomeMessage component for empty chat state in `frontend/src/components/WelcomeMessage.jsx` ("Welcome! Type a message to get started")
- [ ] T028 [US1] Implement message addition to context on send in ChatInterface (dispatch addMessage action to ChatContext)
- [ ] T029 [US1] Integrate ChatInterface with ChatContext to display history and handle input in `frontend/src/App.jsx`

**Checkpoint**: User Story 1 complete - chat UI fully functional, messages display and persist during session

---

## Phase 4: User Story 2 - Chat Integration with Backend (Priority: P1) 🎯 MVP

**Goal**: Send user messages to backend and display bot responses

**Independent Test**: Send message "add test" → verify HTTP POST to /api/v1/chat → verify bot response displayed → send invalid message → verify error message shown

### Tests for User Story 2 (Test-First)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T030 [P] [US2] Unit test for api-client POST /api/v1/chat in `frontend/tests/unit/services.test.js` (request format, response parsing, error handling)
- [ ] T031 [P] [US2] Unit test for health check service in `frontend/tests/unit/services.test.js` (verifies /health endpoint accessibility)
- [ ] T032 [P] [US2] Integration test for complete message send → backend response → display flow in `frontend/tests/integration/chat-flow.test.jsx`
- [ ] T033 [P] [US2] Integration test for error response handling in `frontend/tests/integration/chat-flow.test.jsx` (backend unavailable, malformed response)

### Implementation for User Story 2

- [ ] T034 [P] [US2] Create sendMessage function dispatching to api-client in ChatInterface in `frontend/src/components/ChatInterface.jsx`
- [ ] T035 [P] [US2] Implement message send handler calling api-client.post('/api/v1/chat') in `frontend/src/services/api-client.js` (include request format {message: string})
- [ ] T036 [P] [US2] Implement response parsing in api-client extracting intent, status, result fields in `frontend/src/services/api-client.js`
- [ ] T037 [US2] Implement bot response display in ChatInterface adding response to message history in `frontend/src/components/ChatInterface.jsx`
- [ ] T038 [US2] Implement error response handling displaying backend error messages in `frontend/src/components/ChatInterface.jsx`
- [ ] T039 [US2] Verify health check runs on App mount before showing chat UI in `frontend/src/App.jsx`

**Checkpoint**: User Story 2 complete - full message send/response cycle working, backend integration verified

---

## Phase 5: User Story 3 - Natural Language Todo Management (Priority: P1) 🎯 MVP

**Goal**: Enable users to perform todo CRUD operations via natural language commands

**Independent Test**: Send "add Buy groceries" → verify todo created → send "show todos" → verify list displayed → send "mark Buy groceries done" → verify status updated → send "delete Buy groceries" → verify todo removed

### Tests for User Story 3 (Test-First)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T040 [P] [US3] Integration test for "add [task]" intent creating todo in `frontend/tests/integration/chat-flow.test.jsx` (verify backend response parsed, confirmation shown)
- [ ] T041 [P] [US3] Integration test for "list/show todos" intent displaying todo array in `frontend/tests/integration/chat-flow.test.jsx` (verify todos formatted readable)
- [ ] T042 [P] [US3] Integration test for "mark [task] done" intent updating todo status in `frontend/tests/integration/chat-flow.test.jsx`
- [ ] T043 [P] [US3] Integration test for "delete [task]" intent removing todo in `frontend/tests/integration/chat-flow.test.jsx`

### Implementation for User Story 3

- [ ] T044 [P] [US3] Create TodoList component for displaying todo array responses in `frontend/src/components/TodoList.jsx` (render as readable list with status indicators)
- [ ] T045 [P] [US3] Implement todo response formatter in message-formatter.js extracting and displaying todo arrays from bot responses in `frontend/src/utils/message-formatter.js`
- [ ] T046 [US3] Implement intent-specific response handling in ChatInterface for CREATE_TODO, LIST_TODOS, UPDATE_TODO, DELETE_TODO in `frontend/src/components/ChatInterface.jsx` (map backend intent to display logic)
- [ ] T047 [US3] Integrate TodoList component into BotMessage component for todo array responses in `frontend/src/components/BotMessage.jsx`

**Checkpoint**: User Story 3 complete - all todo operations functional via chat, MVP feature set complete

---

## Phase 6: User Story 4 - Loading & Error States (Priority: P2)

**Goal**: Provide clear visual feedback during async operations and error conditions

**Independent Test**: Send message → verify loading indicator appears → wait for response → verify indicator disappears → simulate backend error → verify error message appears with retry option

### Tests for User Story 4 (Test-First)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T048 [P] [US4] Unit test for LoadingIndicator component in `frontend/tests/unit/components.test.jsx` (verify renders when isLoading true, hides when false)
- [ ] T049 [P] [US4] Unit test for ErrorMessage component in `frontend/tests/unit/components.test.jsx` (verify displays message, renders retry button)
- [ ] T050 [P] [US4] Integration test for loading indicator during message processing in `frontend/tests/integration/chat-flow.test.jsx` (verify appears on send, disappears on response)
- [ ] T051 [P] [US4] Integration test for error message display and retry functionality in `frontend/tests/integration/chat-flow.test.jsx` (simulate backend failure, verify recovery)

### Implementation for User Story 4

- [ ] T052 [P] [US4] Create LoadingIndicator component with spinner/typing dots animation in `frontend/src/components/LoadingIndicator.jsx`
- [ ] T053 [P] [US4] Create ErrorMessage component displaying error with dismiss and retry buttons in `frontend/src/components/ErrorMessage.jsx`
- [ ] T054 [US4] Implement loading state in ChatContext (isLoading flag) in `frontend/src/context/ChatContext.jsx`
- [ ] T055 [US4] Implement loading indicator display during message processing in ChatInterface in `frontend/src/components/ChatInterface.jsx` (show while awaiting response)
- [ ] T056 [US4] Implement error state display in ChatInterface showing ErrorMessage component in `frontend/src/components/ChatInterface.jsx`
- [ ] T057 [US4] Implement retry functionality in ErrorMessage re-sending failed message in `frontend/src/components/ErrorMessage.jsx` (dispatch to ChatContext)
- [ ] T058 [US4] Implement timeout handling (>2 seconds) keeping loading indicator visible without duplication in `frontend/src/services/api-client.js`

**Checkpoint**: User Story 4 complete - loading and error states fully functional

---

## Phase 7: User Story 5 - Message History & Session Management (Priority: P2)

**Goal**: Preserve conversation during session, allow navigation through message history

**Independent Test**: Send multiple messages → scroll up → verify all messages visible → refresh page → verify history cleared (session-based) → send more messages → verify auto-scroll to newest

### Tests for User Story 5 (Test-First)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T059 [P] [US5] Integration test for message history persistence during session in `frontend/tests/integration/chat-flow.test.jsx` (send multiple, scroll, verify all visible)
- [ ] T060 [P] [US5] Integration test for history cleared on page refresh in `frontend/tests/integration/chat-flow.test.jsx` (verify ephemeral behavior)
- [ ] T061 [P] [US5] Unit test for auto-scroll to latest message in MessageList in `frontend/tests/unit/components.test.jsx`

### Implementation for User Story 5

- [ ] T062 [P] [US5] Implement auto-scroll to newest message in MessageList using useEffect and ref in `frontend/src/components/MessageList.jsx` (scroll on message addition)
- [ ] T063 [P] [US5] Implement message history persistence in ChatContext (stored in memory, not localStorage) in `frontend/src/context/ChatContext.jsx`
- [ ] T064 [US5] Ensure scroll position maintained when new messages arrive in MessageList in `frontend/src/components/MessageList.jsx`

**Checkpoint**: User Story 5 complete - full session management and message history working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Optimization, testing coverage, documentation, and build preparation

- [ ] T065 [P] Add remaining unit tests for all components in `frontend/tests/unit/components.test.jsx` (target ≥80% coverage)
- [ ] T066 [P] Add service layer unit tests in `frontend/tests/unit/services.test.js` (api-client, health-check, error-handlers, message-formatter)
- [ ] T067 [P] Add edge case integration tests in `frontend/tests/integration/chat-flow.test.jsx` (very long messages, empty responses, rapid sends, network timeout)
- [ ] T068 [P] Run full test suite and verify ≥80% branch coverage in `frontend/tests/`
- [ ] T069 [P] Create Dockerfile for Nginx static SPA serving in `frontend/Dockerfile` (multi-stage build with React build optimization)
- [ ] T070 [P] Optimize Tailwind CSS build purging unused classes in `frontend/vite.config.js`
- [ ] T071 [P] Verify bundle size <200KB gzipped using Vite build analysis in `frontend/`
- [ ] T072 Create quickstart.md with development setup, test running, build instructions in `specs/002-frontend-chatbot-ui/quickstart.md`
- [ ] T073 Create research.md documenting technology decisions and rationale in `specs/002-frontend-chatbot-ui/research.md`
- [ ] T074 Create data-model.md documenting component state shapes and API contracts in `specs/002-frontend-chatbot-ui/data-model.md`
- [ ] T075 Create contracts/openapi.yaml documenting API contract with request/response examples in `specs/002-frontend-chatbot-ui/contracts/openapi.yaml`

**Checkpoint**: Polish complete - all tests passing, documentation done, build optimized

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - US1, US2, US3 are P1 (MVP - should complete first together)
  - US4, US5 are P2 (enhancements - complete after MVP)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1** (Chat Interface): After Foundational → independent, no other story dependencies
- **US2** (Backend Integration): After Foundational + ideally US1 (but can be parallel) → integrates with US1
- **US3** (Todo Management): After Foundational + US2 → extends US2 functionality
- **US4** (Loading/Error): After Foundational, can be parallel with US1-US3 → enhances all stories
- **US5** (History): After Foundational + ideally US1 (but can be parallel) → enhances US1

### Within Each User Story

1. Tests written first (ensure they FAIL before implementation)
2. Components created (markup/structure)
3. Component logic/integration added
4. Tests should PASS after implementation
5. Story complete before moving to next priority (for MVP discipline)

### Parallel Opportunities

**Within Phase 1 (Setup)**:
- All tasks marked [P] can run in parallel:
  - T002 (package.json) in parallel with T003 (vite config), T004 (jest), T005 (eslint), T006 (tailwind), T007 (.env.example)

**Phase 2 (Foundational)**:
- All tasks marked [P] can run in parallel:
  - T009 (ChatContext) parallel with T010 (api-client), T011 (health-check), T012 (error-handlers), T013 (message-formatter), T014 (tailwind styles)
  - T015 (App.jsx) and T016 (main.jsx) and T017 (env.js) can follow after T009-T014

**Within User Story 1**:
```
Tests (T018-T021): All marked [P] - run in parallel
Components (T022-T027): All marked [P] - run in parallel
  - T022: ChatInterface
  - T023: MessageList
  - T024: MessageInput
  - T025: UserMessage
  - T026: BotMessage
  - T027: WelcomeMessage
Integration (T028-T029): Sequential after components
```

**Within User Story 2**:
```
Tests (T030-T033): All marked [P] - run in parallel
Components (T034-T036): Parallel where possible
  - T034: sendMessage handler
  - T035-T036: API client implementation (parallel subtasks)
Integration (T037-T039): Sequential after components
```

**Across Multiple Stories (after Foundational)**:
- US1, US2, US3 can be worked on in parallel by different developers (since US2/US3 build on US1)
- US4, US5 can be worked on in parallel with US1-3 once foundational is done
- Ideal: Team A on US1, Team B on US2, Team C on US3 (all after Foundational)

---

## Implementation Strategy

### MVP First (Priority P1 Only - User Stories 1, 2, 3)

**Recommended sequence for solo developer**:

1. **Phase 1**: Setup (T001-T008) - ~1 hour
2. **Phase 2**: Foundational (T009-T017) - ~2 hours
3. **Phase 3**: User Story 1 (T018-T029) - ~2 hours
4. **Phase 4**: User Story 2 (T030-T039) - ~2 hours
5. **Phase 5**: User Story 3 (T040-T047) - ~1.5 hours
6. **VALIDATE**: Test MVP end-to-end (add, list, mark done, delete via chat)
7. **DEPLOY/DEMO**: Share working MVP

**MVP Feature Set**: Chat UI + Backend integration + Todo CRUD operations

### Incremental Delivery

For **team with multiple developers**:

1. **All hands**: Complete Phase 1 + 2 (Setup + Foundational) together
2. **Parallel streams** (once Phase 2 done):
   - **Stream A**: US1 + US2 (chat UI + backend integration)
   - **Stream B**: US3 (todo operations via chat)
   - **Stream C**: US4 (loading/error states)
3. Merge US1 + US2 + US3 → MVP feature set
4. Add US4 + US5 → Enhanced product
5. Phase 8 (Polish) → Production ready

### Test-Driven Approach (TDD)

For **each user story**:

1. ✅ Write all tests FIRST (make them FAIL)
2. Implement minimum code to make tests PASS
3. Refactor if needed (ensure tests still pass)
4. Commit working story
5. Move to next story

---

## Checkpoints & Validation

- **After Phase 1**: Verify project builds with `npm run build` (no errors)
- **After Phase 2**: Verify context renders, api-client callable, health-check works
- **After Phase 3**: App loads, chat UI displays, messages appear/scroll
- **After Phase 4**: Send message → receives response → bot response displays
- **After Phase 5**: All 4 todo operations (add/list/mark/delete) work via chat
- **After Phase 6**: Loading spinner and error messages display correctly
- **After Phase 7**: Messages persist during session, clear on refresh, auto-scroll works
- **After Phase 8**: All tests pass ≥80% coverage, build <200KB gzipped, Docker builds successfully

---

## Notes

- **[P] Parallelizable**: Different files, no inter-task dependencies within marked set
- **[Story] Label**: Maps task to US1-US5 for traceability and independent delivery
- **Each user story**: Can be implemented and tested independently
- **Test-first discipline**: Write tests BEFORE code, ensure they fail before implementation
- **Commit strategy**: Commit after each task or logical story phase
- **Validation**: Stop at any checkpoint to test story independently before moving on
- **Avoid**: Vague task descriptions, same-file conflicts preventing parallelization, hidden story dependencies
- **Bundle target**: <200KB gzipped (React 18 ~35KB + Tailwind ~15KB + components ~20KB + deps = achievable)
- **Test coverage**: ≥80% branch coverage (Jest configuration enforces via jest.config.js)

---

## Task Status Tracking

Use checkboxes above to track progress:

- `- [ ]` = Not started
- `- [x]` = Complete (update as you work)

---

**Ready for Implementation**: Run `/sp.implement` to generate all React components and service code from these tasks.

**Document Version**: 1.0
**Last Updated**: 2025-12-23
**Implementation Stage**: Phase II Frontend (Ready for Code Generation)
