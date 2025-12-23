# Operational Runbook: Proactive Scaling Decision & HPA Configuration

**Version**: 1.0.0
**Date**: 2025-12-24
**Scope**: Kubernetes deployment scaling with Horizontal Pod Autoscaler (HPA)
**Target Resolution Time**: <30 minutes (SLA for Tier 3)
**Approval Required**: Tier 3 (Medium-Risk) – Architect approval, 30-minute SLA

---

## Quick Decision Tree

```
Sustained high utilization (70%+ CPU for 5+ min)?
    │
    ├─ YES → Scale immediately
    │   ├─ Generate kagent recommendation
    │   ├─ Validate with kubectl-ai
    │   ├─ Architect approves HPA policy
    │   └─ Apply HPA
    │
    └─ NO → Current capacity adequate
        └─ Still configure HPA for future load spikes
```

---

## When to Scale

**Immediate Scaling Needed** ⚠️:
- CPU utilization >75% sustained for 5+ minutes
- Memory utilization >80% sustained for 5+ minutes
- Pod consistently getting throttled or evicted
- Error rate increasing due to resource constraints
- Latency spiking due to slow response times

**Preventive Scaling** (Recommended):
- CPU utilization 60-75% – configure HPA even if not urgent
- Traffic patterns show spikes (time-of-day, day-of-week)
- Batch jobs or periodic high-load operations
- New feature rollout expected to increase load

---

## Scaling Workflow Overview

### Phase 1: Detect High Utilization
Monitor cluster metrics for sustained high utilization. Trigger scaling decision when thresholds exceeded.

### Phase 2: Analyze & Recommend
Run `kagent-recommend-scaling.sh` to analyze metrics and recommend HPA policy based on:
- Current pod count
- Current utilization (p50, p95)
- Required capacity for target utilization
- Cost impact of scaling

### Phase 3: Validate Capacity
Run `kubectl-ai-validate-scaling.sh` to verify:
- Cluster has CPU and memory capacity
- No scheduler constraints (taints, affinities) block scaling
- Scaling won't exceed node capacity

### Phase 4: Architect Approval
Architect reviews recommendation and validates:
- HPA policy matches workload characteristics
- Cluster capacity sufficient
- Cost impact acceptable
- No other constraints (network, storage, external services)

### Phase 5: Apply HPA
Run `approve-hpa-policy.sh --apply` to:
- Create HPA manifest
- Apply HPA to cluster
- Verify HPA is active and monitoring

### Phase 6: Monitor & Validate
Watch scaling behavior for 1 hour:
- Pods scale up when load increases
- CPU utilization stabilizes around target (70%)
- Error rate remains low (<1%)
- Latency returns to acceptable levels

---

## Step-by-Step Procedures

### Procedure 1: Detect Need for Scaling

**When to Check**:
- Daily during peak hours
- Before known traffic spikes
- After application deployments
- When on-call engineer reports degradation

**How to Check**:
```bash
# Check CPU utilization
kubectl top pods -n <namespace> --sort-by=cpu

# Check for throttling
kubectl describe nodes | grep -A 10 "Allocated resources"

# Check for evicted pods
kubectl get pods -n <namespace> | grep -E "Evicted|OOMKilled|CrashLoopBackOff"

# Check error rates
kubectl logs <pod> -n <namespace> | grep -i "error\|exception" | tail -10
```

**Decision Threshold**:
- If CPU >75% for 5+ minutes → Immediate scaling
- If CPU 60-75% consistently → Preventive scaling
- If expected load increase → Preventive scaling

### Procedure 2: Generate Scaling Recommendation

**Command**:
```bash
./operations/workflows/kagent-recommend-scaling.sh <deployment> <namespace>
```

**Example**:
```bash
./operations/workflows/kagent-recommend-scaling.sh backend production

# Output includes:
# - Current metrics analysis (CPU, memory, pod count)
# - Recommended HPA policy (min, max replicas, target CPU)
# - Cost impact estimation
# - HPA YAML configuration
```

**Recommendation Review Checklist**:
- [ ] Current utilization above 70% (justifies scaling)
- [ ] Recommended min replicas = current replicas (maintains baseline)
- [ ] Recommended max replicas reasonable (not too high)
- [ ] Cost increase acceptable (typically 20-50% of current cost)
- [ ] CPU target (70-80%) appropriate for workload

### Procedure 3: Validate Cluster Capacity

**Command**:
```bash
./operations/workflows/kubectl-ai-validate-scaling.sh <deployment> <namespace>
```

**Example**:
```bash
./operations/workflows/kubectl-ai-validate-scaling.sh backend production

# Output includes:
# - Cluster capacity analysis
# - Available CPU and memory
# - Capacity at max replicas (with 10% safety margin)
# - Scheduler constraint check
# - Validation result (PASSED or FAILED)
```

