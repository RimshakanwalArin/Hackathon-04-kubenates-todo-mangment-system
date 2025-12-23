# Quickstart Guide: Cloud Native Todo Backend

**Feature**: Cloud Native Todo Chatbot Backend Service
**Runtime**: Node.js 18+ with Express.js
**Date**: 2025-12-23

## Prerequisites

- Node.js 18 or higher (`node --version`)
- npm 8 or higher (`npm --version`)
- Docker (optional, for containerized deployment)
- Git (for version control)

## Local Development Setup

### 1. Clone & Install Dependencies

```bash
cd /path/to/project
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

**Default .env contents**:
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

Adjust as needed for local development:
- `PORT`: Server port (default 3000)
- `NODE_ENV`: "development" (includes stack traces) or "production" (sanitized)
- `LOG_LEVEL`: "debug", "info", "warn", "error" (default "info")

### 3. Start the Server

**Development mode** (with auto-restart on file changes):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

Server runs on `http://localhost:3000`

### 4. Verify Server is Running

```bash
curl http://localhost:3000/health
# Response: {"status":"UP"}

curl http://localhost:3000/ready
# Response: {"ready":true}
```

---

## API Usage Examples

### Create a Todo

```bash
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

# Response:
# {"id":"550e8400-e29b-41d4-a716-446655440000","title":"Buy milk","completed":false}
```

### List All Todos

```bash
curl http://localhost:3000/api/v1/todos

# Response:
# [
#   {"id":"550e8400-e29b-41d4-a716-446655440000","title":"Buy milk","completed":false},
#   {"id":"550e8400-e29b-41d4-a716-446655440001","title":"Walk dog","completed":true}
# ]
```

### Update Todo Status

```bash
curl -X PUT http://localhost:3000/api/v1/todos/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Response:
# {"id":"550e8400-e29b-41d4-a716-446655440000","title":"Buy milk","completed":true}
```

### Delete a Todo

```bash
curl -X DELETE http://localhost:3000/api/v1/todos/550e8400-e29b-41d4-a716-446655440000

# Response: (204 No Content)
```

### Chat Intent (Chatbot)

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"add todo buy milk"}'

# Response:
# {
#   "intent":"CREATE_TODO",
#   "status":"SUCCESS",
#   "result":{"id":"550e8400...","title":"buy milk","completed":false}
# }
```

---

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Suite

```bash
# Contract tests (API endpoints)
npm run test:contract

# Integration tests (multi-step workflows)
npm run test:integration

# Unit tests (components)
npm run test:unit
```

### Coverage Report

```bash
npm test -- --coverage
```

Expected: ≥80% coverage

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t todo-api:latest .
```

### Run Container Locally

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=development \
  -e LOG_LEVEL=info \
  todo-api:latest
```

### Docker Compose (Optional)

```bash
docker-compose up
```

---

## Kubernetes Deployment

### Health Probes Configuration

The service exposes two health endpoints for Kubernetes:

- **Liveness Probe**: `GET /health` (detects dead processes; restarts service)
- **Readiness Probe**: `GET /ready` (detects unready service; stops routing traffic)

### Kubernetes Manifest Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: todo-api
        image: todo-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 3
          periodSeconds: 5
```

### Deploy to Kubernetes

```bash
kubectl apply -f k8s/deployment.yaml
kubectl get pods  # Verify pods are running
kubectl port-forward svc/todo-api 3000:3000  # Local access
```

---

## Logging & Debugging

### View Logs (Local Development)

```bash
npm run dev 2>&1 | grep -i "error\|warn"
```

### View Logs (Docker Container)

```bash
docker logs <container-id>
docker logs -f <container-id>  # Follow logs
```

### Enable Debug Logging

Set `LOG_LEVEL=debug` in `.env`:

```bash
LOG_LEVEL=debug npm run dev
```

### Structured Logs Example

```json
{
  "timestamp": "2025-12-23T10:30:45Z",
  "level": "info",
  "requestId": "req-12345",
  "action": "createTodo",
  "message": "Todo created successfully",
  "duration_ms": 15
}
```

---

## Performance Testing

### Load Test with Apache Bench

```bash
# Install (macOS): brew install httpd
# Install (Ubuntu): sudo apt-get install apache2-utils

ab -n 1000 -c 100 http://localhost:3000/api/v1/todos
```

**Expected results**:
- Requests per second: >500
- p95 latency: <100ms
- Failed requests: 0

### Load Test with autocannon (Node.js)

```bash
npm install -g autocannon

autocannon -c 100 -d 60 http://localhost:3000/api/v1/todos
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=4000 npm run dev
```

### Module Not Found Errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing

```bash
# Check for syntax errors
npm run lint

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- create.test.js
```

### Container Won't Start

```bash
# Check build logs
docker build --no-cache -t todo-api:latest .

# Run with bash for debugging
docker run -it --rm todo-api:latest /bin/sh
```

---

## API Contract Compliance

The implementation MUST satisfy all contracts defined in `contracts/openapi.yaml`:

- **7 Endpoints**: 5 CRUD + chat + health checks
- **HTTP Status Codes**: 201 (create), 200 (list/update), 204 (delete), 400 (validation), 404 (not found), 500 (error)
- **Error Format**: `{"error": "message", "code": "ERROR_CODE"}`
- **Response Format**: JSON with correct Content-Type header
- **Performance**: <200ms p95 latency locally

Run contract tests to verify:

```bash
npm run test:contract
```

---

## Next Steps

1. **Generate Tasks** → Run `/sp.tasks` to break into granular work items
2. **Implement with TDD** → Claude Code generates tests first, then code
3. **Run All Tests** → Verify contract compliance and coverage >80%
4. **Build Docker Image** → Test containerization
5. **Deploy to Kubernetes** → Verify health probes work

---

## Support

- **API Documentation**: See `contracts/openapi.yaml` (OpenAPI 3.0 schema)
- **Data Model**: See `data-model.md` (entity schemas, validation rules)
- **Architecture**: See `plan.md` (design decisions, tech stack)
- **Specification**: See `spec.md` (user stories, functional requirements, success criteria)
