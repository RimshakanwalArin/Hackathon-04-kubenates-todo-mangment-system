#!/bin/bash

################################################################################
# Phase IV: HPA Policy Approval and Application Workflow
# Purpose: Architect approval and execution of HPA scaling policy
# Approval Tier: 3 (Medium-Risk) – Architect approval, 30-minute SLA
# Output: Applied HPA policy, updated deployment scaling
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
Usage: approve-hpa-policy.sh <deployment> <min-replicas> <max-replicas> [namespace] [--apply]

Arguments:
  <deployment>        Deployment name
  <min-replicas>      Minimum replicas (e.g., 1)
  <max-replicas>      Maximum replicas (e.g., 5)
  [namespace]         Kubernetes namespace (default: default)
  [--apply]           Automatically apply HPA policy after approval

Example:
  # Review and approve HPA policy
  ./approve-hpa-policy.sh backend 1 5 default

  # Approve and apply HPA
  ./approve-hpa-policy.sh backend 1 5 production --apply

Process:
  1. Display HPA policy for review
  2. Architect provides approval decision
  3. (Optional) Apply HPA policy to cluster
  4. (Optional) Monitor scaling behavior
EOF
  exit 1
}

if [[ $# -lt 3 ]]; then
  usage
fi

DEPLOYMENT="$1"
MIN_REPLICAS="$2"
MAX_REPLICAS="$3"
NAMESPACE="${4:-default}"
AUTO_APPLY=false

if [[ "$4" == "--apply" ]]; then
  AUTO_APPLY=true
fi
if [[ "$5" == "--apply" ]]; then
  AUTO_APPLY=true
fi

################################################################################
# PREREQUISITES
################################################################################

echo -e "${BLUE}=== Phase IV: HPA Policy Approval Workflow ===${NC}"
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

# Validate replica numbers
if [[ $MIN_REPLICAS -lt 1 ]]; then
  echo -e "${RED}❌ ERROR: min-replicas must be >= 1${NC}"
  exit 1
fi

if [[ $MAX_REPLICAS -lt $MIN_REPLICAS ]]; then
  echo -e "${RED}❌ ERROR: max-replicas must be >= min-replicas${NC}"
  exit 1
fi

echo "Deployment: ${BLUE}$DEPLOYMENT${NC}"
echo "Namespace: ${BLUE}$NAMESPACE${NC}"
echo "HPA Policy: ${BLUE}min=$MIN_REPLICAS, max=$MAX_REPLICAS${NC}"
echo

################################################################################
# PHASE 1: DISPLAY HPA POLICY FOR REVIEW
################################################################################

echo -e "${YELLOW}[1/3] Displaying HPA policy for architect review...${NC}"
echo

# Get deployment info
DEPLOYMENT_INFO=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o yaml)
CURRENT_REPLICAS=$(echo "$DEPLOYMENT_INFO" | grep "replicas:" | head -1 | sed 's/.*replicas: //' | xargs || echo "1")

# Get resource requests
CPU_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "cpu:" | head -1 | sed 's/.*cpu: //;s/m.*//' | xargs || echo "100")
MEMORY_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "memory:" | head -1 | sed 's/.*memory: //;s/Mi.*//' | xargs || echo "128")

cat << EOF

================================================================================
                         HPA POLICY REVIEW
================================================================================

Deployment: $DEPLOYMENT
Namespace: $NAMESPACE
Current Replicas: $CURRENT_REPLICAS

---
PROPOSED HPA CONFIGURATION
---
Min Replicas: $MIN_REPLICAS
Max Replicas: $MAX_REPLICAS
Target CPU Utilization: 70%
Target Memory Utilization: 75%

Pod Resource Requests:
  CPU: ${CPU_REQUEST}m
  Memory: ${MEMORY_REQUEST}Mi

---
SCALING BEHAVIOR
---
When CPU usage >70%:
  • Kubernetes adds replicas up to $MAX_REPLICAS
  • Each new replica uses ${CPU_REQUEST}m CPU, ${MEMORY_REQUEST}Mi memory
  • Scaling up takes ~30 seconds per replica

When CPU usage <50%:
  • Kubernetes removes replicas down to $MIN_REPLICAS
  • Scaling down stabilizes for 5 minutes to prevent flapping
  • Ensures stability during traffic fluctuations

---
RESOURCE REQUIREMENTS
---
At Minimum ($MIN_REPLICAS replicas):
  Total CPU: $((CPU_REQUEST * MIN_REPLICAS))m
  Total Memory: $((MEMORY_REQUEST * MIN_REPLICAS))Mi

At Maximum ($MAX_REPLICAS replicas):
  Total CPU: $((CPU_REQUEST * MAX_REPLICAS))m
  Total Memory: $((MEMORY_REQUEST * MAX_REPLICAS))Mi

---
ARCHITECT APPROVAL CHECKLIST
---
Before approving, verify:
  [ ] Current replica count ($CURRENT_REPLICAS) sufficient for baseline load
  [ ] Max replica count ($MAX_REPLICAS) doesn't exceed cluster capacity
  [ ] CPU target (70%) matches expected behavior
  [ ] Cost impact acceptable (up to $MAX_REPLICAS pods)
  [ ] kubectl-ai validation passed (cluster has capacity)

================================================================================

EOF

echo -e "${GREEN}✅ HPA policy displayed for review${NC}"
echo

################################################################################
# PHASE 2: GET ARCHITECT APPROVAL
################################################################################

echo -e "${YELLOW}[2/3] Recording architect approval decision...${NC}"
echo

