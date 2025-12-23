# Phase III Tasks: Cloud Native Containerization & Kubernetes Deployment

**Feature:** Cloud Native Todo Chatbot – Phase III: Containerization & Local Kubernetes Deployment
**Status:** Task Breakdown
**Created:** 2025-12-23
**Total Tasks:** 34

---

## Task Summary

| Phase | Description | Task Count | Status |
|-------|-------------|-----------|--------|
| **Phase 1** | Setup & Infrastructure | 3 | Pending |
| **Phase 2** | Foundational (Blocking) | 5 | Pending |
| **Phase 3** | User Story 1: Backend Containerization | 8 | Pending |
| **Phase 4** | User Story 2: Frontend Containerization | 7 | Pending |
| **Phase 5** | User Story 3: Kubernetes Deployment | 7 | Pending |
| **Phase 6** | User Story 4: Helm Packaging | 6 | Pending |
| **Phase 7** | Polish & Cross-Cutting | 5 | Pending |
| **Total** | | **34 Tasks** | |

---

## Execution Model

### Parallel Opportunities

- **Phase 3 & 4 can run in parallel:** Backend and frontend containerization are independent (different Dockerfiles, different images)
- **Within Phase 3:** Multiple tasks can run in parallel (T007 [P], T008 [P], T009 [P])
- **Within Phase 4:** Multiple tasks can run in parallel (T016 [P], T017 [P], T018 [P])
- **Phase 5 & 6 are sequential:** Kubernetes deployment depends on images; Helm depends on manifests

### Recommended MVP Scope (Phase III.1)

Start with **Phase 1–3** to achieve MVP:
- ✅ Docker image for backend created and scanned
- ✅ Backend image deployed to Minikube
- ✅ Health endpoints verified
- **Estimated Time:** 4–6 hours

**Full Phase III:** All 7 phases complete with frontend, Helm, health checks
- **Estimated Time:** 10–12 hours

---

## Phase 1: Setup & Infrastructure Initialization

**Goal:** Prepare local Kubernetes environment and initialize infrastructure directories

**Independent Test Criteria:**
- ✅ Minikube cluster running with `kubectl get nodes` returning 1+ Ready nodes
- ✅ kubectl and helm CLIs functional and pointing to Minikube cluster
- ✅ docker ai command available and initialized
- ✅ Directory structure created: helm/, contracts/, build/

**Tasks:**

- [ ] T001 Initialize Minikube cluster with 3 nodes using `minikube start --nodes=3 --driver=docker`
- [ ] T002 [P] Verify Minikube cluster and run `kubectl get nodes` command; document node status in docs/setup.md
- [ ] T003 [P] Enable metrics-server addon with `minikube addons enable metrics-server` for resource monitoring

---

## Phase 2: Foundational Infrastructure (Blocking Prerequisites)

**Goal:** Establish shared infrastructure and cross-cutting configuration that all containerization tasks depend on

**Independent Test Criteria:**
- ✅ docker ai agent initialized and responding to commands
- ✅ kubectl-ai agent initialized and responding to commands
- ✅ Project directory structure established with helm/, contracts/, build/ directories
- ✅ docker buildx configured for multi-platform builds

**Tasks:**

- [ ] T004 Verify docker ai (Gordon) agent is installed and responsive; run `docker ai --version` and document in docs/ai-tools.md
- [ ] T005 Verify kubectl-ai agent is installed and responsive; run `kubectl-ai --version` and document in docs/ai-tools.md
- [ ] T006 [P] Create project directory structure: mkdir -p helm/backend-chart helm/frontend-chart contracts/ build/ docker/ scripts/
- [ ] T007 [P] Create docker buildx builder for multi-platform builds using `docker buildx create --name todobuilder --use`
- [ ] T008 Initialize PHR documentation template in docs/operations-log.md for recording all infrastructure operations

---

## Phase 3: User Story 1 – Backend Containerization

**Goal:** Package Node.js/Express backend as optimized Docker image with health checks

**Story Label:** [US1]
**Dependencies:** Phase 2 complete
**Parallel Opportunities:** T012, T013, T014 can run in parallel

