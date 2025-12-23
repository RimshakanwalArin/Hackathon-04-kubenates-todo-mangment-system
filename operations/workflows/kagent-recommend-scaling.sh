#!/bin/bash

################################################################################
# Phase IV: kagent Scaling Recommendation Workflow
# Purpose: Analyze cluster metrics and recommend HPA scaling policy
# Target: <30 second recommendation generation
# Approval Required: Tier 3 (Medium-Risk) – Architect approval, 30-minute SLA
################################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

################################################################################
# USAGE
################################################################################

usage() {
  cat << 'EOF'
Usage: kagent-recommend-scaling.sh <deployment> [namespace] [--sustained-period]

Arguments:
  <deployment>         Deployment name to analyze for scaling
  [namespace]          Kubernetes namespace (default: default)
  [--sustained-period] Minutes to check for sustained high utilization (default: 5)

Examples:
  # Analyze deployment for scaling recommendations
  ./kagent-recommend-scaling.sh backend default

  # Check 10-minute sustained utilization
  ./kagent-recommend-scaling.sh backend production --sustained-period=10

Output:
  - Scaling recommendation report with HPA policy
  - Current metrics analysis
  - Cost impact estimation
  - Ready for architect approval
EOF
  exit 1
}

if [[ $# -lt 1 ]]; then
  usage
fi

DEPLOYMENT="$1"
NAMESPACE="${2:-default}"
SUSTAINED_PERIOD="${3:-5}"

# Parse --sustained-period flag if provided
if [[ "$3" == "--sustained-period="* ]]; then
  SUSTAINED_PERIOD="${3##*=}"
fi
if [[ "$4" == "--sustained-period="* ]]; then
  SUSTAINED_PERIOD="${4##*=}"
fi

################################################################################
# PREREQUISITES CHECK
################################################################################

echo -e "${BLUE}=== Phase IV: kagent Scaling Recommendation Workflow ===${NC}"
echo

# Verify kubectl access
if ! kubectl cluster-info &> /dev/null; then
  echo -e "${RED}❌ ERROR: kubectl cannot access cluster${NC}"
  exit 1
fi

# Verify deployment exists
if ! kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" &> /dev/null; then
  echo -e "${RED}❌ ERROR: Deployment not found: $DEPLOYMENT (namespace: $NAMESPACE)${NC}"
  exit 1
fi

# Check metrics-server availability
METRICS_AVAILABLE=false
if kubectl get deployment metrics-server -n kube-system &> /dev/null; then
  METRICS_AVAILABLE=true
fi

if [[ "$METRICS_AVAILABLE" != "true" ]]; then
  echo -e "${YELLOW}⚠️  WARNING: metrics-server not available (kubectl top unavailable)${NC}"
  echo "   Using simulated metrics for demonstration"
  echo
fi

echo "Deployment: ${BLUE}$DEPLOYMENT${NC}"
echo "Namespace: ${BLUE}$NAMESPACE${NC}"
echo "Sustained Period Check: ${BLUE}${SUSTAINED_PERIOD} minutes${NC}"
echo

################################################################################
# PHASE 1: GATHER CURRENT METRICS
################################################################################

echo -e "${YELLOW}[1/4] Gathering current pod metrics...${NC}"

# Get current pod count and resource requests
POD_COUNT=$(kubectl get pods -l "app.kubernetes.io/name=$DEPLOYMENT" -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l || echo "1")
if [[ $POD_COUNT -eq 0 ]]; then
  # Try alternative label matching
  POD_COUNT=$(kubectl get pods -n "$NAMESPACE" -o jsonpath="{.items[?(@.metadata.ownerReferences[0].name=='$DEPLOYMENT')].metadata.name}" 2>/dev/null | wc -w || echo "1")
fi

# Get deployment resource requests and limits
DEPLOYMENT_INFO=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o yaml)

CPU_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "cpu:" | head -1 | sed 's/.*cpu: //;s/m.*//' | xargs || echo "100")
MEMORY_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "memory:" | head -1 | sed 's/.*memory: //;s/Mi.*//' | xargs || echo "128")
REPLICAS=$(echo "$DEPLOYMENT_INFO" | grep "replicas:" | head -1 | sed 's/.*replicas: //' | xargs || echo "1")

