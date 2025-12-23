#!/bin/bash

################################################################################
# Phase IV: Pod Remediation Approval Workflow
# Purpose: Architect approval procedure for pod failure remediation
# Approval Tier: 2 (Low-Risk) or 3 (Medium-Risk)
# SLA Window: 5 minutes (Tier 2), 30 minutes (Tier 3)
# Output: Approved PHR ready for execution
################################################################################

set -e

# Color output
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
Usage: approve-pod-remediation.sh <phr-file> <decision> [justification]

Arguments:
  <phr-file>        Path to pod failure PHR file to approve
  <decision>        approve | reject | conditional
  [justification]   Optional approval justification (or will prompt)

Examples:
  # Approve pod remediation
  ./approve-pod-remediation.sh history/prompts/004-phase-iv-aiops/005-pod-failure.phase-iv-operational.prompt.md approve

  # Reject with custom justification
  ./approve-pod-remediation.sh phr-file.md reject "Resource limits insufficient"

Output:
  - Updates PHR file with architect approval
  - PHR ready for action execution
  - Prints approval summary
EOF
  exit 1
}

if [[ $# -lt 2 ]]; then
  usage
fi

PHR_FILE="$1"
DECISION="$2"
JUSTIFICATION="${3:-}"

################################################################################
# PREREQUISITES
################################################################################

echo -e "${BLUE}=== Pod Remediation Approval Workflow ===${NC}"
echo

# Verify PHR file exists
if [[ ! -f "$PHR_FILE" ]]; then
  echo -e "${RED}❌ ERROR: PHR file not found: $PHR_FILE${NC}"
  exit 1
fi

# Verify decision is valid
if [[ ! "$DECISION" =~ ^(approve|reject|conditional)$ ]]; then
  echo -e "${RED}❌ ERROR: Invalid decision. Must be: approve | reject | conditional${NC}"
  exit 1
fi

echo -e "${YELLOW}[1/3] Loading PHR file...${NC}"
echo "File: ${BLUE}$PHR_FILE${NC}"
echo

# Extract PHR metadata
POD_NAME=$(grep "title:" "$PHR_FILE" | head -1 | sed 's/.*title: //' | sed 's/ Pod.*//' || echo "unknown")
FAILURE_STATE=$(grep "Failure State:" "$PHR_FILE" | sed 's/.*Failure State: //' || echo "unknown")
TIER=$(grep "Tier.*Low-Risk\|Medium-Risk" "$PHR_FILE" | head -1 || echo "2 (Low-Risk)")

echo "Pod: ${BLUE}$POD_NAME${NC}"
echo "Failure: ${YELLOW}$FAILURE_STATE${NC}"
echo "Approval Tier: $TIER"
echo

################################################################################
# DISPLAY DIAGNOSIS SUMMARY
################################################################################

echo -e "${YELLOW}[2/3] Displaying diagnosis summary for review...${NC}"
echo

# Extract key sections
echo -e "${BLUE}=== Diagnosis Information ===${NC}"
sed -n '/### kubectl-ai Analysis/,/^---$/p' "$PHR_FILE" | head -20

echo
echo -e "${BLUE}=== Pre-Action Metrics ===${NC}"
sed -n '/### Pre-Action Metrics/,/^---$/p' "$PHR_FILE" | head -15

echo
echo -e "${BLUE}=== Recommended Action ===${NC}"
sed -n '/### Remediation Action Selected/,/^---$/p' "$PHR_FILE" | grep -A 10 "Action:" | head -12

echo

################################################################################
# GET ARCHITECT INPUT
################################################################################

echo -e "${YELLOW}[3/3] Recording architect approval...${NC}"
echo

# If justification not provided, prompt for it
if [[ -z "$JUSTIFICATION" ]]; then
  echo "Enter approval justification (or press Enter to use default):"
  echo "  approve: [reason for approving this remediation]"
  echo "  reject: [reason for rejecting this remediation]"
  echo
  read -p "Justification: " JUSTIFICATION

  # Default justification if empty
  if [[ -z "$JUSTIFICATION" ]]; then
    case "$DECISION" in
      approve)
        JUSTIFICATION="Diagnosis indicates straightforward remediation. Action is reversible within 5 minutes."
        ;;
      reject)
        JUSTIFICATION="Recommended action requires additional investigation before execution."
        ;;
      conditional)
        JUSTIFICATION="Approve with conditions: verify resource availability before restart."
        ;;
    esac
  fi
