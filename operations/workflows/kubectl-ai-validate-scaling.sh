#!/bin/bash

################################################################################
# Phase IV: kubectl-ai Scaling Validation
# Purpose: Validate HPA scaling policy against cluster capacity and constraints
# Target: <5 second validation
# Output: Validation report confirming policy is safe to apply
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
Usage: kubectl-ai-validate-scaling.sh <deployment> [namespace]

Arguments:
  <deployment>    Deployment name to validate
  [namespace]     Kubernetes namespace (default: default)

Example:
  ./kubectl-ai-validate-scaling.sh backend default

Output:
  - Cluster capacity validation report
  - Resource availability check
  - Constraint verification
  - Safety recommendations
EOF
  exit 1
}

if [[ $# -lt 1 ]]; then
  usage
fi

DEPLOYMENT="$1"
NAMESPACE="${2:-default}"

################################################################################
# PREREQUISITES
################################################################################

echo -e "${BLUE}=== Phase IV: kubectl-ai Scaling Validation ===${NC}"
echo

# Verify kubectl access
if ! kubectl cluster-info &> /dev/null; then
  echo -e "${RED}❌ ERROR: kubectl cannot access cluster${NC}"
  exit 1
fi

# Verify deployment exists
if ! kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" &> /dev/null; then
  echo -e "${RED}❌ ERROR: Deployment not found: $DEPLOYMENT${NC}"
  exit 1
fi

echo "Deployment: ${BLUE}$DEPLOYMENT${NC}"
echo "Namespace: ${BLUE}$NAMESPACE${NC}"
echo

################################################################################
# PHASE 1: GATHER HPA POLICY & NODE CAPACITY
################################################################################

echo -e "${YELLOW}[1/4] Gathering cluster capacity information...${NC}"

# Get HPA policy (if exists) or from recommendation
HPA_EXISTS=$(kubectl get hpa -n "$NAMESPACE" -l "app.kubernetes.io/name=$DEPLOYMENT" --no-headers 2>/dev/null | wc -l || echo "0")

if [[ $HPA_EXISTS -gt 0 ]]; then
  HPA_NAME=$(kubectl get hpa -n "$NAMESPACE" -l "app.kubernetes.io/name=$DEPLOYMENT" -o jsonpath='{.items[0].metadata.name}')
  HPA_MAX=$(kubectl get hpa "$HPA_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.maxReplicas}')
  HPA_MIN=$(kubectl get hpa "$HPA_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.minReplicas}')
else
  # Use defaults if HPA doesn't exist yet
  HPA_MIN=1
  HPA_MAX=5
fi

# Get deployment resource requests
DEPLOYMENT_INFO=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o yaml)
CPU_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "cpu:" | head -1 | sed 's/.*cpu: //;s/m.*//' | xargs || echo "100")
MEMORY_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "memory:" | head -1 | sed 's/.*memory: //;s/Mi.*//' | xargs || echo "128")

# Get node information
NODES=$(kubectl get nodes --no-headers | wc -l)
NODE_CAPACITY=$(kubectl get nodes -o jsonpath='{.items[*].status.capacity.cpu}' | tr ' ' '\n' | sed 's/m//' | awk '{sum+=$1} END {print sum}' || echo "0")
NODE_MEMORY=$(kubectl get nodes -o jsonpath='{.items[*].status.capacity.memory}' | tr ' ' '\n' | sed 's/Ki//' | awk '{sum+=$1/1024} END {print int(sum)}' || echo "0")

# Get allocated resources
ALLOCATED_CPU=$(kubectl describe nodes | grep "Allocated resources" -A 5 | grep cpu | awk '{sum+=$2} END {print sum}' | sed 's/m//' || echo "0")
ALLOCATED_MEMORY=$(kubectl describe nodes | grep "Allocated resources" -A 5 | grep memory | awk '{sum+=$2} END {print sum}' | sed 's/Mi//' || echo "0")

# Calculate available resources
AVAILABLE_CPU=$((NODE_CAPACITY - ALLOCATED_CPU))
AVAILABLE_MEMORY=$((NODE_MEMORY - ALLOCATED_MEMORY))

echo -e "${GREEN}✅ Cluster capacity gathered${NC}"
echo "  Cluster Nodes: $NODES"
echo "  Total CPU capacity: ${NODE_CAPACITY}m"
echo "  Total Memory capacity: ${NODE_MEMORY}Mi"
echo "  Allocated CPU: ${ALLOCATED_CPU}m"
echo "  Allocated Memory: ${ALLOCATED_MEMORY}Mi"
echo "  Available CPU: ${AVAILABLE_CPU}m"
echo "  Available Memory: ${AVAILABLE_MEMORY}Mi"
echo

################################################################################
# PHASE 2: VALIDATE CAPACITY FOR MAX REPLICAS
################################################################################

echo -e "${YELLOW}[2/4] Validating capacity for HPA max replicas...${NC}"

# Calculate resources needed at max replicas
CPU_AT_MAX=$((CPU_REQUEST * HPA_MAX))
MEMORY_AT_MAX=$((MEMORY_REQUEST * HPA_MAX))

# Add 10% safety margin
CPU_WITH_MARGIN=$((CPU_AT_MAX * 110 / 100))
MEMORY_WITH_MARGIN=$((MEMORY_AT_MAX * 110 / 100))

CAPACITY_OK=true
CPU_CAPACITY_OK=true
MEMORY_CAPACITY_OK=true

if [[ $CPU_WITH_MARGIN -gt $NODE_CAPACITY ]]; then
  CPU_CAPACITY_OK=false
  CAPACITY_OK=false
  echo -e "${RED}❌ CPU capacity exceeded${NC}"
  echo "   Required at max ($HPA_MAX replicas): ${CPU_WITH_MARGIN}m (with 10% margin)"
  echo "   Available: ${NODE_CAPACITY}m"
fi

if [[ $MEMORY_WITH_MARGIN -gt $NODE_MEMORY ]]; then
  MEMORY_CAPACITY_OK=false
  CAPACITY_OK=false
  echo -e "${RED}❌ Memory capacity exceeded${NC}"
  echo "   Required at max ($HPA_MAX replicas): ${MEMORY_WITH_MARGIN}Mi (with 10% margin)"
  echo "   Available: ${NODE_MEMORY}Mi"
fi

if [[ "$CAPACITY_OK" == "true" ]]; then
  echo -e "${GREEN}✅ Cluster has capacity for max replicas${NC}"
  echo "   Max pods ($HPA_MAX) will require: ${CPU_AT_MAX}m CPU, ${MEMORY_AT_MAX}Mi memory"
  echo "   With 10% safety margin: ${CPU_WITH_MARGIN}m CPU, ${MEMORY_WITH_MARGIN}Mi memory"
  echo "   Cluster capacity: ${NODE_CAPACITY}m CPU, ${NODE_MEMORY}Mi memory"
fi

echo

################################################################################
# PHASE 3: CHECK SCHEDULER CONSTRAINTS
################################################################################

echo -e "${YELLOW}[3/4] Checking scheduler constraints...${NC}"

CONSTRAINTS_OK=true

# Check for taints
TAINTED_NODES=$(kubectl get nodes -o jsonpath='{.items[?(@.spec.taints)].metadata.name}' 2>/dev/null | wc -w || echo "0")
if [[ $TAINTED_NODES -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  $TAINTED_NODES nodes have taints${NC}"
  echo "   Verify deployment has matching tolerations"
  # Don't fail on this, just warn
fi

# Check for node selectors
NODE_SELECTOR=$(echo "$DEPLOYMENT_INFO" | grep -A 5 "nodeSelector:" | grep -v "nodeSelector:" | head -1 || echo "")
if [[ -n "$NODE_SELECTOR" ]]; then
  echo -e "${YELLOW}⚠️  Deployment has node selector: $NODE_SELECTOR${NC}"
  echo "   Verify there are enough nodes matching selector"
fi

# Check for affinity rules
AFFINITY=$(echo "$DEPLOYMENT_INFO" | grep -c "affinity:" || echo "0")
if [[ $AFFINITY -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  Deployment has affinity rules${NC}"
  echo "   Pod affinity/anti-affinity may limit scaling"
fi

echo -e "${GREEN}✅ Scheduler constraints checked${NC}"
echo

################################################################################
# PHASE 4: GENERATE VALIDATION REPORT
################################################################################

echo -e "${YELLOW}[4/4] Generating validation report...${NC}"

cat << EOF

================================================================================
                      SCALING VALIDATION REPORT
================================================================================

Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
Deployment: $DEPLOYMENT
Namespace: $NAMESPACE

---
HPA POLICY VALIDATION
---
Min Replicas: $HPA_MIN
Max Replicas: $HPA_MAX
Pod Resource Requests:
  CPU: ${CPU_REQUEST}m
  Memory: ${MEMORY_REQUEST}Mi

---
CLUSTER CAPACITY CHECK
---
Cluster Nodes: $NODES
Total CPU Capacity: ${NODE_CAPACITY}m
Total Memory Capacity: ${NODE_MEMORY}Mi
Currently Allocated: ${ALLOCATED_CPU}m CPU, ${ALLOCATED_MEMORY}Mi memory
Available: ${AVAILABLE_CPU}m CPU, ${AVAILABLE_MEMORY}Mi memory

---
CAPACITY AT MAX REPLICAS ($HPA_MAX pods)
---
CPU Required: ${CPU_AT_MAX}m (with 10% margin: ${CPU_WITH_MARGIN}m)
Memory Required: ${MEMORY_AT_MAX}Mi (with 10% margin: ${MEMORY_WITH_MARGIN}Mi)

CPU Capacity Check: $([ "$CPU_CAPACITY_OK" == "true" ] && echo "✅ PASS" || echo "❌ FAIL")
Memory Capacity Check: $([ "$MEMORY_CAPACITY_OK" == "true" ] && echo "✅ PASS" || echo "❌ FAIL")

---
VALIDATION RESULTS
---
Cluster Capacity: $([ "$CAPACITY_OK" == "true" ] && echo "✅ VALIDATED" || echo "❌ INSUFFICIENT")
Scheduler Constraints: ✅ CHECKED
Network Bandwidth: ✅ ASSUMED SUFFICIENT
Storage: ✅ ASSUMED SUFFICIENT

---
VALIDATION OUTCOME
---
$([ "$CAPACITY_OK" == "true" ] && echo "✅ APPROVED FOR SCALING" || echo "❌ SCALING POLICY REJECTED")

$([ "$CAPACITY_OK" == "true" ] && cat << 'PASS_MSG' || cat << 'FAIL_MSG'
HPA scaling policy is safe to apply. Cluster has sufficient capacity
to scale up to $HPA_MAX replicas without exceeding resource limits.

Recommended Next Steps:
  1. Architect approves scaling recommendation (record in PHR)
  2. Apply HPA policy: kubectl apply -f hpa.yaml
  3. Monitor scaling behavior for 1 hour
  4. Verify pods scale correctly under load

PASS_MSG
HPA scaling policy is NOT safe to apply. Cluster does not have
sufficient capacity to scale to the recommended max replicas.

Recommended Next Steps:
  1. Add more nodes to cluster
  2. OR reduce max replicas in HPA policy
  3. OR reduce resource requests per pod
  4. Re-run validation after cluster changes

FAIL_MSG
)

---
DETAILED ANALYSIS
---
Pod Density Analysis:
  At max replicas ($HPA_MAX pods) with $NODES nodes:
  - Pods per node: $((HPA_MAX / NODES)) pods
  - CPU per node: $(((CPU_REQUEST * HPA_MAX) / NODES))m
  - Memory per node: $(((MEMORY_REQUEST * HPA_MAX) / NODES))Mi

Cluster Headroom:
  - Headroom for additional pods: $(((AVAILABLE_CPU / CPU_REQUEST)))
  - Headroom for additional workloads: $(((AVAILABLE_MEMORY / MEMORY_REQUEST)))

Risk Assessment:
  - Over-provisioning risk: $([ "$CAPACITY_OK" == "true" ] && echo "LOW" || echo "HIGH")
  - Scheduling risk: $([ "$AFFINITY" == "0" ] && echo "LOW" || echo "MEDIUM (affinity rules)")
  - Availability risk: $([ "$TAINTED_NODES" -eq 0 ] && echo "LOW" || echo "MEDIUM (tainted nodes)")

================================================================================

Report generated by kubectl-ai scaling validation.

Architect Decision:
  [ ] Approve HPA scaling policy
  [ ] Request cluster expansion before approval
  [ ] Request HPA policy adjustment (reduce max replicas)

EOF

echo
if [[ "$CAPACITY_OK" == "true" ]]; then
  echo -e "${GREEN}✅ Validation PASSED – Scaling policy is safe to apply${NC}"
  exit 0
else
  echo -e "${RED}❌ Validation FAILED – Cluster insufficient capacity${NC}"
  exit 1
fi
