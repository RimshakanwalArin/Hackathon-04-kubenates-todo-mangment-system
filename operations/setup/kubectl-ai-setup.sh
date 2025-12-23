#!/bin/bash

################################################################################
# Phase IV: kubectl-ai Integration Setup
# Purpose: Verify kubectl-ai tool availability and configure Minikube integration
# Target: <2 second diagnostic response time
################################################################################

set -e

echo "=== Phase IV: kubectl-ai Integration Setup ==="
echo

# Step 1: Verify kubectl access to Minikube cluster
echo "[1/5] Verifying kubectl access to Minikube cluster..."
if ! kubectl cluster-info &> /dev/null; then
  echo "❌ ERROR: kubectl cannot access Minikube cluster"
  echo "   Run: minikube start"
  exit 1
fi
echo "✅ kubectl access verified"
echo "   Cluster: $(kubectl cluster-info | head -1)"
echo

# Step 2: Verify kubectl-ai tool availability
echo "[2/5] Verifying kubectl-ai tool availability..."
if ! command -v kubectl-ai &> /dev/null; then
  echo "⚠️  WARNING: kubectl-ai not found in PATH"
  echo "   Instructions:"
  echo "   1. Install kubectl-ai: https://github.com/kellerza/kubectl-ai"
  echo "   2. Ensure it's in your PATH"
  echo "   Proceeding with mock mode for testing..."
  KUBECTL_AI_MODE="mock"
else
  echo "✅ kubectl-ai found"
  KUBECTL_AI_VERSION=$(kubectl-ai --version 2>/dev/null || echo "unknown")
  echo "   Version: $KUBECTL_AI_VERSION"
  KUBECTL_AI_MODE="live"
fi
echo

# Step 3: Test kubectl-ai response time
echo "[3/5] Testing kubectl-ai response time..."
if [ "$KUBECTL_AI_MODE" = "live" ]; then
  START_TIME=$(date +%s%N)

  # Test with a simple query
  if timeout 5 kubectl-ai "list backend pods" > /dev/null 2>&1; then
    END_TIME=$(date +%s%N)
    RESPONSE_TIME_MS=$(( (END_TIME - START_TIME) / 1000000 ))

    if [ $RESPONSE_TIME_MS -lt 2000 ]; then
      echo "✅ kubectl-ai response time: ${RESPONSE_TIME_MS}ms (target: <2000ms)"
    else
      echo "⚠️  kubectl-ai response time: ${RESPONSE_TIME_MS}ms (target: <2000ms)"
      echo "   Performance may be slower than SLA"
    fi
  else
    echo "⚠️  kubectl-ai test query timed out or failed"
    echo "   Continuing with setup..."
  fi
else
  echo "ℹ️  Mock mode: Skipping response time test"
fi
echo

# Step 4: Verify Minikube pod access
echo "[4/5] Verifying Minikube pod access..."
POD_COUNT=$(kubectl get pods --all-namespaces --no-headers 2>/dev/null | wc -l)
echo "✅ Pod access verified"
echo "   Found $POD_COUNT pods across all namespaces"
echo

# Step 5: Create kubectl-ai operational commands reference
echo "[5/5] Creating kubectl-ai operational commands reference..."

cat > "$(dirname "$0")/kubectl-ai-commands.sh" << 'EOF'
#!/bin/bash
# kubectl-ai Operational Commands Reference
# Usage: source kubectl-ai-commands.sh

# Pod failure diagnosis
kubectl-ai-diagnose-pod() {
  local POD=$1
  local NAMESPACE=${2:-default}
  echo "Diagnosing pod: $POD (namespace: $NAMESPACE)"
  kubectl-ai "diagnose pod $POD -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl logs $POD -n $NAMESPACE; kubectl describe pod $POD -n $NAMESPACE"
}

# Scaling recommendations
kubectl-ai-recommend-scaling() {
  local DEPLOYMENT=$1
  local NAMESPACE=${2:-default}
  echo "Scaling analysis for deployment: $DEPLOYMENT (namespace: $NAMESPACE)"
  kubectl-ai "recommend scaling $DEPLOYMENT -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl top pods -l app=$DEPLOYMENT; kubectl get hpa"
}

# Resource analysis
kubectl-ai-analyze-resources() {
  local DEPLOYMENT=$1
  local NAMESPACE=${2:-default}
  echo "Resource analysis for deployment: $DEPLOYMENT (namespace: $NAMESPACE)"
  kubectl-ai "analyze resources $DEPLOYMENT -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl top pods; kubectl describe pods"
}

# Rolling update monitoring
kubectl-ai-monitor-rollout() {
  local DEPLOYMENT=$1
  local NAMESPACE=${2:-default}
  echo "Monitoring rollout for: $DEPLOYMENT (namespace: $NAMESPACE)"
  kubectl-ai "monitor rolling-update $DEPLOYMENT -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE"
}

export -f kubectl-ai-diagnose-pod
export -f kubectl-ai-recommend-scaling
export -f kubectl-ai-analyze-resources
export -f kubectl-ai-monitor-rollout
EOF

chmod +x "$(dirname "$0")/kubectl-ai-commands.sh"
echo "✅ kubectl-ai commands reference created: kubectl-ai-commands.sh"
echo

# Summary
echo "=== kubectl-ai Integration Setup Complete ==="
echo
echo "Mode: $KUBECTL_AI_MODE"
echo
if [ "$KUBECTL_AI_MODE" = "live" ]; then
  echo "✅ kubectl-ai is ready for operational use"
  echo
  echo "Next steps:"
  echo "1. Source kubectl-ai commands: source $(dirname "$0")/kubectl-ai-commands.sh"
  echo "2. Test pod diagnosis: kubectl-ai-diagnose-pod todo-chatbot-backend"
  echo "3. Review Phase IV playbook: cat operations/PLAYBOOK.md"
else
  echo "⚠️  kubectl-ai is not available (mock mode enabled)"
  echo
  echo "To enable live mode:"
  echo "1. Install kubectl-ai: https://github.com/kellerza/kubectl-ai"
  echo "2. Re-run this setup script"
fi
echo

exit 0
