#!/bin/bash

################################################################################
# Phase IV: kagent Integration Setup
# Purpose: Verify kagent tool availability and configure cluster analysis
# Target: <30 second report generation
################################################################################

set -e

echo "=== Phase IV: kagent Integration Setup ==="
echo

# Step 1: Verify kubectl access to Minikube cluster
echo "[1/4] Verifying kubectl access to Minikube cluster..."
if ! kubectl cluster-info &> /dev/null; then
  echo "❌ ERROR: kubectl cannot access Minikube cluster"
  echo "   Run: minikube start"
  exit 1
fi
echo "✅ kubectl access verified"
echo

# Step 2: Verify kagent tool availability
echo "[2/4] Verifying kagent tool availability..."
if ! command -v kagent &> /dev/null; then
  echo "⚠️  WARNING: kagent not found in PATH"
  echo "   Instructions:"
  echo "   1. Install kagent: https://github.com/kellerza/kagent"
  echo "   2. Ensure it's in your PATH"
  echo "   Proceeding with mock mode for testing..."
  KAGENT_MODE="mock"
else
  echo "✅ kagent found"
  KAGENT_VERSION=$(kagent --version 2>/dev/null || echo "unknown")
  echo "   Version: $KAGENT_VERSION"
  KAGENT_MODE="live"
fi
echo

# Step 3: Verify Minikube pod and node access
echo "[3/4] Verifying Minikube pod and node access..."
NODE_COUNT=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
POD_COUNT=$(kubectl get pods --all-namespaces --no-headers 2>/dev/null | wc -l)
echo "✅ Cluster access verified"
echo "   Nodes: $NODE_COUNT"
echo "   Pods: $POD_COUNT"
echo

# Step 4: Create kagent operational commands reference
echo "[4/4] Creating kagent operational commands reference..."

cat > "$(dirname "$0")/kagent-commands.sh" << 'EOF'
#!/bin/bash
# kagent Operational Commands Reference
# Usage: source kagent-commands.sh

# Cluster health analysis
kagent-cluster-health() {
  local NAMESPACE=${1:-default}
  echo "Analyzing cluster health (namespace: $NAMESPACE)..."
  kagent "analyze cluster health -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl top nodes; kubectl get pods; kubectl get svc"
}

# Resource utilization analysis
kagent-resource-utilization() {
  local NAMESPACE=${1:-default}
  echo "Analyzing resource utilization (namespace: $NAMESPACE)..."
  kagent "analyze resource-utilization -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl top pods; kubectl describe nodes"
}

# Security posture assessment
kagent-security-posture() {
  local NAMESPACE=${1:-default}
  echo "Analyzing security posture (namespace: $NAMESPACE)..."
  kagent "analyze security-posture -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl get pods -o yaml | grep -i security"
}

# Scaling strategy recommendation
kagent-recommend-scaling() {
  local DEPLOYMENT=$1
  local NAMESPACE=${2:-default}
  echo "Recommending scaling strategy for: $DEPLOYMENT (namespace: $NAMESPACE)..."
  kagent "recommend scaling-strategy $DEPLOYMENT -n $NAMESPACE" 2>/dev/null || \
    echo "Manual fallback: kubectl top pods -l app=$DEPLOYMENT; kubectl get hpa"
}

export -f kagent-cluster-health
export -f kagent-resource-utilization
export -f kagent-security-posture
export -f kagent-recommend-scaling
EOF

chmod +x "$(dirname "$0")/kagent-commands.sh"
echo "✅ kagent commands reference created: kagent-commands.sh"
echo

# Summary
echo "=== kagent Integration Setup Complete ==="
echo
echo "Mode: $KAGENT_MODE"
echo
if [ "$KAGENT_MODE" = "live" ]; then
  echo "✅ kagent is ready for operational use"
  echo
  echo "Next steps:"
  echo "1. Source kagent commands: source $(dirname "$0")/kagent-commands.sh"
  echo "2. Test cluster health: kagent-cluster-health"
  echo "3. Review Phase IV playbook: cat operations/PLAYBOOK.md"
else
  echo "⚠️  kagent is not available (mock mode enabled)"
  echo
  echo "To enable live mode:"
  echo "1. Install kagent: https://github.com/kellerza/kagent"
  echo "2. Re-run this setup script"
fi
echo

exit 0