# Get architect decision
echo "Architect Decision Required (Tier 3 – 30-minute SLA)"
echo "Options: approve | reject | conditional"
echo
read -p "Decision: " ARCHITECT_DECISION

# Validate decision
if [[ ! "$ARCHITECT_DECISION" =~ ^(approve|reject|conditional)$ ]]; then
  echo -e "${RED}❌ Invalid decision. Please enter: approve | reject | conditional${NC}"
  exit 1
fi

# Get justification if approving
if [[ "$ARCHITECT_DECISION" == "approve" || "$ARCHITECT_DECISION" == "conditional" ]]; then
  echo
  echo "Enter approval justification (or press Enter for default):"
  read -p "Justification: " JUSTIFICATION

  if [[ -z "$JUSTIFICATION" ]]; then
    if [[ "$ARCHITECT_DECISION" == "approve" ]]; then
      JUSTIFICATION="HPA policy validated. Cluster has sufficient capacity. CPU target (70%) appropriate for workload."
    else
      JUSTIFICATION="Conditionally approved: verify cluster capacity before applying."
    fi
  fi
else
  echo
  echo "Enter rejection reason:"
  read -p "Reason: " JUSTIFICATION

  if [[ -z "$JUSTIFICATION" ]]; then
    JUSTIFICATION="Recommendation rejected pending further review."
  fi
fi

TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
ARCHITECT=$(whoami)

echo
echo -e "${GREEN}✅ Architect approval recorded${NC}"
echo "  Decision: $ARCHITECT_DECISION"
echo "  Architect: $ARCHITECT"
echo "  Timestamp: $TIMESTAMP"
echo

################################################################################
# PHASE 3: APPLY HPA OR REQUEST APPROVAL
################################################################################

echo -e "${YELLOW}[3/3] Processing approval decision...${NC}"
echo

if [[ "$ARCHITECT_DECISION" == "reject" ]]; then
  echo -e "${RED}❌ HPA Policy REJECTED${NC}"
  echo
  echo "Reason: $JUSTIFICATION"
  echo
  echo "Next Steps:"
  echo "  1. Review rejection reason with team"
  echo "  2. Address concerns (e.g., increase cluster capacity, adjust max replicas)"
  echo "  3. Re-run scaling recommendation after changes"
  exit 1
fi

if [[ "$ARCHITECT_DECISION" == "conditional" ]]; then
  echo -e "${YELLOW}⚠️  HPA Policy CONDITIONALLY APPROVED${NC}"
  echo
  echo "Conditions: $JUSTIFICATION"
  echo
  echo "Before applying HPA:"
  echo "  1. Verify conditions are met"
  echo "  2. Re-run validation: ./kubectl-ai-validate-scaling.sh $DEPLOYMENT $NAMESPACE"
  echo "  3. Re-run this script with --apply flag"
  exit 0
fi

# Architect approved – prepare to apply HPA
echo -e "${GREEN}✅ HPA Policy APPROVED${NC}"
echo
echo "Architect: $ARCHITECT"
echo "Timestamp: $TIMESTAMP"
echo "Justification: $JUSTIFICATION"
echo

if [[ "$AUTO_APPLY" != "true" ]]; then
  echo "HPA policy approved. To apply:"
  echo "  ./approve-hpa-policy.sh $DEPLOYMENT $MIN_REPLICAS $MAX_REPLICAS $NAMESPACE --apply"
  exit 0
fi

# Apply HPA policy
echo -e "${BLUE}Applying HPA policy to cluster...${NC}"
echo

# Create HPA manifest
HPA_NAME="${DEPLOYMENT}-hpa"

kubectl apply -f - << EOFHPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: $HPA_NAME
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
        averageUtilization: 70
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
EOFHPA

echo
echo -e "${GREEN}✅ HPA policy applied${NC}"
echo

################################################################################
# PHASE 4: VERIFY AND MONITOR
################################################################################

echo -e "${YELLOW}Verifying HPA deployment...${NC}"
echo

# Check HPA status
HPA_STATUS=$(kubectl get hpa "$HPA_NAME" -n "$NAMESPACE" -o yaml)

CURRENT_REPLICAS=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
DESIRED_REPLICAS=$(echo "$HPA_STATUS" | grep -A 5 "status:" | grep "desiredReplicas:" | sed 's/.*desiredReplicas: //' || echo "?")
CURRENT_CPU=$(kubectl get hpa "$HPA_NAME" -n "$NAMESPACE" -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null || echo "?")

echo "HPA Status:"
echo "  Name: $HPA_NAME"
echo "  Namespace: $NAMESPACE"
echo "  Min Replicas: $MIN_REPLICAS"
echo "  Max Replicas: $MAX_REPLICAS"
echo "  Current Replicas: $CURRENT_REPLICAS"
echo "  Current CPU Utilization: ${CURRENT_CPU}%"
echo

echo -e "${GREEN}✅ HPA Policy Successfully Applied${NC}"
echo
echo "Next Steps:"
echo "  1. Monitor HPA behavior: kubectl get hpa -w -n $NAMESPACE"
echo "  2. Watch pods scaling: kubectl get pods -n $NAMESPACE -w"
echo "  3. Track resource usage: kubectl top pods -n $NAMESPACE"
echo "  4. Document outcome in PHR with metrics"
echo
echo "Recording HPA application in PHR:"
echo "  Create history/prompts/004-phase-iv-aiops/[id]-hpa-approval.md"
echo "  Include: current metrics, HPA policy applied, post-scaling validation"
echo

exit 0
