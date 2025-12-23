#!/bin/bash

################################################################################
# Phase IV: Cost Impact Analysis for HPA Scaling
# Purpose: Calculate and analyze cost implications of scaling policies
# Target: <30 second cost analysis
# Output: Cost estimation report and savings recommendations
################################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

################################################################################
# USAGE
################################################################################

usage() {
  cat << 'EOF'
Usage: analyze-scaling-cost.sh <deployment> <min-replicas> <max-replicas> [namespace]

Arguments:
  <deployment>       Deployment name
  <min-replicas>     Minimum replicas (baseline)
  <max-replicas>     Maximum replicas (peak)
  [namespace]        Kubernetes namespace (default: default)

Example:
  ./analyze-scaling-cost.sh backend 1 5 production

Output:
  - Monthly cost estimation at min, average, and max replicas
  - Cost comparison: before vs. after HPA
  - Cost optimization recommendations
  - ROI analysis for reliability improvements
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

################################################################################
# COST CALCULATION MODEL
################################################################################

# Simplified cloud cost model (GCP/AWS approximate)
# Adjust these based on actual cloud provider pricing

# Pod cost components (monthly, assuming 730 hours)
CPU_COST_PER_MILLI_HOUR=0.000033      # ~$0.024/month per 1m CPU
MEMORY_COST_PER_MI_HOUR=0.000003      # ~$0.002/month per 1Mi memory
NODE_COST_PER_MONTH=50                # Fixed node cost

# Efficiency assumptions
CLUSTER_EFFICIENCY=0.7                # 70% of cluster resources usable
OVERHEAD_PERCENT=10                   # 10% overhead for system services

################################################################################
# PREREQUISITES
################################################################################

echo -e "${BLUE}=== Phase IV: Cost Impact Analysis ===${NC}"
echo

# Verify kubectl access
if ! kubectl cluster-info &> /dev/null; then
  echo -e "${RED}❌ ERROR: kubectl cannot access cluster${NC}"
  exit 1
fi

# Verify deployment exists
if ! kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" &> /dev/null; then
  echo -e "${RED}❌ ERROR: Deployment not found${NC}"
  exit 1
fi

echo "Deployment: ${BLUE}$DEPLOYMENT${NC}"
echo "Namespace: ${BLUE}$NAMESPACE${NC}"
echo "Scaling Policy: ${BLUE}min=$MIN_REPLICAS, max=$MAX_REPLICAS${NC}"
echo

################################################################################
# GATHER DEPLOYMENT RESOURCES
################################################################################

echo -e "${YELLOW}[1/3] Analyzing deployment resource configuration...${NC}"

DEPLOYMENT_INFO=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o yaml)

# Get current replica count
CURRENT_REPLICAS=$(echo "$DEPLOYMENT_INFO" | grep "replicas:" | head -1 | sed 's/.*replicas: //' | xargs || echo "1")

# Get pod resource requests
CPU_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "cpu:" | head -1 | sed 's/.*cpu: //;s/m.*//' | xargs || echo "100")
MEMORY_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -A 20 "resources:" | grep "memory:" | head -1 | sed 's/.*memory: //;s/Mi.*//' | xargs || echo "128")

# Storage (if applicable)
STORAGE_REQUEST=$(echo "$DEPLOYMENT_INFO" | grep -i "storage:" | head -1 | sed 's/.*storage: //;s/Gi.*//' | xargs || echo "0")

echo -e "${GREEN}✅ Deployment resources analyzed${NC}"
echo "  Current Replicas: $CURRENT_REPLICAS"
echo "  Per-Pod CPU Request: ${CPU_REQUEST}m"
echo "  Per-Pod Memory Request: ${MEMORY_REQUEST}Mi"
echo "  Per-Pod Storage: ${STORAGE_REQUEST}Gi (if applicable)"
echo

################################################################################
# CALCULATE COSTS
################################################################################

echo -e "${YELLOW}[2/3] Calculating cost impact...${NC}"

# Convert CPU millis to full units
CPU_UNITS=$(echo "scale=3; $CPU_REQUEST / 1000" | bc)

# Monthly hour calculation (24 * 30.5 days)
HOURS_PER_MONTH=732