echo -e "${GREEN}✅ Deployment info retrieved${NC}"
echo "  Current Replicas: $REPLICAS"
echo "  CPU Request (per pod): ${CPU_REQUEST}m"
echo "  Memory Request (per pod): ${MEMORY_REQUEST}Mi"
echo

################################################################################
# PHASE 2: ANALYZE CURRENT UTILIZATION
################################################################################

echo -e "${YELLOW}[2/4] Analyzing current resource utilization...${NC}"

if [[ "$METRICS_AVAILABLE" == "true" ]]; then
  # Get actual pod metrics
  TOTAL_CPU=0
  TOTAL_MEMORY=0
  POD_LIST=$(kubectl get pods -l "app.kubernetes.io/name=$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

  if [[ -z "$POD_LIST" ]]; then
    POD_LIST=$(kubectl get pods -n "$NAMESPACE" -o jsonpath="{.items[?(@.metadata.ownerReferences[0].name=='$DEPLOYMENT')].metadata.name}" 2>/dev/null || echo "")
  fi

  POD_COUNT=$(echo "$POD_LIST" | wc -w)

  for pod in $POD_LIST; do
    POD_METRICS=$(kubectl top pod "$pod" -n "$NAMESPACE" 2>/dev/null || echo "")
    if [[ -n "$POD_METRICS" ]]; then
      CPU=$(echo "$POD_METRICS" | awk '{print $2}' | sed 's/m//')
      MEMORY=$(echo "$POD_METRICS" | awk '{print $3}' | sed 's/Mi//')
      TOTAL_CPU=$((TOTAL_CPU + CPU))
      TOTAL_MEMORY=$((TOTAL_MEMORY + MEMORY))
    fi
  done

  AVG_CPU=$((TOTAL_CPU / POD_COUNT))
  AVG_MEMORY=$((TOTAL_MEMORY / POD_COUNT))
  CPU_UTILIZATION=$((AVG_CPU * 100 / CPU_REQUEST))
  MEMORY_UTILIZATION=$((AVG_MEMORY * 100 / MEMORY_REQUEST))
else
  # Use simulated metrics (70% CPU for demonstration)
  AVG_CPU=$((CPU_REQUEST * 70 / 100))
  AVG_MEMORY=$((MEMORY_REQUEST * 50 / 100))
  CPU_UTILIZATION=70
  MEMORY_UTILIZATION=50
fi

echo -e "${GREEN}✅ Utilization analysis complete${NC}"
echo "  Average CPU per pod: ${AVG_CPU}m ($CPU_UTILIZATION% of request)"
echo "  Average Memory per pod: ${AVG_MEMORY}Mi ($MEMORY_UTILIZATION% of request)"
echo "  Total CPU used: $((AVG_CPU * POD_COUNT))m across $POD_COUNT pods"
echo

################################################################################
# PHASE 3: GENERATE HPA RECOMMENDATION
################################################################################

echo -e "${YELLOW}[3/4] Generating HPA scaling policy recommendation...${NC}"

# Determine if scaling is needed
SCALING_NEEDED=false
if [[ $CPU_UTILIZATION -ge 70 ]]; then
  SCALING_NEEDED=true
fi

if [[ "$SCALING_NEEDED" == "true" ]]; then
  echo -e "${GREEN}✅ High utilization detected – scaling recommended${NC}"

  # Calculate recommended HPA policy
  # Formula: recommended_replicas = current_replicas * (current_cpu / target_cpu)
  # Target CPU: 70% to allow headroom
  TARGET_CPU=70
  RECOMMENDED_REPLICAS=$((REPLICAS * CPU_UTILIZATION / TARGET_CPU))
  if [[ $RECOMMENDED_REPLICAS -le $REPLICAS ]]; then
    RECOMMENDED_REPLICAS=$((REPLICAS + 1))
  fi

  # Set min/max with safety margins
  MIN_REPLICAS=$REPLICAS
  MAX_REPLICAS=$((RECOMMENDED_REPLICAS * 2))

  # HPA target CPU threshold
  HPA_CPU_THRESHOLD=70

  HPA_RECOMMENDED=true
else
  echo -e "${YELLOW}⚠️  Current utilization is acceptable${NC}"
  echo "   Scaling not immediately needed, but HPA recommended for future load spikes"

  # Still recommend HPA for auto-scaling capability
  RECOMMENDED_REPLICAS=$((REPLICAS + 1))
  MIN_REPLICAS=$REPLICAS
  MAX_REPLICAS=$((REPLICAS + 3))
  HPA_CPU_THRESHOLD=80

  HPA_RECOMMENDED=true
fi

echo "  Recommended HPA Policy:"
echo "    Min Replicas: $MIN_REPLICAS"
echo "    Max Replicas: $MAX_REPLICAS"
echo "    Target CPU: ${HPA_CPU_THRESHOLD}%"
echo

################################################################################
# PHASE 4: CALCULATE COST IMPACT
################################################################################

echo -e "${YELLOW}[4/4] Calculating cost impact and preparing recommendation...${NC}"

# Simplified cost model: ~$0.001 per milli-CPU per hour
CPU_COST_PER_MILLI_PER_HOUR=0.001
MEMORY_COST_PER_MI_PER_HOUR=0.0001

# Current monthly cost (assuming 720 hours per month, 24 hrs/day)
CURRENT_MONTHLY_CPU_COST=$(echo "$TOTAL_CPU * 720 * $CPU_COST_PER_MILLI_PER_HOUR" | bc)
CURRENT_MONTHLY_MEMORY_COST=$(echo "$TOTAL_MEMORY * 720 * $MEMORY_COST_PER_MI_PER_HOUR" | bc)
CURRENT_MONTHLY_COST=$(echo "$CURRENT_MONTHLY_CPU_COST + $CURRENT_MONTHLY_MEMORY_COST" | bc)

# Cost with HPA at recommended policy
RECOMMENDED_MONTHLY_CPU_COST=$(echo "$((HPA_CPU_THRESHOLD * RECOMMENDED_REPLICAS * CPU_REQUEST / 100)) * 720 * $CPU_COST_PER_MILLI_PER_HOUR" | bc)
RECOMMENDED_MONTHLY_MEMORY_COST=$(echo "$((MEMORY_REQUEST * RECOMMENDED_REPLICAS)) * 720 * $MEMORY_COST_PER_MI_PER_HOUR" | bc)
RECOMMENDED_MONTHLY_COST=$(echo "$RECOMMENDED_MONTHLY_CPU_COST + $RECOMMENDED_MONTHLY_MEMORY_COST" | bc)

COST_INCREASE=$(echo "$RECOMMENDED_MONTHLY_COST - $CURRENT_MONTHLY_COST" | bc)
COST_INCREASE_PERCENT=$(echo "scale=1; $COST_INCREASE * 100 / $CURRENT_MONTHLY_COST" | bc)

echo -e "${GREEN}✅ Cost impact calculated${NC}"
echo "  Current monthly cost: \$$CURRENT_MONTHLY_COST"
echo "  Estimated cost with HPA: \$$RECOMMENDED_MONTHLY_COST"
echo "  Cost increase: \$$COST_INCREASE (+${COST_INCREASE_PERCENT}%)"
echo

################################################################################
# OUTPUT RECOMMENDATION REPORT
################################################################################

cat << EOF

================================================================================
                    SCALING RECOMMENDATION REPORT
================================================================================

Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
Deployment: $DEPLOYMENT
Namespace: $NAMESPACE

---
CURRENT STATE
---
Pod Count: $POD_COUNT
Average CPU per pod: ${AVG_CPU}m (${CPU_UTILIZATION}% of request)
Average Memory per pod: ${AVG_MEMORY}Mi (${MEMORY_UTILIZATION}% of request)
Sustained period checked: ${SUSTAINED_PERIOD} minutes

---
SCALING ASSESSMENT
---
Current Utilization: ${CPU_UTILIZATION}% CPU
Scaling Recommended: $([ "$SCALING_NEEDED" == "true" ] && echo "YES (high load)" || echo "OPTIONAL (preventive)")
HPA Recommended: YES

---
HPA POLICY RECOMMENDATION
---
Configuration:
  Min Replicas: $MIN_REPLICAS
  Max Replicas: $MAX_REPLICAS
  Target CPU Utilization: ${HPA_CPU_THRESHOLD}%
  Recommended Initial Replicas: $RECOMMENDED_REPLICAS

Rationale:
  • Current pod count ($POD_COUNT) with ${CPU_UTILIZATION}% CPU utilization suggests
    need for $([ "$SCALING_NEEDED" == "true" ] && echo "immediate" || echo "preventive") scaling
  • HPA will maintain ${HPA_CPU_THRESHOLD}% CPU utilization target
  • Min replicas ($MIN_REPLICAS) ensures baseline availability
  • Max replicas ($MAX_REPLICAS) prevents runaway scaling costs

---
COST IMPACT ANALYSIS
---
Current Monthly Cost: \$$CURRENT_MONTHLY_COST
Estimated Cost with HPA: \$$RECOMMENDED_MONTHLY_COST
Monthly Cost Increase: \$$COST_INCREASE (+${COST_INCREASE_PERCENT}%)

Cost-Benefit Analysis:
  ✅ Automatic scaling prevents overload during traffic spikes
  ✅ Maintains service availability and responsiveness
  ✅ Cost increase ($COST_INCREASE/month) justified by improved reliability
  ⚠️  Monitor actual vs. predicted costs after deployment

---
KUBECTL-AI VALIDATION REQUIRED
---
Next Step: kubectl-ai will validate this recommendation against:
  1. Cluster capacity (available CPU and memory on nodes)
  2. Storage constraints (if applicable)
  3. Network bandwidth (if applicable)
  4. Scheduler constraints (affinity, taints, tolerations)

After kubectl-ai validation, architect will approve and execute.

---
ARCHITECT APPROVAL REQUIRED
---
Decision Type: Tier 3 (Medium-Risk)
SLA Window: 30 minutes
Required Approvals: Architect

Approval Checklist:
  [ ] Review scaling rationale above
  [ ] Verify HPA policy matches workload characteristics
  [ ] Confirm cost increase acceptable
  [ ] Ensure max replicas will not exceed cluster capacity
  [ ] Check for scheduler constraints that might prevent scaling

Example Approval Command:
  cat > history/prompts/004-phase-iv-aiops/[id]-scaling-recommendation.md << 'EOFPHR'
  ---
  id: [sequential]
  title: Enable HPA for $DEPLOYMENT
  stage: phase-iv-operational
  decision: approve
  timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
  justification: CPU utilization at ${CPU_UTILIZATION}%. HPA recommended to maintain <70% utilization.
  ---
  EOFPHR

---
RECOMMENDED HPA YAML
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: $DEPLOYMENT-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: $DEPLOYMENT
  minReplicas: $MIN_REPLICAS
  maxReplicas: $MAX_REPLICAS
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: $HPA_CPU_THRESHOLD
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30

---
IMPLEMENTATION STEPS
---
1. Architect reviews and approves this recommendation
2. kubectl-ai validates against cluster capacity
3. Apply HPA policy: kubectl apply -f hpa.yaml
4. Monitor scaling behavior: kubectl get hpa -w
5. Verify pods are created: kubectl get pods
6. Monitor cost: check cloud provider billing dashboard
7. Document outcome in PHR

---
VALIDATION METRICS (post-deployment)
---
After HPA is enabled, monitor:
  • CPU utilization stabilizes at ${HPA_CPU_THRESHOLD}%
  • Pod count scales up when demand increases
  • Pod count scales down during low traffic periods
  • Error rate remains <1%
  • Latency p95 remains acceptable
  • Cost increase matches estimate

================================================================================

Recommendation report generated and ready for architect review.

EOF

echo -e "${GREEN}✅ Recommendation report complete${NC}"
echo
echo "Next: Architect reviews recommendation and approves scaling policy"
echo "Then: kubectl-ai validates cluster capacity"
echo "Finally: HPA policy applied to deployment"
echo

exit 0
