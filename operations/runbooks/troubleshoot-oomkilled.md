# Operational Runbook: OOMKilled Pod Failures

**Version**: 1.0.0
**Date**: 2025-12-24
**Scope**: Kubernetes pod killed due to Out-of-Memory (OOM)
**Target Resolution Time**: <15 minutes (MTTR)
**Approval Required**: Tier 3 (Medium-Risk) – Architect approval, 30-minute SLA

---

## Quick Diagnosis

**Symptom**: Pod exits with status `OOMKilled` or `137` exit code (128 + 9 SIGKILL)

**Root Causes** (in order of likelihood):
1. **Memory limit too low** – Pod uses more memory than allocated
2. **Memory leak** – Application not releasing memory over time
3. **Data caching** – Large data structures accumulated in memory
4. **High concurrency** – More requests than expected, each holding memory
5. **Inefficient query** – Database query returns huge result set

---

## Diagnostic Steps

### Step 1: Confirm OOMKilled Status (5 seconds)

```bash
kubectl describe pod <pod-name> -n <namespace>

# Look for "Last State" section:
# - State: Terminated
# - Reason: OOMKilled
# - Exit Code: 137
```

**Example Output**:
```
Last State:     Terminated
  Reason:       OOMKilled
  Exit Code:    137
  Started:      2025-12-24T14:30:00Z
  Finished:     2025-12-24T14:30:15Z
  Containers: 1
    Limits:    512Mi
    Requests:  128Mi
```

### Step 2: Check Memory Requests & Limits (10 seconds)

```bash
# View deployment memory configuration
kubectl get deployment <deployment-name> -n <namespace> -o yaml | grep -A 5 "memory:"

# View current memory usage (if metrics-server enabled)
kubectl top pod <pod-name> -n <namespace>

# Compare usage to limit
kubectl get pod <pod-name> -n <namespace> -o yaml | grep -B2 -A2 "memory:"
```

**Key Information to Collect**:
```
Request:  128Mi (minimum memory pod needs to start)
Limit:    512Mi (maximum memory pod can use)
Actual:   [from kubectl top] – usually close to or exceeding limit

If Actual > Limit → OOMKilled
```

### Step 3: Analyze Memory Usage Over Time (30 seconds)

```bash
# Option A: Watch current pod memory (live)
watch 'kubectl top pod <pod-name> -n <namespace>'

# Option B: Check historical metrics (if Prometheus enabled)
# Query: container_memory_usage_bytes{pod_name="<pod-name>"}

# Option C: Check logs for OOM messages
kubectl logs <pod-name> -n <namespace> --previous | grep -i "memory\|oom\|allocation"

# Option D: Check memory usage pattern in events
kubectl get events -n <namespace> --field-selector involvedObject.name=<pod-name> | grep -i "memory\|oom"
```

**Patterns to Look For**:
- Memory growing steadily over time (leak)
- Memory spike at specific time (batch operation)
- Memory immediately high after startup (large cache)
- Memory increase correlates with request volume

### Step 4: Check Application Behavior (30 seconds)

```bash
# View pod environment for memory-related config
kubectl exec <pod-name> -n <namespace> -- env | grep -i "memory\|cache\|buffer"

# Check Node memory availability
kubectl top nodes

# Check how much memory other pods are using
kubectl top pods -n <namespace> --sort-by=memory

# If Node is overcommitted, list all pod memory requests
kubectl describe node <node-name> | grep -A 20 "Allocated resources"
```

**Questions to Answer**:
- Is the Node running out of memory?
- Are other pods using excessive memory?
- How much headroom is available on the Node?

---

## Common Root Causes & Fixes

### Cause 1: Memory Limit Too Low for Actual Usage

**Indicators**:
- Pod OOMKilled shortly after starting
- Metrics show memory climbing toward limit
- Multiple rapid restarts with OOMKilled

**Investigation**:
```bash
# Run pod and monitor memory until it crashes
kubectl logs <pod-name> -n <namespace> --previous

# Check what the application does on startup:
# - Load large files into memory?
# - Build indexes or caches?
# - Create many objects?
```