**Independent Test Criteria:**
- ✅ Backend Dockerfile generated and optimized by docker ai
- ✅ Backend image built successfully as backend:v1.0.0 <200MB
- ✅ docker ai scan reports 0 critical vulnerabilities
- ✅ Container starts without errors: `docker run backend:v1.0.0`
- ✅ Health endpoint responds: `curl http://localhost:3000/health` → {status: UP}
- ✅ Readiness endpoint responds: `curl http://localhost:3000/ready` → {status: ready}

**Tasks:**

- [ ] T009 [US1] Use docker ai to generate optimized multi-stage Dockerfile for backend; save to docker/Dockerfile.backend with node:alpine base image
- [ ] T010 [US1] Review generated Dockerfile.backend for best practices (build deps in stage 1, runtime in stage 2); document review in docker/DOCKERFILE_REVIEW.md
- [ ] T011 [US1] Build backend image locally: `docker build -t backend:v1.0.0 -f docker/Dockerfile.backend .` from project root
- [ ] T012 [P] [US1] Run docker ai scan on backend:v1.0.0 image: `docker ai scan backend:v1.0.0`; document results in build/backend-scan-report.txt
- [ ] T013 [P] [US1] Verify backend image size: `docker image ls backend:v1.0.0` should show <200MB; document in build/backend-image-report.txt
- [ ] T014 [P] [US1] Test backend container startup: `docker run --rm -p 3000:3000 backend:v1.0.0` and verify no errors in logs; document in build/backend-startup-test.log
- [ ] T015 [US1] Verify /health endpoint responds: Run container and `curl http://localhost:3000/health` (max 100ms latency); document in build/backend-health-test.log
- [ ] T016 [US1] Tag backend image with latest: `docker tag backend:v1.0.0 backend:latest`; document tagging in build/backend-tags.txt

---

## Phase 4: User Story 2 – Frontend Containerization

**Goal:** Package React/Vite frontend build as optimized Nginx Docker image with static file serving

**Story Label:** [US2]
**Dependencies:** Phase 2 complete (independent of Phase 3)
**Parallel Opportunities:** T024, T025, T026 can run in parallel

**Independent Test Criteria:**
- ✅ Frontend Dockerfile generated and optimized by docker ai
- ✅ Frontend image built successfully as frontend:v1.0.0 <100MB
- ✅ docker ai scan reports 0 critical vulnerabilities
- ✅ Container starts without errors: `docker run frontend:v1.0.0`
- ✅ Nginx serves index.html: `curl http://localhost:80/` returns HTML content
- ✅ Static assets (CSS, JS) served correctly with <100ms latency

**Tasks:**

- [ ] T017 [US2] Use docker ai to generate optimized multi-stage Dockerfile for frontend; save to docker/Dockerfile.frontend with node:alpine (build stage) and nginx:alpine (runtime stage)
- [ ] T018 [US2] Review generated Dockerfile.frontend: verify Vite build in stage 1, nginx config in stage 2, no build artifacts in final image; document in docker/DOCKERFILE_REVIEW.md
- [ ] T019 [US2] Generate nginx.conf template for serving React SPA; configure to serve index.html on 404 for client-side routing; save to docker/nginx.conf
- [ ] T020 [US2] Build frontend image locally: `docker build -t frontend:v1.0.0 -f docker/Dockerfile.frontend .` from project root
- [ ] T021 [P] [US2] Run docker ai scan on frontend:v1.0.0 image: `docker ai scan frontend:v1.0.0`; document results in build/frontend-scan-report.txt
- [ ] T022 [P] [US2] Verify frontend image size: `docker image ls frontend:v1.0.0` should show <100MB; document in build/frontend-image-report.txt
- [ ] T023 [P] [US2] Test frontend container startup: `docker run --rm -p 80:80 frontend:v1.0.0` and verify nginx starts without errors; document in build/frontend-startup-test.log

---

## Phase 5: User Story 3 – Kubernetes Deployment

**Goal:** Deploy backend and frontend services to Minikube with health probes and proper networking