**Validation Results**:
- ✅ **PASSED**: Cluster has capacity, proceed to approval
- ❌ **FAILED**: Cluster at capacity, must add nodes before scaling

**If Validation Failed**:
```bash
# Option 1: Add more nodes to cluster
gcloud container clusters resize <cluster> --num-nodes <new-count>

# Option 2: Reduce max replicas in recommendation
./operations/workflows/approve-hpa-policy.sh <deployment> 1 3 <namespace>

# Then re-run validation
./operations/workflows/kubectl-ai-validate-scaling.sh <deployment> <namespace>
```

### Procedure 4: Architect Approval

**Command**:
```bash
./operations/workflows/approve-hpa-policy.sh <deployment> <min> <max> <namespace>
```

**Example**:
```bash
./operations/workflows/approve-hpa-policy.sh backend 1 5 production

# Script displays:
# 1. Current HPA policy
# 2. Resource requirements at min and max replicas
# 3. Scaling behavior explanation
# 4. Prompts for architect decision: approve/reject/conditional
```

**Architect Approval Checklist**:
- [ ] Recommendation reviewed and understood
- [ ] kubectl-ai validation passed (cluster capacity confirmed)
- [ ] min replicas sufficient for baseline load
- [ ] max replicas won't exceed cluster capacity
- [ ] Cost increase acceptable to team
- [ ] No conflicting scheduler constraints
- [ ] Decision: approve / reject / conditional

**Architect Decision Recording**:
```bash
# Script prompts for:
# - Decision: approve/reject/conditional
# - Justification: reasoning for decision
# - Timestamp: auto-recorded
# - Architect name: auto-recorded

# Example justification:
# "CPU 78% sustained for 5 min. kagent recommends max 5 replicas.
#  kubectl-ai validated cluster capacity. Cost increase $12/month acceptable."
```

### Procedure 5: Apply HPA Policy

**If Architect Approved**:
```bash
# Apply HPA to cluster
./operations/workflows/approve-hpa-policy.sh <deployment> <min> <max> <namespace> --apply

# Output:
# - HPA manifest created and applied
# - Verification that HPA is active
# - Instructions for monitoring
```

**Verify HPA is Active**:
```bash
# Check HPA status
kubectl get hpa -n <namespace> -w

# Expected output:
# NAME              REFERENCE                TARGETS           MINPODS MAXPODS REPLICAS
# backend-hpa       Deployment/backend       65%/70% (cpu)     1       5       2

# Watch pods scaling:
kubectl get pods -n <namespace> -w

# Monitor metrics:
kubectl top pods -n <namespace>
```

### Procedure 6: Monitor Scaling Behavior

**1-Minute Check** (After HPA applied):
```bash
# Verify HPA is monitoring metrics
kubectl get hpa <name> -n <namespace> -o yaml | grep -A 5 "status:"

# Expected: currentMetrics shows CPU/memory utilization
```

**5-Minute Check**:
```bash
# Check if pods are scaling
kubectl get pods -n <namespace> | wc -l

# Compare to baseline:
# - If load increasing: replicas should increase
# - If load decreasing: replicas should remain at min

# Verify CPU utilization trending toward target (70%)
kubectl top pods -n <namespace> --sort-by=cpu
```

**15-Minute Check**:
```bash
# Verify scaling stabilized
kubectl get hpa <name> -n <namespace>

# Check current replicas match target
# Should be stable (not continuously scaling up/down)

# Verify error rate low
kubectl logs <pod> -n <namespace> | grep -i error | wc -l
```

**1-Hour Check**:
```bash
# Comprehensive validation
kubectl get deployment <deployment> -n <namespace> -o yaml | grep replicas:

# Expected results:
# - Replicas stable (not flapping)
# - CPU utilization at target (70%)
# - Memory utilization normal
# - Error rate <1%
# - Latency p95 acceptable

# Document outcome in PHR
```

---

## Scaling Considerations

### CPU vs. Memory Scaling

**CPU-Based Scaling** (Primary):
- Scales when CPU >70% (target threshold)
- Appropriate for compute-heavy workloads
- Most common scaling trigger

**Memory-Based Scaling** (Secondary):
- Scales when memory >75% utilization
- Slower than CPU, longer time to respond
- Consider combined metric for hybrid workloads

**Recommendation**: Use CPU as primary metric, memory as backup.

### Min and Max Replicas Strategy

**Min Replicas**:
- Should equal current stable replicas
- Ensures baseline availability
- Typical: 1-2 for non-critical services, 2-3 for critical

**Max Replicas**:
- Should allow headroom (1.5-2x expected peak)
- Limited by cluster capacity (validated by kubectl-ai)
- Cost implications: higher max = higher potential costs