**Fix** (Tier 3 – Architect Approval):
```bash
# Step 1: Determine appropriate memory limit
# Use: p95 memory usage + 30% safety margin
#
# If current p95 is 300Mi and limit is 512Mi:
#   p95 + 30% = 300 * 1.3 = 390Mi → round to 512Mi (OK)
#
# If current p95 is 450Mi and limit is 512Mi:
#   p95 + 30% = 450 * 1.3 = 585Mi → increase to 768Mi

# Step 2: Update deployment memory limit
kubectl set resources deployment/<name> \
  --limits=memory=768Mi \
  --requests=memory=256Mi \
  -n <namespace>

# Step 3: Verify rolling update completes
kubectl rollout status deployment/<name> -n <namespace>

# Step 4: Monitor new pod memory usage
kubectl top pod <pod-name> -n <namespace>
watch 'kubectl top pod <pod-name> -n <namespace>'

# Step 5: Confirm no OOMKilled in new pod
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.status.containerStatuses[0].lastState}'
```

**Expected Outcome**:
```
Memory usage stabilizes below new limit
No OOMKilled events in last hour
Pod ready state: True
```

### Cause 2: Memory Leak (Gradual Growth)

**Indicators**:
- Pod memory grows steadily over hours/days
- OOMKilled happens much later, not immediately
- Restart solves issue temporarily
- Metrics show sawtooth pattern (grow → OOMKilled → restart → grow again)

**Investigation**:
```bash
# Check if memory grows over time
kubectl logs <pod-name> -n <namespace> --tail=100 | grep -E "memory|allocation|gc"

# Look for patterns in timestamps
# Memory 100Mi at 00:00
# Memory 200Mi at 06:00
# Memory 300Mi at 12:00
# OOMKilled at 18:00

# Profile application (if supported)
kubectl exec <pod-name> -n <namespace> -- node --inspect-brk=0.0.0.0:9229 app.js
# Then use Chrome DevTools to profile memory
```

**Fix Options**:

**Option A: Increase Memory & Monitor**
```bash
# Increase limit significantly to buy time for fix
kubectl set resources deployment/<name> \
  --limits=memory=1024Mi \
  --requests=memory=512Mi \
  -n <namespace>

# Document in PHR that this is temporary workaround
# Create ticket for engineering team to fix memory leak
```

**Option B: Force Periodic Restart (Temporary)**
```bash
# Add sidecar to periodically restart application
kubectl patch deployment <name> --type json -p '[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/-",
    "value": {
      "name": "restart-watcher",
      "image": "busybox",
      "command": ["sh", "-c", "sleep 3600; kill -TERM 1"]
    }
  }
]'

# This restarts pod every 1 hour before OOM occurs
# Document this as temporary while memory leak is fixed
```

**Option C: Optimize Memory Usage (Best)**
```bash
# Engineering team should:
# 1. Enable garbage collection if applicable (Node.js: --expose-gc)
# 2. Limit cache size (e.g., max 100Mi for in-memory cache)
# 3. Use streaming instead of loading entire files
# 4. Implement cache eviction policy (LRU, TTL)
# 5. Monitor heap size growth

# Deploy fix:
kubectl set image deployment/<name> \
  backend=<image>:v1.0.1 \
  -n <namespace>

kubectl rollout status deployment/<name>
```

### Cause 3: High Concurrency (Concurrent Requests)

**Indicators**:
- Pod OOMKilled during traffic spikes
- Normal operation works fine with low traffic
- Memory usage correlates with request rate
- Multiple pods OOMKilled at same time (suggests cluster-wide load spike)

**Investigation**:
```bash
# Check request rate when OOMKilled
kubectl logs <pod-name> -n <namespace> --previous | grep -E "request|connection" | tail -20

# Check cluster load
kubectl top pods -A --sort-by=memory

# Check if horizontal pod autoscaler exists
kubectl get hpa -n <namespace>
```

**Fix**:

**Option A: Increase Memory Limit (Quick)**
```bash
# Increase to handle traffic spikes
kubectl set resources deployment/<name> \
  --limits=memory=1024Mi \
  --requests=memory=512Mi \
  -n <namespace>
```

**Option B: Enable Horizontal Pod Autoscaling (Best)**
```bash
# Create HPA to scale pods when memory threshold reached
kubectl autoscale deployment <name> \
  --min=2 --max=5 \
  --cpu-percent=70 \
  -n <namespace>

# Or use explicit memory target:
kubectl apply -f - << EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: <name>-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: <name>
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
EOF

# Verify HPA created
kubectl get hpa <name>-hpa -n <namespace>
```

**Option C: Optimize Request Handling (Best)**
```bash
# Engineering team should:
# 1. Reduce memory per request (streaming, pagination)
# 2. Add connection pooling limits
# 3. Implement request timeout
# 4. Use memory pools or object recycling

# Deploy optimized version:
kubectl set image deployment/<name> \
  backend=<image>:v1.1.0 \
  -n <namespace>
```

### Cause 4: Large Data Processing (Batch Operations)

**Indicators**:
- Pod OOMKilled during nightly batch job
- Memory OK during normal operation
- OOMKilled happens at predictable time
- Processing large file or dataset

**Investigation**:
```bash
# Check cron jobs or scheduled tasks
kubectl get cronjob -n <namespace>

# Check if batch job is running
kubectl get job -n <namespace>

# Find pod logs around failure time
kubectl logs <pod-name> -n <namespace> --previous | tail -50
```

**Fix**:

**Option A: Process Data in Chunks**
```bash
# Engineering team should:
# 1. Read file in chunks instead of loading entire file
# 2. Process batch in smaller batches
# 3. Write results incrementally
# 4. Use streaming algorithms when possible

# Example (Node.js):
const fs = require('fs');
const readline = require('readline');

// Bad: loads entire file into memory
const data = fs.readFileSync('huge-file.csv');

// Good: processes file line by line
const rl = readline.createInterface({
  input: fs.createReadStream('huge-file.csv')
});
rl.on('line', (line) => {
  // process line
});
```

**Option B: Schedule During Off-Peak Hours**
```bash
# Move batch job to time with more resources available
kubectl patch cronjob <name> -p '{"spec":{"schedule":"2 2 * * *"}}' -n <namespace>

# This schedules job for 2:02 AM instead of current time
```

**Option C: Increase Memory for Batch Jobs**
```bash
# Use different resource config for batch pod:
kubectl apply -f - << EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  template:
    spec:
      containers:
      - name: batch
        image: backend:latest
        resources:
          requests:
            memory: 1Gi
          limits:
            memory: 2Gi
      restartPolicy: Never
EOF
```

---

## Decision Tree

Use this flowchart to identify root cause:

```
Pod OOMKilled
    |
    +-- Does OOM happen immediately after start?
    |   |
    |   +-- YES → Memory limit too low for startup
    |   |   |
    |   |   +-- Action: Increase memory limit by 50-100%
    |   |   +-- Monitor: Ensure new limit is sufficient
    |   |
    |   +-- NO → OOM happens later
    |
    +-- Does memory grow steadily over time?
    |   |
    |   +-- YES → Memory leak
    |   |   |
    |   |   +-- Quick fix: Increase limit + force restarts
    |   |   +-- Long fix: Engineering team debug & fix leak
    |   |
    |   +-- NO → Continue diagnosis
    |
    +-- Does OOM correlate with request volume?
    |   |
    |   +-- YES → High concurrency
    |   |   |
    |   |   +-- Quick fix: Increase memory limit
    |   |   +-- Long fix: Scale horizontally with HPA
    |   |
    |   +-- NO → Likely batch operation
    |
    +-- Is this a scheduled batch job?
        |
        +-- YES → Process in chunks or increase job memory
        +-- NO → Escalate to engineering team
```

---

## Architect Approval Workflow