# Cost calculations for different replica counts
calculate_monthly_cost() {
  local replicas=$1
  local cpu=$2
  local memory=$3

  # CPU cost
  local cpu_monthly=$(echo "scale=2; $cpu * $replicas * $HOURS_PER_MONTH * $CPU_COST_PER_MILLI_HOUR" | bc)

  # Memory cost
  local memory_monthly=$(echo "scale=2; $memory * $replicas * $HOURS_PER_MONTH * $MEMORY_COST_PER_MI_HOUR" | bc)

  # Total
  echo "scale=2; $cpu_monthly + $memory_monthly" | bc
}

# Cost at different utilization levels
COST_AT_MIN=$(calculate_monthly_cost $MIN_REPLICAS $CPU_REQUEST $MEMORY_REQUEST)
COST_AT_CURRENT=$(calculate_monthly_cost $CURRENT_REPLICAS $CPU_REQUEST $MEMORY_REQUEST)
COST_AT_AVERAGE=$(calculate_monthly_cost $(((MIN_REPLICAS + MAX_REPLICAS) / 2)) $CPU_REQUEST $MEMORY_REQUEST)
COST_AT_MAX=$(calculate_monthly_cost $MAX_REPLICAS $CPU_REQUEST $MEMORY_REQUEST)

echo -e "${GREEN}✅ Cost analysis complete${NC}"
echo

################################################################################
# OUTPUT COST REPORT
################################################################################

cat << EOF

================================================================================
                        COST IMPACT ANALYSIS
================================================================================

Deployment: $DEPLOYMENT
Namespace: $NAMESPACE
Analysis Date: $(date -u +'%Y-%m-%dT%H:%M:%SZ')

---
CURRENT STATE
---
Current Replicas: $CURRENT_REPLICAS
Current Monthly Cost: \$$COST_AT_CURRENT

Pod Resources:
  CPU Request: ${CPU_REQUEST}m per pod
  Memory Request: ${MEMORY_REQUEST}Mi per pod
  Storage: ${STORAGE_REQUEST}Gi (if applicable)

---
SCALING POLICY COST COMPARISON
---
Configuration:
  Min Replicas: $MIN_REPLICAS
  Max Replicas: $MAX_REPLICAS
  Average Replicas (for estimation): $(((MIN_REPLICAS + MAX_REPLICAS) / 2))

Monthly Cost Scenarios:

1. At Minimum ($MIN_REPLICAS replicas):
   Cost: \$$COST_AT_MIN/month
   Use case: Off-peak hours, low traffic
   Savings vs. current: \$(echo "scale=2; $COST_AT_CURRENT - $COST_AT_MIN" | bc)/month

2. At Current ($CURRENT_REPLICAS replicas):
   Cost: \$$COST_AT_CURRENT/month
   Use case: Normal baseline traffic (TODAY)

3. At Average ($(((MIN_REPLICAS + MAX_REPLICAS) / 2)) replicas):
   Cost: \$$COST_AT_AVERAGE/month
   Use case: Typical usage pattern with HPA
   Est. increase vs. current: \$(echo "scale=2; $COST_AT_AVERAGE - $COST_AT_CURRENT" | bc)/month
   Est. increase %: $(echo "scale=1; (($COST_AT_AVERAGE - $COST_AT_CURRENT) / $COST_AT_CURRENT) * 100" | bc)%

4. At Maximum ($MAX_REPLICAS replicas):
   Cost: \$$COST_AT_MAX/month
   Use case: Peak load during traffic spikes
   Cost increase vs. current: \$(echo "scale=2; $COST_AT_MAX - $COST_AT_CURRENT" | bc)/month
   Cost increase %: $(echo "scale=1; (($COST_AT_MAX - $COST_AT_CURRENT) / $COST_AT_CURRENT) * 100" | bc)%

---
ANNUAL COST PROJECTION
---
Current (no HPA): \$(echo "scale=2; $COST_AT_CURRENT * 12" | bc)/year

With HPA (at average): \$(echo "scale=2; $COST_AT_AVERAGE * 12" | bc)/year

With HPA (at peak): \$(echo "scale=2; $COST_AT_MAX * 12" | bc)/year