**Example**:
```
Current load: 1 pod at 60% CPU
Expected peak: 3 pods at 70% CPU
HPA Configuration:
  - Min: 1 (current baseline)
  - Max: 5 (allows 66% headroom above peak)
  - Target: 70% CPU utilization
```

### Scaling Speed

**Scale-Up** (Add replicas):
- 30 seconds per replica (defined in HPA behavior)
- Fast response to load increases
- Prevents cascading failures

**Scale-Down** (Remove replicas):
- 5-minute stabilization window (defined in HPA behavior)
- Prevents flapping (rapid up/down cycles)
- Gradual scale-down protects during traffic fluctuations

**Rationale**: Fast scale-up, slow scale-down prevents resource waste while ensuring stability.

---

## Common Scenarios & Solutions

### Scenario 1: Traffic Spike at Peak Hours

**Indicator**: CPU jumps from 50% to 80% in 5 minutes

**Action**:
```bash
# 1. Check if HPA exists
kubectl get hpa -n <namespace>

# 2. If HPA exists, monitor scaling
kubectl get hpa -n <namespace> -w

# 3. If HPA doesn't exist, implement it
./operations/workflows/kagent-recommend-scaling.sh <deployment> <namespace>
./operations/workflows/kubectl-ai-validate-scaling.sh <deployment> <namespace>
./operations/workflows/approve-hpa-policy.sh <deployment> 1 5 <namespace> --apply

# 4. Verify scaling brings CPU back to 70%
kubectl top pods -n <namespace>
```

**Expected Outcome**:
- HPA adds pods
- CPU per pod decreases
- Total CPU (all pods) increases but per-pod stays under 70%
- Latency improves, errors decrease

### Scenario 2: Nightly Batch Job Causes Spike

**Indicator**: 11 PM every night, CPU jumps to 90%

**Action**:
```bash
# 1. Identify batch job start time
grep "job\|batch" logs | grep 11:00

# 2. Set HPA max high enough for batch
# Recommendation: analyze batch CPU usage
kubectl top pods -n <namespace> | grep batch

# 3. Implement scaling ahead of batch start time
./operations/workflows/approve-hpa-policy.sh batch-job 1 10 <namespace> --apply

# 4. Monitor batch job execution
kubectl get pods -n <namespace> -w

# 5. Adjust HPA after first batch run
# If scaled to 5 pods, max could be 6-7 (small headroom)
```

**Cost Optimization**:
```bash
# After 1 week of batch monitoring, adjust HPA to actual needs
kubectl patch hpa batch-job-hpa -p '{"spec":{"maxReplicas":6}}'
```

### Scenario 3: Continuous Growth (Trending Upward)

**Indicator**: Replicas increasing every week (1→2→3→4)

**Action**:
```bash
# 1. Investigate root cause
# - More concurrent users?
# - Inefficient code change?
# - External API call growth?

# 2. If expected growth:
# Update HPA max replicas to accommodate
kubectl patch hpa <name> -p '{"spec":{"maxReplicas":10}}'

# 3. If unexpected growth:
# Investigate and optimize application
git log --oneline -10  # Recent code changes
kubectl describe deployment <name>  # Check for recent changes

# 4. Consider vertical scaling (increase pod resources)
# Instead of more pods, make existing pods more powerful
kubectl set resources deployment/<name> \
  --limits=cpu=500m,memory=512Mi \
  --requests=cpu=200m,memory=256Mi
```

---

## Troubleshooting

### Problem: HPA Not Scaling Despite High CPU

**Symptoms**:
- CPU >70% but replicas not increasing
- HPA exists but not responding

**Diagnosis**:
```bash
# Check HPA status
kubectl describe hpa <name> -n <namespace>

# Look for errors or warnings in status

# Check metrics available
kubectl get hpa <name> -o yaml | grep -A 10 currentMetrics:
```

**Solutions**:

1. **Metrics Server Not Available**:
   ```bash
   kubectl get deployment metrics-server -n kube-system
   # If missing, enable it:
   minikube addons enable metrics-server
   ```

2. **Insufficient Node Capacity**:
   ```bash
   kubectl describe nodes
   # If nodes fully allocated, add more nodes or reduce max replicas
   ```

3. **HPA Misconfiguration**:
   ```bash
   # Check HPA target CPU
   kubectl get hpa <name> -o yaml | grep averageUtilization:

   # If wrong, update it:
   kubectl patch hpa <name> -p '{"spec":{"metrics":[{"resource":{"target":{"averageUtilization":70}}}]}}'
   ```

### Problem: HPA Scaling Too Aggressively (Flapping)

**Symptoms**:
- Replicas constantly changing (1→3→1→3)
- Cost volatile

**Diagnosis**:
```bash
# Check HPA scaling history
kubectl describe hpa <name> | grep -A 20 "Events:"
```

