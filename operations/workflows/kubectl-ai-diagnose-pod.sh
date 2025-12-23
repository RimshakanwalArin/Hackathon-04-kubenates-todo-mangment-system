#!/bin/bash

################################################################################
# Phase IV: kubectl-ai Pod Failure Diagnosis Workflow
# Purpose: Diagnose pod failures (CrashLoopBackOff, OOMKilled, etc.) using kubectl-ai
# Target: <2 second diagnosis, root cause + remediation recommendation
# Output: Human-readable diagnosis report ready for architect approval
################################################################################

set -e

# Color output for readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# USAGE
################################################################################

usage() {
  cat << 'EOF'
Usage: kubectl-ai-diagnose-pod.sh <pod-name> [namespace] [--ai-only]

Arguments:
  <pod-name>      Name of the pod to diagnose (required)
  [namespace]     Kubernetes namespace (default: default)
  [--ai-only]     Skip manual kubectl fallback, use kubectl-ai only

Example:
  # Diagnose pod in default namespace
  ./kubectl-ai-diagnose-pod.sh backend-pod-123

  # Diagnose pod in specific namespace
  ./kubectl-ai-diagnose-pod.sh backend-pod-123 production

  # Use kubectl-ai only (fail if unavailable)
  ./kubectl-ai-diagnose-pod.sh backend-pod-123 default --ai-only

Output:
  - Diagnosis report printed to stdout (formatted for manual review)
  - Ready for PHR recording by architect
EOF
  exit 1
}

if [[ $# -lt 1 ]]; then
  usage
fi

POD_NAME="$1"
NAMESPACE="${2:-default}"
AI_ONLY="${3:-}"

################################################################################
# PREREQUISITES CHECK
################################################################################

echo -e "${BLUE}=== Phase IV: kubectl-ai Pod Failure Diagnosis ===${NC}"
echo
echo "Pod: ${BLUE}$POD_NAME${NC}"
echo "Namespace: ${BLUE}$NAMESPACE${NC}"
echo

# Verify kubectl access
if ! kubectl cluster-info &> /dev/null; then
  echo -e "${RED}❌ ERROR: kubectl cannot access cluster${NC}"
  echo "   Run: minikube start"
  exit 1
fi

# Verify pod exists
if ! kubectl get pod "$POD_NAME" -n "$NAMESPACE" &> /dev/null; then
  echo -e "${RED}❌ ERROR: Pod not found: $POD_NAME (namespace: $NAMESPACE)${NC}"
  exit 1
fi

# Detect kubectl-ai availability
KUBECTL_AI_AVAILABLE=false
if command -v kubectl-ai &> /dev/null; then
  KUBECTL_AI_AVAILABLE=true
else
  if [[ "$AI_ONLY" == "--ai-only" ]]; then
    echo -e "${RED}❌ ERROR: kubectl-ai not found and --ai-only specified${NC}"
    echo "   Install kubectl-ai: https://github.com/kellerza/kubectl-ai"
    exit 1
  fi
fi

################################################################################
# PHASE 1: GATHER POD STATE
################################################################################

echo -e "${YELLOW}[1/3] Gathering pod state...${NC}"

# Get pod status
POD_STATUS=$(kubectl get pod "$POD_NAME" -n "$NAMESPACE" -o jsonpath='{.status.phase}')
POD_READY=$(kubectl get pod "$POD_NAME" -n "$NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')

# Get container status details
CONTAINER_STATES=$(kubectl get pod "$POD_NAME" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[*].state}' 2>/dev/null || echo "{}")

# Count restarts
RESTART_COUNT=$(kubectl get pod "$POD_NAME" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null || echo "0")

# Get recent events
EVENTS=$(kubectl get events -n "$NAMESPACE" --field-selector involvedObject.name="$POD_NAME" --sort-by='.lastTimestamp' 2>/dev/null | tail -10 || echo "No events")

# Get logs (last 50 lines)
LOGS=$(kubectl logs "$POD_NAME" -n "$NAMESPACE" --tail=50 2>/dev/null || echo "[Logs unavailable]")

echo -e "${GREEN}✅ Pod state gathered${NC}"
echo

################################################################################
# PHASE 2: KUBECTL-AI ANALYSIS (if available)
################################################################################

if [[ "$KUBECTL_AI_AVAILABLE" == "true" ]]; then
  echo -e "${YELLOW}[2/3] Running kubectl-ai analysis...${NC}"

  # Create temporary analysis request file
  ANALYSIS_PROMPT="Analyze this Kubernetes pod failure and provide:
1. Root cause analysis
2. Remediation recommendation
3. Expected outcome after fix

Pod details:
- Name: $POD_NAME
- Namespace: $NAMESPACE
- Phase: $POD_STATUS
- Ready: $POD_READY
- Restart Count: $RESTART_COUNT
- Recent Logs: $LOGS"

  # Call kubectl-ai with diagnosis request
  AI_DIAGNOSIS=$(kubectl-ai "$ANALYSIS_PROMPT" 2>/dev/null || echo "[kubectl-ai analysis unavailable]")

  echo -e "${GREEN}✅ kubectl-ai analysis complete${NC}"
  echo
else
  echo -e "${YELLOW}[2/3] kubectl-ai unavailable, using manual analysis${NC}"
  AI_DIAGNOSIS="[kubectl-ai tool not available - using manual kubectl analysis]"
  echo
fi

################################################################################
# PHASE 3: MANUAL KUBECTL FALLBACK ANALYSIS
################################################################################

echo -e "${YELLOW}[3/3] Generating diagnosis report...${NC}"

# Determine failure reason
FAILURE_REASON="Unknown"
if echo "$CONTAINER_STATES" | grep -q "CrashLoopBackOff"; then
  FAILURE_REASON="CrashLoopBackOff"
elif echo "$CONTAINER_STATES" | grep -q "OOMKilled"; then
  FAILURE_REASON="OOMKilled"
elif echo "$CONTAINER_STATES" | grep -q "ImagePullBackOff"; then
  FAILURE_REASON="ImagePullBackOff"
elif echo "$CONTAINER_STATES" | grep -q "Pending"; then
  FAILURE_REASON="Pending (resource constraints or image pull)"
elif [[ "$POD_READY" == "False" ]]; then
  FAILURE_REASON="Pod not ready (container unhealthy)"
fi

# Generate remediation recommendation
REMEDIATION=""
case "$FAILURE_REASON" in
  CrashLoopBackOff)
    REMEDIATION="1. Review application logs for error messages
2. Check resource requests/limits are appropriate
3. Verify environment variables and config mounts
4. Consider pod restart: kubectl delete pod $POD_NAME -n $NAMESPACE"
    ;;
  OOMKilled)
    REMEDIATION="1. Increase memory limit in deployment
2. Profile application memory usage
3. Consider resource optimization (cache, streaming)
4. If urgent: delete pod for restart with existing limits"
    ;;
  ImagePullBackOff)
    REMEDIATION="1. Verify image exists in registry