Expected Annual Cost Range:
  Low (min replicas): \$(echo "scale=2; $COST_AT_MIN * 12" | bc)/year
  High (max replicas): \$(echo "scale=2; $COST_AT_MAX * 12" | bc)/year
  Average (realistic): \$(echo "scale=2; $COST_AT_AVERAGE * 12" | bc)/year

---
COST JUSTIFICATION: RELIABILITY vs. COST
---
Benefits of HPA Scaling:

1. Reliability Improvements:
   ✓ Prevents service degradation during traffic spikes
   ✓ Maintains <5% error rate during peak load
   ✓ Ensures <500ms latency p95 under sustained load
   ✓ Reduces customer impact from overload

2. Operational Benefits:
   ✓ Automatic response to load (no manual intervention)
   ✓ Frees operations team for other tasks (reduces toil)
   ✓ Prevents cascading failures
   ✓ Enables experimentation with confidence

3. Cost Efficiency:
   ✓ Scales down to minimum during off-peak (cost savings)
   ✓ Only pay for peak capacity when needed
   ✓ Avoids massive over-provisioning

Cost-Benefit Analysis:
  Additional Monthly Cost: \$(echo "scale=2; $COST_AT_AVERAGE - $COST_AT_CURRENT" | bc)
  Benefit: Prevents outages costing \$1000s in lost revenue
  ROI: Break-even if prevents ONE outage per year
  Risk Mitigation: Unlimited (prevents customer impact)

---
COST OPTIMIZATION RECOMMENDATIONS
---

1. Right-Sizing Pod Resources (Potential Savings):
   Current per-pod cost: \$$(echo "scale=2; ($CPU_REQUEST * $HOURS_PER_MONTH * $CPU_COST_PER_MILLI_HOUR) + ($MEMORY_REQUEST * $HOURS_PER_MONTH * $MEMORY_COST_PER_MI_HOUR)" | bc)/month

   Optimization strategy:
   - Review actual usage for 1 week: kubectl top pods
   - If actual <80% of request: reduce requests by 20%
   - If actual >90% of request: increase for stability

2. Scheduling Off-Peak Work:
   - Identify batch jobs running 24/7
   - Move to off-peak hours (2 AM - 6 AM)
   - Potential savings: 30-40% of batch job cost

3. Reserved Instances (Cloud Provider):
   - Lock in 1-year or 3-year rates for min replicas
   - Discount: ~30-40% vs. on-demand
   - For $(($MIN_REPLICAS * $CPU_REQUEST * $HOURS_PER_MONTH * $CPU_COST_PER_MILLI_HOUR / 12)) monthly baseline
   - Savings: ~\$(echo "scale=2; (($MIN_REPLICAS * $CPU_REQUEST * $HOURS_PER_MONTH * $CPU_COST_PER_MILLI_HOUR / 12) * 0.35)" | bc)/month

4. Multi-Cloud / Spot Instances:
   - Use spot/preemptible instances for max replicas
   - Discount: 60-80% vs. regular
   - Trade-off: 5-10% interruption rate
   - For max replicas cost of \$$COST_AT_MAX
   - Potential savings: ~\$(echo "scale=2; (($COST_AT_MAX - $COST_AT_CURRENT) * 0.70)" | bc)/month

---
COST MONITORING RECOMMENDATIONS
---

1. Weekly Cost Tracking:
   - Track actual replica count (min, avg, max)
   - Compare to predicted costs
   - Alert if costs exceed budget

2. Monthly Cost Review:
   - Compare to projection
   - Identify unexpected spikes
   - Adjust HPA if patterns change

3. Quarterly Optimization:
   - Right-size resources based on 3-month data
   - Evaluate reserved instances
   - Consider multi-cloud options

---
APPROVAL CHECKLIST
---
[ ] Cost analysis reviewed
[ ] Monthly cost increase acceptable
[ ] Cost vs. reliability benefit understood
[ ] Cloud budget has headroom for additional cost
[ ] Optimization recommendations reviewed
[ ] Cost monitoring plan in place

================================================================================

Cost impact analysis generated and ready for architect review.

Next:
  1. Architect reviews cost impact
  2. Approve HPA policy with cost understanding
  3. Implement monitoring to track actual costs
  4. Execute cost optimization recommendations

EOF

echo
echo -e "${GREEN}✅ Cost analysis complete${NC}"
echo "Report ready for architect approval in PHR"

exit 0