**Solutions**:

1. **Increase Stabilization Window**:
   ```bash
   # Wait longer before scaling down
   kubectl patch hpa <name> -p '{"spec":{"behavior":{"scaleDown":{"stabilizationWindowSeconds":600}}}}'
   ```

2. **Increase Target CPU** (less sensitive):
   ```bash
   # Change target from 70% to 80%
   kubectl patch hpa <name> -p '{"spec":{"metrics":[{"resource":{"target":{"averageUtilization":80}}}]}}'
   ```

3. **Adjust Scale-Up Behavior**:
   ```bash
   # Slower scale-up (less reactive)
   kubectl patch hpa <name> -p '{"spec":{"behavior":{"scaleUp":{"stabilizationWindowSeconds":60}}}}'
   ```

### Problem: HPA Reached Max Replicas but Still High CPU

**Symptoms**:
- All pods at max replicas
- CPU still >70%
- Service degrading

**Diagnosis**:
```bash
# Check HPA is at max
kubectl get hpa <name>
# REPLICAS column should show maxReplicas value

# Check actual CPU
kubectl top pods -n <namespace> --sort-by=cpu
```

**Solutions**:

1. **Increase HPA Max Replicas**:
   ```bash
   kubectl patch hpa <name> -p '{"spec":{"maxReplicas":20}}'
   ```

2. **Increase Pod Resources** (vertical scaling):
   ```bash
   # Give each pod more resources
   kubectl set resources deployment/<name> \
     --limits=cpu=500m,memory=1Gi
   ```

3. **Optimize Application**:
   ```bash
   # Investigate code bottlenecks
   # Profile CPU usage
   # Implement caching, batching, async processing
   ```

---

## Best Practices

### 1. Test HPA Before Production

```bash
# Deploy to staging environment first
kubectl set image deployment/<name> -n staging <image>

# Generate load test
k6 run --vus 50 --duration 5m load-test.js

# Monitor scaling behavior
kubectl get hpa -n staging -w
kubectl get pods -n staging -w

# Verify results
kubectl logs <pod> -n staging | grep -i error | wc -l
```

### 2. Monitor Cost Impact

```bash
# Track actual cost vs. estimated cost
# Weekly cost report:
#   - Current pod count
#   - Current cost
#   - Cost vs. HPA estimate
#   - Adjustment recommendations

# Cloud provider commands:
gcloud compute project-info describe --format='value(name)'
gcloud compute instances list --format='table(name,machineType.scope(machineTypes),zone)'
```

### 3. Set Up Alerts

```bash
# Alert when HPA at max replicas
- name: HPAMaxReached
  expr: kube_hpa_status_current_replicas >= kube_hpa_spec_max_replicas
  for: 5m

# Alert when CPU consistently high
- name: HighCPUUtilization
  expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
  for: 10m
```

### 4. Document Scaling Policy

```markdown
## Deployment Scaling Policy

**Deployment**: backend
**Min Replicas**: 2 (HA baseline)
**Max Replicas**: 10 (peak capacity)
**Target CPU**: 70%
**Last Updated**: 2025-12-24
**Reason**: Peak load analysis shows 70% CPU at 8 pods

### Cost Impact
- Current: $50/month (2 pods)
- At Max: $250/month (10 pods)
- Typical: $120/month (5 pods average)
```

---

## Escalation Procedure

**If scaling fails or issues persist**:

1. **Immediate Actions** (0-5 min):
   - Verify HPA status: `kubectl describe hpa <name>`
   - Check metrics available: `kubectl top pods`
   - Verify cluster capacity: `kubectl describe nodes`

2. **Escalate to Engineering** (5-15 min):
   - Investigate application performance bottleneck
   - Check for code issues preventing scale-out
   - Consider vertical scaling (bigger pods) instead

3. **Escalate to Infrastructure** (15-30 min):
   - Add nodes to cluster if capacity full
   - Investigate metrics-server issues
   - Review HPA configuration for misalignment with workload

4. **Document & Learn** (Post-incident):
   - Record root cause in runbook
   - Update HPA configuration based on findings
   - Add monitoring/alerts for early detection

---

## Related Documentation

- **kagent Scaling Recommendation**: `operations/workflows/kagent-recommend-scaling.sh`
- **kubectl-ai Validation**: `operations/workflows/kubectl-ai-validate-scaling.sh`
- **HPA Approval Workflow**: `operations/workflows/approve-hpa-policy.sh`
- **Kubernetes HPA Docs**: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
- **Cost Analysis**: `operations/workflows/analyze-scaling-cost.sh`

---

**Runbook Version**: 1.0.0
**Last Updated**: 2025-12-24
**Maintained By**: Phase IV Operations
**Status**: ✅ Operational