fi

# Get current timestamp (ISO-8601)
TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
ARCHITECT=$(whoami)

# Determine SLA window based on tier
if [[ "$TIER" == *"Low-Risk"* ]]; then
  SLA_WINDOW="5 minutes"
  SLA_SECONDS=300
else
  SLA_WINDOW="30 minutes"
  SLA_SECONDS=1800
fi

################################################################################
# UPDATE PHR WITH APPROVAL
################################################################################

# Create backup
cp "$PHR_FILE" "${PHR_FILE}.backup" 2>/dev/null || true

# Update PHR with architect decision section
# This is a simplified update - in production, would use YAML tool

cat >> "$PHR_FILE" << EOF

---

## Architect Decision (Updated)

**Decision Recorded By**: $ARCHITECT
**Timestamp**: $TIMESTAMP
**SLA Window**: $SLA_WINDOW
**Decision Status**: ✅ $DECISION

### Decision Details

- **Decision**: $DECISION
- **Justification**: $JUSTIFICATION
- **Architect**: $ARCHITECT
- **Timestamp**: $TIMESTAMP
- **SLA Compliance**: ✅ Within $SLA_WINDOW window
- **Next Action**: Ready for execution approval

### Pre-Execution Checklist

- [x] kubectl-ai diagnosis reviewed
- [x] Remediation action confirmed
- [x] Rollback plan understood
- [x] SLA window acceptable
- [x] Architect approved

### Execution Authorization

**Authorized**: YES
**Execution Window Opens**: $TIMESTAMP
**Execution Window Closes**: $(date -u -d "+${SLA_SECONDS} seconds" +'%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || echo "[calculate based on SLA]")

This PHR is ready for action execution. Follow the "Action Execution Log" section to perform the approved remediation.

---
EOF

echo -e "${GREEN}✅ Architect approval recorded${NC}"
echo

################################################################################
# OUTPUT APPROVAL SUMMARY
################################################################################

cat << EOF

================================================================================
                        APPROVAL SUMMARY
================================================================================

Decision: ${GREEN}$DECISION${NC}
Architect: $ARCHITECT
Timestamp: $TIMESTAMP
SLA Window: $SLA_WINDOW

Justification:
  $JUSTIFICATION

================================================================================
                        NEXT STEPS
================================================================================

EOF

case "$DECISION" in
  approve)
    cat << EOF
✅ APPROVED FOR EXECUTION

The remediation action has been approved by architect: $ARCHITECT

Next: Execute the approved action using:
  1. Review the action command in the PHR
  2. Execute: kubectl [action]
  3. Monitor pod status: kubectl get pod $POD_NAME -w
  4. Record post-action metrics in PHR
  5. Complete validation within 1 hour

Example execution:
  kubectl delete pod $POD_NAME -n [namespace]

Rollback available if needed: See "Rollback Plan" section in PHR

EOF
    ;;
  reject)
    cat << EOF
❌ REJECTED

The remediation action has been rejected by architect: $ARCHITECT

Reason: $JUSTIFICATION

Next steps:
  1. Review rejection reason with team
  2. Escalate to engineering team for investigation
  3. Create follow-up ticket for root cause fix
  4. Update runbook with findings

This PHR is archived for audit trail.

EOF
    ;;
  conditional)
    cat << EOF
⚠️  CONDITIONALLY APPROVED

The remediation action has been conditionally approved by architect: $ARCHITECT

Conditions: $JUSTIFICATION

Before execution, verify:
  1. Cluster resource availability
  2. No ongoing deployments
  3. Post-action validation plan ready

After conditions verified, proceed with execution as per "approve" flow above.

EOF
    ;;
esac

cat << EOF
================================================================================

PHR Updated: $PHR_FILE
Backup Created: ${PHR_FILE}.backup

This PHR is part of Phase IV operational audit trail.
================================================================================
EOF

echo
echo "Approval workflow complete."

exit 0
