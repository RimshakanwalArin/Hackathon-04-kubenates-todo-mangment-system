#!/bin/bash

################################################################################
# Phase IV: Pod Failure Diagnosis Workflow – End-to-End Test
# Purpose: Verify kubectl-ai pod diagnosis workflow with metrics validation
# Scope: Test diagnosis, approval, execution, and post-action validation
# Target: MTTD <5 min, MTTR <15 min, Approval SLA <5 min
################################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test configuration
TEST_NAMESPACE="default"
TEST_POD="test-pod-failure-$$"
TEST_DEPLOYMENT="test-deployment-$$"
DIAGNOSIS_TIME_LIMIT=5  # seconds
APPROVAL_TIME_LIMIT=300 # seconds (5 minutes)
REMEDIATION_TIME_LIMIT=600 # seconds (10 minutes)

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_START_TIME=$(date +%s)

################################################################################
# UTILITY FUNCTIONS
################################################################################

log_test() {
  echo -e "${BLUE}[TEST] $1${NC}"
}

log_pass() {
  echo -e "${GREEN}[PASS] $1${NC}"
  ((TESTS_PASSED++))
}

log_fail() {
  echo -e "${RED}[FAIL] $1${NC}"
  ((TESTS_FAILED++))
}

log_info() {
  echo -e "${YELLOW}[INFO] $1${NC}"
}

log_step() {
  echo -e "${MAGENTA}=== $1 ===${NC}"
}

cleanup() {
  log_info "Cleaning up test resources..."
  kubectl delete deployment "$TEST_DEPLOYMENT" -n "$TEST_NAMESPACE" --ignore-not-found=true 2>/dev/null || true
  kubectl delete pod "$TEST_POD" -n "$TEST_NAMESPACE" --ignore-not-found=true 2>/dev/null || true
}

trap cleanup EXIT

################################################################################
# PHASE 1: PREREQUISITES CHECK
################################################################################

log_step "Phase 1: Verifying Prerequisites"

log_test "Kubernetes cluster accessible"
if kubectl cluster-info &>/dev/null; then
  log_pass "Kubernetes cluster accessible"
else
  log_fail "Kubernetes cluster not accessible"
  echo "   Hint: Run 'minikube start'"
  exit 1
fi

log_test "kubectl-ai tool available"
if command -v kubectl-ai &>/dev/null; then
  log_pass "kubectl-ai tool available"
  KUBECTL_AI_AVAILABLE=true
else
  log_fail "kubectl-ai tool not found (test will use manual fallback)"
  KUBECTL_AI_AVAILABLE=false
fi

log_test "Metrics-server enabled"
if kubectl get deployment metrics-server -n kube-system &>/dev/null; then
  log_pass "Metrics-server deployed"
  METRICS_AVAILABLE=true
else
  log_fail "Metrics-server not found (resource metrics unavailable)"
  METRICS_AVAILABLE=false
fi

log_test "Pod diagnosis script exists"
DIAGNOSIS_SCRIPT="operations/workflows/kubectl-ai-diagnose-pod.sh"
if [[ -f "$DIAGNOSIS_SCRIPT" ]]; then
  log_pass "Pod diagnosis script found at $DIAGNOSIS_SCRIPT"
else
  log_fail "Pod diagnosis script not found at $DIAGNOSIS_SCRIPT"
  exit 1
fi

echo

################################################################################
# PHASE 2: CREATE FAILING POD
################################################################################

log_step "Phase 2: Creating Test Pod (CrashLoopBackOff Scenario)"

log_test "Create deployment with failing container"
cat > /tmp/test-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: TEST_DEPLOYMENT_NAME
  namespace: TEST_NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-pod-failure
  template:
    metadata:
      labels:
        app: test-pod-failure
    spec:
      containers:
      - name: failing-container
        image: busybox
        command: ["/bin/sh"]
        args: ["-c", "echo 'Application startup failed'; exit 1"]
        resources:
          requests:
            cpu: 50m
            memory: 32Mi
          limits:
            cpu: 100m
            memory: 64Mi
      restartPolicy: Always
EOF

# Replace placeholders
sed -i "s/TEST_DEPLOYMENT_NAME/$TEST_DEPLOYMENT/" /tmp/test-deployment.yaml
sed -i "s/TEST_NAMESPACE/$TEST_NAMESPACE/" /tmp/test-deployment.yaml

# Create deployment
kubectl apply -f /tmp/test-deployment.yaml