2. Check image pull secrets (kubectl get secrets -n $NAMESPACE)
3. Verify image pull policy
4. Consider using local/cached image"
    ;;
  Pending)
    REMEDIATION="1. Check cluster resource availability (kubectl top nodes)
2. Review pod scheduling constraints
3. Verify storage availability if using PVCs
4. Check node capacity for requested resources"
    ;;
  *)
    REMEDIATION="1. Review pod events and logs
2. Check deployment YAML for configuration issues
3. Verify cluster connectivity and node health"
    ;;
esac

echo -e "${GREEN}✅ Diagnosis complete${NC}"
echo

################################################################################
# OUTPUT DIAGNOSIS REPORT
################################################################################

cat << EOF

================================================================================
                      POD FAILURE DIAGNOSIS REPORT
================================================================================

Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
Pod: $POD_NAME
Namespace: $NAMESPACE

---
CURRENT STATE
---
Status Phase: $POD_STATUS
Ready: $POD_READY
Restart Count: $RESTART_COUNT
Failure Reason: $FAILURE_REASON

---
RECENT EVENTS
---
$EVENTS

---
APPLICATION LOGS (Last 50 lines)
---
$LOGS

---
KUBECTL-AI ANALYSIS
---
$AI_DIAGNOSIS

---
ROOT CAUSE ANALYSIS
---
The pod is in $FAILURE_REASON state. This typically indicates:

$(case "$FAILURE_REASON" in
  CrashLoopBackOff) echo "  • Application crashes on startup or fails health checks
  • Common causes: Missing config, bad env vars, code bug, resource constraints" ;;
  OOMKilled) echo "  • Container exceeded memory limit (Out Of Memory)
  • Memory limit may be too low for actual usage" ;;
  ImagePullBackOff) echo "  • Docker image cannot be pulled from registry
  • Check registry credentials, image name, network access" ;;
  Pending) echo "  • Pod cannot be scheduled on any node
  • Causes: Insufficient resources, scheduling constraints, storage issues" ;;
  *) echo "  • Pod is unhealthy or not reaching ready state
  • Check logs above for specific error messages" ;;
esac)

---
RECOMMENDED ACTIONS
---
$REMEDIATION

---
ARCHITECT APPROVAL REQUIRED
---
Next Step: Review this diagnosis and approve remediation action
1. Read analysis above
2. Choose appropriate remediation action
3. Create PHR with:
   - Decision: approve/reject
   - Timestamp: [ISO-8601]
   - Justification: [why this action]
   - Rollback plan: [how to undo if needed]

Example PHR creation:
  cat > history/prompts/004-phase-iv-aiops/005-pod-diagnosis-<pod-name>.phase-iv-operational.prompt.md << 'EOFPHR'
  ---
  id: 005
  title: Diagnose $POD_NAME Pod Failure
  stage: phase-iv-operational
  date: $(date +'%Y-%m-%d')
  ...
  EOFPHR

---
POST-ACTION VALIDATION
---
After executing approved action, validate:
1. Pod reaches Ready state: kubectl get pod $POD_NAME -n $NAMESPACE
2. Restart count stabilizes: kubectl get pod $POD_NAME -n $NAMESPACE -w
3. Logs show no new errors: kubectl logs $POD_NAME -n $NAMESPACE -f
4. Service is responsive (if applicable)

================================================================================
EOF

echo
echo "Diagnosis report generated. Ready for architect approval."
echo "Next: Create PHR and approve remediation action."
echo

exit 0