**Story Label:** [US3]
**Dependencies:** Phase 2 complete, Phase 3 complete (backend image), Phase 4 complete (frontend image)
**Parallel Opportunities:** None (requires both images ready first)

**Independent Test Criteria:**
- ✅ Backend Deployment created with 1 replica, health probes (liveness 10s, readiness 5s)
- ✅ Frontend Deployment created with 1 replica, health probes
- ✅ Backend Service (ClusterIP) created on port 3000
- ✅ Frontend Service (NodePort) created on port 30001
- ✅ All pods reach Running/Ready state within 30 seconds
- ✅ Services are discoverable and load-balanced
- ✅ Health endpoints respond correctly

**Tasks:**

- [ ] T024 [US3] Use kubectl-ai to generate backend Deployment manifest; specify 1 replica, image: backend:v1.0.0, containerPort: 3000, env vars (NODE_ENV=production, LOG_LEVEL=info); save to contracts/backend-deployment.yaml
- [ ] T025 [US3] Use kubectl-ai to generate backend Service manifest (ClusterIP); expose port 3000, selector app=todo-chatbot-backend; save to contracts/backend-service.yaml
- [ ] T026 [US3] Configure liveness probe in backend Deployment: HTTP GET /health, initialDelaySeconds=0, periodSeconds=10, timeoutSeconds=2, failureThreshold=3
- [ ] T027 [US3] Configure readiness probe in backend Deployment: HTTP GET /ready, initialDelaySeconds=0, periodSeconds=5, timeoutSeconds=1, failureThreshold=2
- [ ] T028 [US3] Use kubectl-ai to generate frontend Deployment manifest; specify 1 replica, image: frontend:v1.0.0, containerPort: 80, env vars (REACT_APP_API_BASE_URL=http://backend:3000); save to contracts/frontend-deployment.yaml
- [ ] T029 [US3] Use kubectl-ai to generate frontend Service manifest (NodePort); expose port 30001:80, selector app=todo-chatbot-frontend; save to contracts/frontend-service.yaml
- [ ] T030 [US3] Deploy manifests to Minikube: `kubectl apply -f contracts/` and wait for pods Ready: `kubectl wait pod -l app=todo-chatbot-backend --for=condition=Ready --timeout=30s`

---

## Phase 6: User Story 4 – Helm Packaging

**Goal:** Package Kubernetes manifests as Helm charts for versioning, templating, and release management

**Story Label:** [US4]
**Dependencies:** Phase 5 complete (manifests from contracts/)
**Parallel Opportunities:** T032 and T033 can run in parallel (separate charts)

**Independent Test Criteria:**
- ✅ Helm charts pass `helm lint` without errors
- ✅ `helm template` produces valid Kubernetes YAML
- ✅ `helm install` deploys services successfully
- ✅ `helm upgrade` performs rolling update without downtime
- ✅ `helm rollback` reverts to previous release
- ✅ values.yaml contains all configurable parameters

**Tasks:**

- [ ] T031 [US4] Use kubectl-ai to generate backend Helm chart structure: Chart.yaml (name: chart-backend, version: 1.0.0, appVersion: 1.0.0), values.yaml (replicaCount: 1, image.tag: v1.0.0, resources: {requests: {memory: 256Mi, cpu: 250m}, limits: {memory: 512Mi, cpu: 500m}}); save to helm/backend-chart/
- [ ] T032 [P] [US4] Create backend chart templates: templates/deployment.yaml, templates/service.yaml, templates/configmap.yaml; use Helm variables for replicas, image tag, environment variables
- [ ] T033 [P] [US4] Create frontend chart structure and templates: Chart.yaml (name: chart-frontend, version: 1.0.0), values.yaml (replicaCount: 1, image.tag: v1.0.0, resources: {requests: {memory: 128Mi, cpu: 100m}, limits: {memory: 256Mi, cpu: 200m}}), templates/ (deployment, service, configmap)
- [ ] T034 [US4] Validate helm charts: `helm lint helm/backend-chart/` and `helm lint helm/frontend-chart/`; ensure no errors; document results in build/helm-lint-report.txt
- [ ] T035 [US4] Test helm install for backend: `helm install todo-chatbot-backend helm/backend-chart/ --values helm/backend-chart/values.yaml` and verify deployment; document in build/helm-backend-install.log
- [ ] T036 [US4] Test helm install for frontend: `helm install todo-chatbot-frontend helm/frontend-chart/` and verify deployment; test `helm upgrade` and `helm rollback` commands

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal:** Document operations, validate end-to-end flow, and prepare runbooks for Phase IV

**Dependencies:** Phase 6 complete
**Parallel Opportunities:** T038 and T039 can run in parallel

**Independent Test Criteria:**
- ✅ Frontend accessible in browser at http://localhost:30001 (or via minikube tunnel)
- ✅ Chat interface functional (user input reaches backend, bot responds)
- ✅ Pod restart count = 0 after 1 hour stable operation
- ✅ Health probes passing (all pods Ready)
- ✅ Operations documented in PHR for audit trail
- ✅ Quickstart and runbooks available for Phase IV teams

**Tasks:**

- [ ] T037 Access frontend via Minikube: Run `minikube tunnel` in separate terminal and open http://localhost:30001 in browser; verify page loads without 404 or CORS errors; document in docs/frontend-access-validation.md
- [ ] T038 [P] Test end-to-end chat flow: Submit message in frontend, verify backend API receives request, bot responds, response displayed in chat; measure latency (<1 second target); document in docs/e2e-test-report.md
- [ ] T039 [P] Monitor pod stability: Run `watch kubectl get pods` and `kubectl top pods` for 1 hour; verify no pod restarts (restartCount = 0); document resource usage in docs/pod-stability-report.md
- [ ] T040 Document operations: Create PHR entries for all docker ai builds, image scans, kubernetes deployments, and helm operations; ensure audit trail complete in history/prompts/003-phase-iii-containerization/
- [ ] T041 Create quickstart guide: Write docs/QUICKSTART.md with step-by-step reproduction (minikube start → docker build → helm install → access UI); include troubleshooting section

---

## Task Dependencies & Ordering

### Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ├────────────────┬────────────────┐
    ↓                ↓                ↓
Phase 3 (US1)   Phase 4 (US2)   (Independent)
    ↓                ↓
    └────────────────┬────────────────┘
           ↓
        Phase 5 (US3 - Kubernetes Deployment)
           ↓
        Phase 6 (US4 - Helm Packaging)
           ↓
        Phase 7 (Polish & E2E Validation)
```

### Parallel Execution Examples

**Example 1: Backend & Frontend Together**
```bash
# Terminal 1: Phase 3 (Backend)
T009 → T010 → T011 → [T012, T013, T014 in parallel] → T015 → T016

# Terminal 2: Phase 4 (Frontend) [simultaneous with Terminal 1]
T017 → T018 → T019 → T020 → [T021, T022, T023 in parallel]

# After both complete: Terminal 3: Phase 5 (Kubernetes)
T024 → T025 → T026 → T027 → T028 → T029 → T030
```

**Example 2: Image Scan & Size Check in Parallel**
```bash
# T012 (docker ai scan) runs simultaneously with T013 (image size check)
# Both report to T015 (health validation)
```

**Example 3: Helm Chart Generation in Parallel**
```bash
# T032 (backend chart templates) and T033 (frontend chart templates) in parallel
# Both depend on T031 (chart structure generation)
```

---

## Success Criteria Checklist

### Phase 1–2 (Setup & Foundational)
- [ ] Minikube cluster running with 3 nodes
- [ ] kubectl and helm CLIs functional
- [ ] docker ai and kubectl-ai initialized
- [ ] Directory structure created

### Phase 3 (Backend Containerization)
- [ ] Backend Dockerfile generated by docker ai
- [ ] Backend image built and tagged (v1.0.0, <200MB)
- [ ] docker ai scan: 0 critical vulnerabilities
- [ ] Container starts without errors
- [ ] Health endpoints respond (<100ms latency)

### Phase 4 (Frontend Containerization)
- [ ] Frontend Dockerfile generated by docker ai
- [ ] Frontend image built and tagged (v1.0.0, <100MB)
- [ ] docker ai scan: 0 critical vulnerabilities
- [ ] Nginx serves static assets
- [ ] SPA routing works (404 redirects to index.html)

### Phase 5 (Kubernetes Deployment)
- [ ] Backend Deployment created with health probes
- [ ] Frontend Deployment created with health probes
- [ ] Services (ClusterIP backend, NodePort frontend) created
- [ ] All pods reach Running/Ready within 30 seconds
- [ ] Services discoverable and load-balanced

### Phase 6 (Helm Packaging)
- [ ] Helm charts pass lint validation
- [ ] helm template produces valid YAML
- [ ] helm install succeeds for both services
- [ ] helm upgrade performs rolling update
- [ ] helm rollback reverts to previous release

### Phase 7 (Polish & E2E)
- [ ] Frontend accessible in browser
- [ ] End-to-end chat flow works
- [ ] Pod restart count = 0 after stable run
- [ ] All operations documented in PHRs
- [ ] Quickstart and runbooks complete

---

## Implementation Strategy

### Approach: MVP First, Incremental Delivery

**Phase III.1 (MVP - 4–6 hours):**
- Phase 1: Minikube setup ✅
- Phase 2: Foundational infrastructure ✅
- Phase 3: Backend containerization ✅
- **Deliverable:** Backend image running in Minikube with health checks

**Phase III.2 (Increment 2 - 2–3 hours):**
- Phase 4: Frontend containerization ✅
- **Deliverable:** Frontend image running in Minikube

**Phase III.3 (Increment 3 - 1–2 hours):**
- Phase 5: Kubernetes deployment ✅
- Phase 6: Helm packaging ✅
- **Deliverable:** Full application running via Helm charts

**Phase III.4 (Final - 1–2 hours):**
- Phase 7: Polish, E2E validation, documentation ✅
- **Deliverable:** Complete Phase III with runbooks for Phase IV

**Total Estimated Time:** 10–12 hours (can be parallelized to 6–8 hours with concurrent work)

---

## Task Format Validation

**Format Check:** All tasks follow strict checklist format:
- ✅ Checkbox: `- [ ]`
- ✅ Task ID: T001–T041 (sequential)
- ✅ [P] marker: Included for parallelizable tasks only
- ✅ [Story] label: [US1], [US2], [US3], [US4] for story tasks; none for setup/polish
- ✅ File paths: Every task includes exact file path or command

**Example Validations:**
- ✅ `- [ ] T009 [US1] Use docker ai to generate optimized multi-stage Dockerfile for backend; save to docker/Dockerfile.backend`
- ✅ `- [ ] T012 [P] [US1] Run docker ai scan on backend:v1.0.0 image`
- ✅ `- [ ] T031 [US4] Use kubectl-ai to generate backend Helm chart structure`

---

## Next Steps

1. ✅ Specification complete (`specs/003-phase-iii-containerization/spec.md`)
2. ✅ Plan complete (`specs/003-phase-iii-containerization/plan.md`)
3. ✅ Tasks complete (this file)
4. ⏳ **NEXT:** Execute Phase III implementation via `/sp.implement`
   - AI generates Dockerfiles
   - AI generates Kubernetes manifests
   - AI generates Helm charts
   - Deploy to Minikube
   - Validate end-to-end

---

## Related Documents

- **Specification:** `specs/003-phase-iii-containerization/spec.md`
- **Plan:** `specs/003-phase-iii-containerization/plan.md`
- **Constitution:** `.specify/memory/constitution.md` (v1.2.0 Phase III governance)
- **PHR Directory:** `history/prompts/003-phase-iii-containerization/`

---

**Status:** ✅ READY FOR IMPLEMENTATION

**Total Task Count:** 41 tasks across 7 phases
**Parallel Opportunities:** 8+ tasks can run in parallel
**Recommended Start:** Phase 1, then parallelize Phases 3 & 4
**Estimated Completion:** 6–12 hours (depending on parallelization)

