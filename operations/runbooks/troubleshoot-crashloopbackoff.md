# Operational Runbook: CrashLoopBackOff Pod Failures

**Version**: 1.0.0
**Date**: 2025-12-24
**Scope**: Kubernetes pod in CrashLoopBackOff state
**Target Resolution Time**: <15 minutes (MTTR)
**Approval Required**: Tier 2 (Low-Risk) – Architect review, 5-minute SLA

---

## Quick Diagnosis

**Symptom**: Pod repeatedly crashes and restarts (visible in `kubectl get pods` as `CrashLoopBackOff`)

**Root Causes** (in order of likelihood):
1. **Application crashes** – Code bug, unhandled exception, segmentation fault
2. **Missing configuration** – Environment variables, config files, secrets not mounted
3. **Resource constraints** – Memory limit too low, CPU throttled
4. **Dependency unavailable** – Database, cache, service not reachable
5. **Unhealthy startup** – Liveness/readiness probe failing immediately

---

## Diagnostic Steps

### Step 1: Check Pod Status (5 seconds)

```bash
kubectl get pod <pod-name> -n <namespace>

# Look for:
# - Restart count (should increase if in CrashLoopBackOff)
# - Last state reason (should show "Error" or "OOMKilled")
```

**Example Output**:
```
NAME              READY  STATUS            RESTARTS   AGE
backend-pod-123   0/1    CrashLoopBackOff  5          2m
                                          ^^^
                                    Pod has restarted 5 times
```

### Step 2: Review Pod Events (10 seconds)

```bash
kubectl describe pod <pod-name> -n <namespace>

# Key section: "Events"
# Look for patterns like:
# - "BackOff restarting failed container"
# - "Pod sandbox changed, it will be killed and recreated"
```

**Example Events**:
```
Events:
  Type     Reason             Age    From                    Message
  ----     ------             ----   ----                    -------
  Normal   Scheduled          2m     default-scheduler       Successfully assigned
  Normal   Pulled             2m     kubelet                 Container image already present
  Normal   Created            2m     kubelet                 Created container backend
  Normal   Started            2m     kubelet                 Started container backend
  Warning  BackOff            1m     kubelet                 Back-off restarting failed container
  Warning  BackOff            30s    kubelet                 Back-off restarting failed container
```

### Step 3: Check Application Logs (20 seconds)

```bash
# Get logs from current container attempt
kubectl logs <pod-name> -n <namespace>

# Get logs from previous container run (if crashed)
kubectl logs <pod-name> -n <namespace> --previous

# Get last 100 lines and follow
kubectl logs <pod-name> -n <namespace> -f --tail=100
```

**Red Flags in Logs**:
- `Cannot find module '[something]'` – Missing dependency
- `Error: connect ECONNREFUSED` – Cannot connect to service
- `Error: ENOENT: no such file or directory` – Missing config file
- `Segmentation fault` – Memory corruption or C extension crash
- `panic:` – Go application panic
- Any exception/error in first 10 lines

### Step 4: Check Resource Configuration (30 seconds)

```bash
# View deployment resource requests/limits
kubectl get deployment <deployment-name> -n <namespace> -o yaml | grep -A 10 "resources:"

# Check actual usage (if metrics-server enabled)
kubectl top pod <pod-name> -n <namespace>

# For memory issues, look for:
# - Current memory usage > memory limit
# - Memory usage increasing over time
```

**Example Resource Config**:
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Step 5: Check Environment & Dependencies (30 seconds)

```bash
# View pod environment variables
kubectl get pod <pod-name> -n <namespace> -o yaml | grep -A 20 "env:"

# Check if config maps are mounted
kubectl get pod <pod-name> -n <namespace> -o yaml | grep -A 5 "volumeMounts:"

# Test connectivity to dependent services
kubectl exec -it <pod-name> -n <namespace> -- /bin/bash
# Inside pod:
# - curl http://database-service:5432
# - curl http://cache-service:6379
# - env | grep DATABASE_URL
```

---

## Common Root Causes & Fixes

### Cause 1: Application Crashes on Startup

**Indicators**:
- Log shows immediate error (first 5 lines)
- Exit code 1 or higher
- Crash happens within 1-2 seconds of container start

**Fix Options** (in priority order):