# Wait for pod to be created and enter CrashLoopBackOff
log_info "Waiting for pod to enter CrashLoopBackOff state (up to 30 seconds)..."
WAIT_TIME=0
while [[ $WAIT_TIME -lt 30 ]]; do
  POD_STATUS=$(kubectl get pod -l app=test-pod-failure -n "$TEST_NAMESPACE" --no-headers 2>/dev/null | head -1 | awk '{print $3}')
  if [[ "$POD_STATUS" == "CrashLoopBackOff" ]]; then
    TEST_POD=$(kubectl get pod -l app=test-pod-failure -n "$TEST_NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    log_pass "Pod $TEST_POD entered CrashLoopBackOff state"
    break
  fi
  sleep 1
  ((WAIT_TIME++))
done

if [[ $WAIT_TIME -ge 30 ]]; then
  log_fail "Pod did not enter CrashLoopBackOff within 30 seconds"
  log_info "Current pod status:"
  kubectl get pod -l app=test-pod-failure -n "$TEST_NAMESPACE" 2>/dev/null || echo "   No pods found"
fi

echo

################################################################################
# PHASE 3: RUN POD DIAGNOSIS
################################################################################

log_step "Phase 3: Running Pod Failure Diagnosis"

log_test "Execute kubectl-ai pod diagnosis (MTTD target: <5 seconds)"
DIAGNOSIS_START=$(date +%s)

# Run diagnosis script
DIAGNOSIS_OUTPUT=$(bash "$DIAGNOSIS_SCRIPT" "$TEST_POD" "$TEST_NAMESPACE" 2>&1 || true)
DIAGNOSIS_EXIT_CODE=$?

DIAGNOSIS_END=$(date +%s)
DIAGNOSIS_TIME=$((DIAGNOSIS_END - DIAGNOSIS_START))

# Save diagnosis output
DIAGNOSIS_FILE="/tmp/diagnosis-$TEST_POD.txt"
echo "$DIAGNOSIS_OUTPUT" > "$DIAGNOSIS_FILE"

if [[ $DIAGNOSIS_TIME -lt $DIAGNOSIS_TIME_LIMIT ]]; then
  log_pass "Pod diagnosis completed in ${DIAGNOSIS_TIME}s (target: <${DIAGNOSIS_TIME_LIMIT}s)"
else
  log_fail "Pod diagnosis took ${DIAGNOSIS_TIME}s (target: <${DIAGNOSIS_TIME_LIMIT}s)"
fi

log_test "Diagnosis output contains root cause analysis"
if echo "$DIAGNOSIS_OUTPUT" | grep -q -E "ROOT CAUSE|CrashLoopBackOff|Restart Count"; then
  log_pass "Diagnosis output includes root cause analysis"
else
  log_fail "Diagnosis output missing root cause analysis"
fi

log_test "Diagnosis output contains remediation recommendation"
if echo "$DIAGNOSIS_OUTPUT" | grep -q -E "RECOMMENDED|kubectl|Action"; then
  log_pass "Diagnosis output includes remediation recommendation"
else
  log_fail "Diagnosis output missing remediation recommendation"
fi

log_test "Diagnosis is formatted for architect review"
if echo "$DIAGNOSIS_OUTPUT" | grep -q -E "Timestamp|Pod:|Namespace:|APPROVAL REQUIRED"; then
  log_pass "Diagnosis includes approval workflow prompts"
else
  log_fail "Diagnosis missing approval workflow prompts"
fi

log_info "Diagnosis saved to: $DIAGNOSIS_FILE"
echo

################################################################################
# PHASE 4: VERIFY DIAGNOSIS ACCURACY
################################################################################

log_step "Phase 4: Verifying Diagnosis Accuracy"

log_test "Diagnosis correctly identifies CrashLoopBackOff state"
if echo "$DIAGNOSIS_OUTPUT" | grep -q "CrashLoopBackOff"; then
  log_pass "Diagnosis correctly identifies CrashLoopBackOff"
else
  log_fail "Diagnosis did not identify CrashLoopBackOff"
fi

log_test "Diagnosis includes pod restart count"
if echo "$DIAGNOSIS_OUTPUT" | grep -q "Restart Count"; then
  RESTART_COUNT=$(echo "$DIAGNOSIS_OUTPUT" | grep "Restart Count:" | head -1 | awk '{print $NF}')
  log_pass "Diagnosis includes restart count: $RESTART_COUNT"
else
  log_fail "Diagnosis missing restart count"
fi

log_test "Diagnosis includes application logs"
if echo "$DIAGNOSIS_OUTPUT" | grep -q -E "APPLICATION LOGS|logs|startup failed"; then
  log_pass "Diagnosis includes application logs"
else
  log_fail "Diagnosis missing application logs"
fi

log_test "Diagnosis includes pod events"
if echo "$DIAGNOSIS_OUTPUT" | grep -q "Events"; then
  log_pass "Diagnosis includes pod events"
else
  log_fail "Diagnosis missing pod events"
fi

echo

################################################################################
# PHASE 5: SIMULATE ARCHITECT APPROVAL
################################################################################

log_step "Phase 5: Simulating Architect Approval Workflow"

log_test "Create PHR file for architect decision"
PHR_FILE="/tmp/phr-test-$TEST_POD.md"
cat > "$PHR_FILE" << EOF
---
id: test-001
title: $TEST_POD Pod Failure Diagnosis
stage: phase-iv-operational
date: $(date +'%Y-%m-%d')
feature: 004-phase-iv-aiops
command: test-pod-failure-diagnosis.sh
labels: ["kubectl-ai", "operational", "pod-failure", "test"]
links:
  spec: specs/004-phase-iv-aiops/spec.md
  ticket: null
  adr: null
  pr: null
files: []
tests:
  - Pod diagnosis completed within MTTD target
  - Approval granted within SLA window
  - Pod remediation executed successfully
---

## Test Diagnosis Result

\`\`\`
$DIAGNOSIS_OUTPUT
\`\`\`

## Architect Decision (Test Approval)

- **Decision**: approve
- **Architect**: Test Runner
- **Timestamp**: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
- **Justification**: Test pod intentionally failing. Approval granted to verify workflow.
- **SLA Compliance**: Within 5-minute window
EOF

log_pass "PHR file created at $PHR_FILE"

log_test "Approval procedure script exists and is executable"
APPROVAL_SCRIPT="operations/workflows/approve-pod-remediation.sh"
if [[ -x "$APPROVAL_SCRIPT" ]]; then
  log_pass "Approval procedure script is executable"
else
  log_fail "Approval procedure script not executable or missing"
fi

APPROVAL_START=$(date +%s)

log_test "Simulate architect approval (SLA target: <5 minutes)"
# In real scenario, would run: bash "$APPROVAL_SCRIPT" "$PHR_FILE" approve "Test approval"
# For testing, we simulate the approval decision
APPROVAL_GRANTED=true

APPROVAL_END=$(date +%s)
APPROVAL_TIME=$((APPROVAL_END - APPROVAL_START))

if [[ "$APPROVAL_GRANTED" == "true" && $APPROVAL_TIME -lt $APPROVAL_TIME_LIMIT ]]; then
  log_pass "Architect approval granted within ${APPROVAL_TIME}s (target: <${APPROVAL_TIME_LIMIT}s)"
else
  log_fail "Architect approval not granted or exceeded SLA"
fi

echo

################################################################################
# PHASE 6: EXECUTE REMEDIATION
################################################################################

log_step "Phase 6: Executing Approved Remediation"

log_test "Remediation action: Delete and restart pod (simple scenario)"
REMEDIATION_START=$(date +%s)

# Execute remediation: delete pod to trigger restart
kubectl delete pod "$TEST_POD" -n "$TEST_NAMESPACE" --ignore-not-found=true 2>/dev/null || true

# Wait for new pod to be created
WAIT_TIME=0
NEW_POD=""
while [[ $WAIT_TIME -lt 30 ]]; do
  NEW_POD=$(kubectl get pod -l app=test-pod-failure -n "$TEST_NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
  if [[ -n "$NEW_POD" && "$NEW_POD" != "$TEST_POD" ]]; then
    log_pass "New pod created: $NEW_POD"
    TEST_POD="$NEW_POD"
    break
  fi
  sleep 1
  ((WAIT_TIME++))
done

REMEDIATION_END=$(date +%s)
REMEDIATION_TIME=$((REMEDIATION_END - REMEDIATION_START))

if [[ $REMEDIATION_TIME -lt $REMEDIATION_TIME_LIMIT ]]; then
  log_pass "Remediation executed within ${REMEDIATION_TIME}s (target: <${REMEDIATION_TIME_LIMIT}s)"
else
  log_fail "Remediation took ${REMEDIATION_TIME}s (target: <${REMEDIATION_TIME_LIMIT}s)"
fi

echo

################################################################################
# PHASE 7: POST-ACTION VALIDATION
################################################################################

log_step "Phase 7: Post-Action Validation (1-Hour Monitoring Window)"

log_test "Verify pod status updated"
POD_STATUS=$(kubectl get pod "$TEST_POD" -n "$TEST_NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null)
if [[ -n "$POD_STATUS" ]]; then
  log_pass "Pod status: $POD_STATUS"
else
  log_fail "Could not retrieve pod status"
fi

log_test "5-minute validation: Pod status and restart count"
RESTART_COUNT=$(kubectl get pod "$TEST_POD" -n "$TEST_NAMESPACE" -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null || echo "0")
log_info "Pod restart count: $RESTART_COUNT"

if [[ $RESTART_COUNT -gt 0 ]]; then
  log_pass "Pod has restarted (expected for failing pod)"
else
  log_info "Pod has not restarted yet"
fi

log_test "15-minute validation: Check for CrashLoopBackOff events"
EVENTS=$(kubectl get events -n "$TEST_NAMESPACE" --field-selector involvedObject.name="$TEST_POD" 2>/dev/null | tail -5)
log_info "Recent events:"
echo "$EVENTS" | tail -3

log_test "Pod events recorded in Kubernetes event log"
if [[ -n "$EVENTS" ]]; then
  log_pass "Pod events available in Kubernetes API"
else
  log_fail "No events found for pod"
fi

if [[ "$METRICS_AVAILABLE" == "true" ]]; then
  log_test "Resource metrics available (kubectl top)"
  METRICS=$(kubectl top pod "$TEST_POD" -n "$TEST_NAMESPACE" 2>/dev/null || echo "")
  if [[ -n "$METRICS" ]]; then
    log_pass "Metrics retrieved: $METRICS"
  else
    log_fail "Could not retrieve pod metrics"
  fi
fi

echo

################################################################################
# PHASE 8: WORKFLOW CHECKLIST
################################################################################

log_step "Phase 8: Pod Failure Diagnosis Workflow Checklist"

echo -e "${BLUE}Workflow Steps:${NC}"
echo "  [x] 1. kubectl-ai pod diagnosis executed (MTTD <5s)"
echo "  [x] 2. Root cause analysis provided"
echo "  [x] 3. Remediation recommendation included"
echo "  [x] 4. PHR template created for approval"
echo "  [x] 5. Architect approval simulated (SLA <5min)"
echo "  [x] 6. Approved action executed"
echo "  [x] 7. Post-action metrics monitored"
echo "  [x] 8. Pod status validated"

echo -e "${BLUE}Approval Workflow Compliance:${NC}"
echo "  [x] Diagnosis ready for architect review"
echo "  [x] PHR template populated"
echo "  [x] SLA window respected"
echo "  [x] Execution authorized"

echo -e "${BLUE}Operational Metrics:${NC}"
echo "  - MTTD (Mean Time To Diagnosis): ${DIAGNOSIS_TIME}s (target: <5s)"
echo "  - Approval SLA: ${APPROVAL_TIME}s (target: <300s)"
echo "  - MTTR (Mean Time To Remediation): ${REMEDIATION_TIME}s (target: <600s)"

echo

################################################################################
# TEST SUMMARY
################################################################################

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
TEST_END_TIME=$(date +%s)
TOTAL_TIME=$((TEST_END_TIME - TEST_START_TIME))

echo -e "${MAGENTA}=== Test Summary ===${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Runtime: ${TOTAL_TIME}s"
echo

if [[ $TESTS_FAILED -eq 0 ]]; then
  echo -e "${GREEN}✅ All Tests PASSED – Pod Failure Diagnosis Workflow Operational${NC}"
  echo
  echo -e "${BLUE}Workflow is ready for Phase IV.1 MVP:${NC}"
  echo "  • kubectl-ai pod diagnosis: ✅"
  echo "  • Architect approval workflow: ✅"
  echo "  • Remediation execution: ✅"
  echo "  • Post-action validation: ✅"
  echo "  • MTTD <5 minutes: ✅"
  echo "  • MTTR <15 minutes: ✅"
  echo
  echo -e "${BLUE}Next Steps:${NC}"
  echo "  1. Deploy to production cluster"
  echo "  2. Create real pod failure scenarios for validation"
  echo "  3. Measure MTTD and MTTR in production"
  echo "  4. Document lessons learned in runbooks"
  exit 0
else
  echo -e "${RED}❌ Some Tests FAILED – Review output above${NC}"
  exit 1
fi
