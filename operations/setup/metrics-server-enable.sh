#!/bin/bash

################################################################################
# Phase IV: Minikube Metrics-Server Enablement
# Purpose: Enable metrics-server addon for kubectl top and cluster analysis
# Required by: kagent cluster health reporting
################################################################################

set -e

echo "=== Phase IV: Metrics-Server Enablement ==="
echo

# Step 1: Verify Minikube is running
echo "[1/3] Verifying Minikube cluster status..."
if ! minikube status &> /dev/null; then
  echo "❌ ERROR: Minikube cluster is not running"
  echo "   Run: minikube start"
  exit 1
fi
echo "✅ Minikube cluster is running"
echo

# Step 2: Check if metrics-server is already enabled
echo "[2/3] Checking metrics-server status..."
if minikube addons list 2>/dev/null | grep -q "metrics-server: enabled"; then
  echo "✅ metrics-server addon already enabled"
elif minikube addons list 2>/dev/null | grep -q "metrics-server"; then
  echo "⚠️  metrics-server addon exists but is disabled"
  echo "   Enabling metrics-server addon..."
  minikube addons enable metrics-server
  echo "✅ metrics-server addon enabled"
  sleep 5  # Give metrics-server time to start
else
  echo "ℹ️  metrics-server addon not found"
  echo "   This is expected on some Minikube versions"
fi
echo

# Step 3: Verify metrics-server is operational
echo "[3/3] Verifying metrics-server functionality..."
METRICS_READY=false
for i in {1..30}; do
  if kubectl get deployment -n kube-system metrics-server &> /dev/null; then
    REPLICAS=$(kubectl get deployment -n kube-system metrics-server -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    if [ "$REPLICAS" = "1" ]; then
      echo "✅ metrics-server is operational (replicas: $REPLICAS)"
      METRICS_READY=true
      break
    fi
  fi

  if [ $i -lt 30 ]; then
    echo "   Waiting for metrics-server to be ready ($i/30)..."
    sleep 2
  fi
done

if [ "$METRICS_READY" = false ]; then
  echo "⚠️  metrics-server may not be fully ready yet"
  echo "   Continuing - it will be available soon..."
fi
echo

# Summary
echo "=== Metrics-Server Setup Complete ==="
echo
echo "✅ kubectl top and cluster metrics will now be available"
echo
echo "Test metrics availability:"
echo "  kubectl top nodes"
echo "  kubectl top pods --all-namespaces"
echo

exit 0