**Option 1a: Code Bug** (Most likely)
```bash
# Action: Restart pod and monitor logs
kubectl delete pod <pod-name> -n <namespace>

# Then deploy fix:
# 1. Fix code in source
# 2. Build new image
# 3. Push to registry
# 4. Deploy: kubectl set image deployment/<name> backend=backend:v1.0.1 -n <namespace>

# Verification:
kubectl rollout status deployment/<name> -n <namespace>
kubectl logs <pod-name> -n <namespace> -f
```

**Option 1b: Missing Configuration**
```bash
# Action: Verify required environment variables
kubectl describe deployment <name> -n <namespace> | grep -A 20 "Env:"

# Check if all required env vars are present:
# - DATABASE_URL
# - API_KEY
# - NODE_ENV
# - Any custom config

# If missing, update deployment:
kubectl set env deployment/<name> DATABASE_URL=postgres://... -n <namespace>

# Verification:
kubectl rollout status deployment/<name>
kubectl logs <pod-name> -n <namespace>
```

**Option 1c: Missing Config Files/Mounts**
```bash
# Check ConfigMap exists
kubectl get configmap <config-name> -n <namespace>

# If not, create it:
kubectl create configmap <config-name> --from-file=config/ -n <namespace>

# Update deployment to mount it:
kubectl patch deployment <name> --type json -p '[
  {"op": "add", "path": "/spec/template/spec/volumes/-", "value": {"name": "config", "configMap": {"name": "config-name"}}}
]' -n <namespace>

# Verification:
kubectl rollout status deployment/<name>
kubectl exec <pod-name> -n <namespace> -- ls /etc/config/
```

### Cause 2: Resource Limits Too Low

**Indicators**:
- Memory usage close to limit when crash occurs
- Logs show OOM-related errors
- Crash happens after running for seconds (not immediately)
- CPU throttling visible in metrics

**Fix**:
```bash
# Step 1: Check current usage
kubectl top pod <pod-name> -n <namespace>

# Step 2: Increase limits (30% safety margin above p95 usage)
kubectl set resources deployment/<name> \
  --limits=cpu=500m,memory=512Mi \
  --requests=cpu=100m,memory=128Mi \
  -n <namespace>

# Step 3: Verify update and pod restart
kubectl rollout status deployment/<name> -n <namespace>
kubectl get pod <pod-name> -n <namespace>

# Step 4: Monitor resource usage
kubectl top pod <pod-name> -n <namespace>
```

### Cause 3: Dependency Not Ready

**Indicators**:
- Logs show connection refused: `ECONNREFUSED`
- Database URL or service endpoint in logs
- Crash happens after connection attempt

**Fix**:
```bash
# Step 1: Check if dependency is running
kubectl get pod -l app=database -n <namespace>
kubectl get svc <service-name> -n <namespace>

# Step 2: Test connectivity
kubectl exec <pod-name> -n <namespace> -- nc -zv <service-name> <port>

# Step 3: If dependency not ready, wait:
kubectl wait --for=condition=Ready pod -l app=database -n <namespace> --timeout=300s

# Step 4: Restart application pod
kubectl delete pod <pod-name> -n <namespace>

# Step 5: Verify application connects
kubectl logs <pod-name> -n <namespace> -f --tail=50
```

### Cause 4: Unhealthy Startup (Liveness/Readiness Probe)

**Indicators**:
- Pod status shows `CrashLoopBackOff`
- Logs show application is running fine
- Events show "Liveness probe failed"

**Fix**:
```bash
# Check probe configuration
kubectl get deployment <name> -n <namespace> -o yaml | grep -A 10 "livenessProbe:"

# Option A: Increase initial delay if startup is slow
kubectl patch deployment <name> --type merge -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","livenessProbe":{"initialDelaySeconds":30}}]}}}}' -n <namespace>

# Option B: Check probe endpoint is healthy
kubectl exec <pod-name> -n <namespace> -- curl -s http://localhost:3000/health

# Option C: Disable probe temporarily for debugging
kubectl patch deployment <name> --type json -p '[{"op":"remove","path":"/spec/template/spec/containers/0/livenessProbe"}]' -n <namespace>

# Verification:
kubectl rollout status deployment/<name>
```

---

## Decision Tree

Use this flowchart to identify root cause quickly:

```
CrashLoopBackOff pod
    |
    +-- Does log show immediate error? (within 5 lines)
    |   |
    |   +-- YES → Application crash
    |   |   |
    |   |   +-- "Cannot find module" → Add dependency
    |   |   +-- "ECONNREFUSED" → Wait for dependency
    |   |   +-- Other error → Fix code bug
    |   |
    |   +-- NO → Check resource usage
    |
    +-- Memory usage close to limit?
    |   |
    |   +-- YES → Increase memory limit
    |   +-- NO → Continue diagnosis
    |
    +-- Does log show "probe failed"?
    |   |
    |   +-- YES → Fix liveness probe configuration
    |   +-- NO → Check dependencies
    |
    +-- Can pod reach required services?
        |
        +-- NO → Wait for services, update networking
        +-- YES → Escalate to engineering team
```

---

## Architect Approval Workflow

### Phase 1: Diagnosis (Automated)
Run kubectl-ai diagnosis:
```bash
./operations/workflows/kubectl-ai-diagnose-pod.sh <pod-name> <namespace>
```

Output includes root cause analysis and recommended action.

### Phase 2: Approval (Manual)
Architect reviews diagnosis and approves:
```bash
./operations/workflows/approve-pod-remediation.sh \
  history/prompts/004-phase-iv-aiops/[diagnosis-phr].md \
  approve \
  "Logs indicate [root cause]. Recommending [action]."
```

### Phase 3: Execution (Automated or Manual)
Execute approved action based on diagnosis:
- **Simple restart**: `kubectl delete pod <pod-name> -n <namespace>`
- **Config fix**: `kubectl patch configmap <name> -p '{...}'`
- **Resource update**: `kubectl set resources deployment/<name> --limits=...`
- **Deployment fix**: `kubectl set image deployment/<name> backend=image:tag`

### Phase 4: Validation (Automated)
Monitor post-action metrics:
```bash
# Watch pod restart
kubectl get pod <pod-name> -n <namespace> -w

# Tail logs for 5 minutes
kubectl logs <pod-name> -n <namespace> -f --tail=50

# Check restart count stabilizes at 0
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.status.containerStatuses[0].restartCount}'
```

---

## Prevention & Best Practices

### 1. Pre-Deployment Validation

**Before deploying to production**:
```bash
# Test locally
docker run -it <image-name> npm start

# Verify startup time
time docker run --rm <image-name> npm start

# Check resource usage
docker run --memory=512m -it <image-name> npm start
```

### 2. Startup Health Checks

**In Kubernetes deployment YAML**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30      # Wait for app to start
  periodSeconds: 10             # Check every 10 seconds
  timeoutSeconds: 5             # Give app 5 seconds to respond
  failureThreshold: 3           # Fail after 3 consecutive failures

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 3. Dependency Initialization

**Ensure dependencies start before application**:
```yaml
initContainers:
- name: wait-for-db
  image: busybox
  command: ['sh', '-c', 'until nc -z postgres-service 5432; do sleep 1; done']
```

### 4. Graceful Shutdown

**In application code**:
```javascript
// Handle SIGTERM signal (pod termination)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});
```

### 5. Monitoring & Alerting

**Kubernetes alerts for CrashLoopBackOff**:
```yaml
# Alert when pod restarts >3 times in 5 minutes
alert: PodCrashLooping
  expr: rate(kube_pod_container_status_restarts_total[5m]) > 0.6
```

---

## Escalation Procedure

**If issue not resolved after 15 minutes**:

1. **Escalate to Engineering Team**
   - Create ticket with: pod name, namespace, full logs, errors
   - Include kubectl-ai diagnosis output
   - Assign to backend team for code review

2. **Immediate Actions**
   - Scale pod to 0 replicas to stop restart loop: `kubectl scale deployment <name> --replicas=0 -n <namespace>`
   - This prevents noisy logs and failed connection attempts
   - Resume when fix is ready: `kubectl scale deployment <name> --replicas=1 -n <namespace>`

3. **Post-Incident**
   - Document root cause in runbook
   - Add monitoring alert for early detection
   - Schedule code review to prevent recurrence

---

## Related Documentation

- **PHR Template**: `operations/workflows/phr-pod-failure.md`
- **Diagnosis Script**: `operations/workflows/kubectl-ai-diagnose-pod.sh`
- **Approval Workflow**: `operations/workflows/approve-pod-remediation.sh`
- **Kubernetes Documentation**: https://kubernetes.io/docs/tasks/debug-application-cluster/

---

**Runbook Version**: 1.0.0
**Last Updated**: 2025-12-24
**Maintained By**: Phase IV Operations
**Status**: ✅ Operational