### Phase 1: Diagnosis (Automated)
Run kubectl-ai diagnosis:
```bash
./operations/workflows/kubectl-ai-diagnose-pod.sh <pod-name> <namespace>
```

Output identifies OOMKilled status and memory metrics.

### Phase 2: Approval (Manual) – Tier 3

This is a **Tier 3 (Medium-Risk)** operation requiring architect approval:

```bash
./operations/workflows/approve-pod-remediation.sh \
  history/prompts/004-phase-iv-aiops/[diagnosis-phr].md \
  approve \
  "Memory p95 usage is 300Mi, increasing limit to 512Mi (30% margin). Will monitor for 1 hour."
```

**SLA Window**: 30 minutes

### Phase 3: Execution
Execute approved memory increase:
```bash
kubectl set resources deployment/<name> \
  --limits=memory=512Mi \
  --requests=memory=256Mi \
  -n <namespace>

# Monitor rollout
kubectl rollout status deployment/<name> -n <namespace>

# Watch memory usage
kubectl top pod <pod-name> -n <namespace>
```

### Phase 4: Validation (1 Hour)
Monitor metrics:
```bash
# 5-minute check
kubectl get pod <pod-name> -n <namespace>

# 15-minute check
kubectl top pod <pod-name> -n <namespace>

# 1-hour check
kubectl logs <pod-name> -n <namespace> | tail -20
```

---

## Prevention & Best Practices

### 1. Right-Sizing Memory Requests/Limits

**Process**:
1. Deploy with conservative limits (512Mi default)
2. Monitor p50, p95, p99 memory usage for 7 days
3. Set limit = p95 usage + 30% safety margin
4. Set request = 50% of limit

**Example**:
```yaml
# Observed usage: p95 = 300Mi
# Calculation: 300Mi * 1.3 = 390Mi
# Round up: 512Mi

resources:
  requests:
    memory: 256Mi      # 50% of limit
  limits:
    memory: 512Mi      # p95 + 30%
```

### 2. Memory Leak Detection

**Add to application**:
```javascript
// Log memory usage every minute
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`Memory: RSS=${Math.round(used.rss/1024/1024)}MB, Heap=${Math.round(used.heapUsed/1024/1024)}MB`);
}, 60000);

// Alert if memory grows too fast
let lastMemory = 0;
setInterval(() => {
  const current = process.memoryUsage().heapUsed;
  if (lastMemory > 0 && current > lastMemory * 1.1) {
    console.warn('Memory growth spike detected!');
  }
  lastMemory = current;
}, 60000);
```

### 3. Horizontal Pod Autoscaling

**For high-concurrency workloads**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75     # Scale if >75% memory used
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

### 4. Quality Gates for Code Changes

**Before merging code**:
```bash
# Test with memory limit enforced
docker run --memory=512m <image> npm test

# Profile memory usage
docker run --memory=512m <image> node --expose-gc app.js
# (measure max heap used)

# Load test with expected concurrency
k6 run --vus 50 --duration 5m load-test.js
```

---

## Escalation Procedure

**If issue not resolved after 15 minutes**:

1. **Immediate Action**
   - Increase memory limit by 100% as temporary fix
   - Document in PHR: "Temporary increase pending engineering investigation"

2. **Escalate to Engineering Team**
   - Provide: pod name, OOMKilled logs, memory timeline
   - Include: kubectl-ai diagnosis output
   - Request: root cause analysis and fix

3. **Monitor Until Resolved**
   - Watch for recurrent OOMKilled events
   - Track memory usage trends
   - If pattern recurs, escalate again

4. **Post-Incident**
   - Document findings in runbook
   - Add monitoring for memory growth
   - Implement fix (code change, HPA, etc.)

---

## Related Documentation

- **Memory Best Practices**: https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/memory-constraints/
- **HPA Documentation**: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
- **Runbook Index**: `operations/runbooks/`
- **Approval Workflow**: `operations/workflows/approve-pod-remediation.sh`

---

**Runbook Version**: 1.0.0
**Last Updated**: 2025-12-24
**Maintained By**: Phase IV Operations
**Status**: ✅ Operational
