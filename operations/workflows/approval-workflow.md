# Phase IV Approval Workflow – SLA Definitions & Procedures

**Version**: 1.0.0
**Date**: 2025-12-23
**Purpose**: Define approval gates and SLA windows for operational changes

---

## Approval Tiers & SLA Windows

### Tier 1: Trivial (No Approval Required)

**Operations**:
- Single pod restart (informational)
- kubectl top metrics collection
- Log viewing commands

**Approval Required**: ❌ No
**SLA Window**: N/A
**Documentation**: Logged in kubectl-ai output only

**Example**:
```bash
kubectl rollout restart deployment/todo-chatbot-backend
# No PHR required; kubectl logs sufficient
```

---

### Tier 2: Low-Risk (Architect Review, 5-Minute Window)

**Operations**:
- Manual scaling 1-2 replicas
- Pod restart for remediation
- ConfigMap value updates (non-critical)

**Approval Required**: ✅ Architect review
**SLA Window**: 5 minutes
**Documentation**: PHR with timestamp
**Rollback**: <2 minutes (revert ConfigMap or pod replica count)

**Approval Workflow**:
```
1. kubectl-ai generates recommendation
2. Architect reviews output
3. Architect creates PHR with approval:
   - Decision: approve/reject
   - Timestamp: [ISO-8601]
   - Justification: [brief reason]
4. Action executed immediately
5. Post-action metrics monitored for 1 hour
```

**Example PHR**:
```yaml
---
id: 001
title: Scale Backend from 1 to 2 Replicas
stage: phase-iv-operational
decision: approve
timestamp: 2025-12-24T14:30:00Z
justification: CPU utilization at 78% for 5 minutes; scaling maintains headroom
---

## Pre-Action Metrics
- Pod count: 1
- CPU utilization: 78%
- Error rate: 0.5%

## Post-Action Validation (5 min)
- Pod count: 2 (✅ target reached)
- CPU utilization: 45% (✅ normalized)
- Error rate: 0.3% (✅ stable)
```

---

### Tier 3: Medium-Risk (Architect Approval, 30-Minute Window)

**Operations**:
- Enable/configure HPA (Horizontal Pod Autoscaler)
- Update resource request/limit values
- Modify environment variables (config)
- Update Deployment images

**Approval Required**: ✅ Architect approval with validation
**SLA Window**: 30 minutes
**Pre-Validation**: Safety requirements verified
  - Resource changes: >30% safety margin preserved
  - HPA settings: Within cluster capacity
  - Config changes: Reversible, tested on staging
**Documentation**: PHR with pre/post metrics and rollback plan
**Rollback**: <5 minutes (ConfigMap revert, rolling update rollback)

**Approval Workflow**:
```
1. AI tool generates recommendation (kwargs-ai or kubectl-ai)
2. Pre-validation: Safety margins, cluster capacity checked
3. Architect reviews recommendation with validation results
4. Architect creates PHR with approval:
   - Decision: approve/reject with conditions
   - Timestamp: [ISO-8601]
   - Justification: [detailed reasoning]
   - Safety margins verified
5. Action executed (rolling update, ConfigMap update)
6. Post-action metrics monitored for 1 hour
7. Rollback plan available if issues detected
```

**Example PHR**:
```yaml
---
id: 002
title: Update Backend Resource Limits
stage: phase-iv-operational
decision: approve
timestamp: 2025-12-24T15:00:00Z
justification: 7-day analysis shows p95 usage of 180m CPU, 120Mi memory. New limits with 30% margin preserve safety.
---

## Pre-Action Metrics
- Current limits: 500m CPU, 512Mi memory
- p95 usage: 180m CPU, 120Mi memory
- Safety margin: 30%

## Recommendation
- New limits: 250m CPU, 150Mi memory (1.4x p95)
- Cost savings: $12/month (10% reduction)

## Post-Action Validation (1 hour)
- Pod restarts: 0 (✅ stable)
- CPU utilization: 140m avg, 195m peak (✅ within limits)
- Memory utilization: 90Mi avg, 118Mi peak (✅ within limits)
```

---

### Tier 4: Critical (Architect Approval + Security Review, 60-120 Minute Window)

**Operations**:
- Secrets rotation or update
- Namespace-level changes
- RBAC modifications
- Network policy changes
- Infrastructure changes (storage, nodes)

**Approval Required**: ✅ Architect + Security review (2-person rule)
**SLA Window**: 60-120 minutes
**Pre-Validation**: Security implications assessed
**Documentation**: PHR with detailed rationale, 2 approvals, rollback plan
**Rollback**: Complex, requires manual intervention

**Approval Workflow**:
```
1. AI tool identifies critical change need
2. Security assessment performed (vulnerability, RBAC, network impacts)
3. Architect reviews with security implications
4. Architect creates PHR for initial approval
5. Security reviewer validates and approves
6. Two PHRs required: architect + security
7. Action executed with close monitoring
8. Post-action compliance verification
```

**Example PHR (Architect)**:
```yaml
---
id: 003
title: Rotate Backend Database Secrets
stage: phase-iv-operational
decision: approve (pending security review)
timestamp: 2025-12-24T16:00:00Z
justification: Secrets rotated per policy after 90 days. New secrets generated from vault.
security_review_required: true
---

## Change Details
- Affected: Database connection credentials
- Impact: Backend pods restart with new secrets
- Rollback: Restore previous secrets from vault

## Post-Action Validation
- Pods restart successfully
- Database connections operational
- No connection errors in logs
```

**Example PHR (Security)**:
```yaml
---
id: 003-security
title: Security Review - Rotate Backend Database Secrets
stage: phase-iv-operational
decision: approved
timestamp: 2025-12-24T16:15:00Z
justification: Secrets properly rotated from HashiCorp Vault. No unauthorized access detected. RBAC audit complete.
---

## Security Assessment
- Vault audit trail: ✅ verified
- Old secrets revoked: ✅ confirmed
- New credentials transmitted securely: ✅ verified
- Access logs reviewed: ✅ no anomalies
```

---

## Escalation Procedures

### If Architect Unavailable for Approval

**Escalation Path**:
1. Check escalation contact list
2. Contact secondary approver (if defined)
3. For emergencies: Proceed with manual fallback procedures
4. Document escalation in PHR with timestamp and reason

**Emergency Procedures** (Critical issues only):
- Pod failure critical: Manual kubectl restart without waiting for approval
- Cluster degradation: Scale manually if necessary
- Security incident: Execute containment procedures immediately
- Always follow up with PHR documentation within 1 hour

### If SLA Window Exceeded

**Escalation Actions**:
1. Alert architect via escalation channel
2. For >30 min delay: Architect escalates to manager
3. For >120 min delay: Fallback to manual procedures
4. Document escalation reason in PHR

---

## PHR Template Format

All PHRs stored in `history/prompts/004-phase-iv-aiops/` with format:

```yaml
---
id: [sequential number]
title: [operation title, 3-7 words]
stage: phase-iv-operational
date: [ISO-8601 date]
feature: 004-phase-iv-aiops
command: /sp.implement (or manual operation)
labels: ["kubectl-ai", "operational", "approval", "tier-2" | "tier-3" | "tier-4"]
links:
  spec: specs/004-phase-iv-aiops/spec.md
  ticket: null (if applicable)
  adr: null (if applicable)
  pr: null (if applicable)
files:
  - [modified files: deployments, configmaps, etc.]
tests:
  - [pre/post metrics validation]
---

## AI Recommendation

[kubectl-ai or kagent output]

## Pre-Action Metrics

- Pod count: [current]
- CPU utilization: [per-pod averages]
- Memory utilization: [per-pod averages]
- Error rate: [percentage]
- Latency p95: [milliseconds]

## Architect Decision

- **Decision**: approve / reject / conditional
- **Timestamp**: [ISO-8601]
- **Justification**: [detailed reasoning]
- **Safety validation**: [margins, capacity checks, etc.]

## Post-Action Validation

### 5-Minute Check
- Pod status: [ready count reached target?]
- Error rate trending: [down?]

### 15-Minute Check
- Latency normalized: [yes/no]
- Resource utilization stable: [yes/no]

### 1-Hour Check
- No CrashLoopBackOff events: [yes/no]
- No OOMKilled events: [yes/no]
- Overall stability: [pass/fail]

## Rollback Plan

[Procedure to undo change, expected duration]

## Outcome

- **Status**: success / partial / failed
- **Action taken**: [brief summary]
- **Issues encountered**: [if any]
- **Follow-up needed**: [yes/no, specify]
```

---

## Compliance & Audit

### Monthly Audit Checklist

- [ ] All Tier 3+ operations have PHR records
- [ ] All PHRs have architect approval timestamps
- [ ] All critical operations have 2-person approval (Tier 4)
- [ ] All approvals within SLA windows
- [ ] All rollback procedures documented
- [ ] Zero unapproved operations applied to cluster

### Reporting

Generate monthly report:
```bash
# Count operations by tier
grep -r "labels:.*tier-" history/prompts/004-phase-iv-aiops/ | wc -l

# Verify SLA compliance
grep -r "approval_sla_met" history/prompts/004-phase-iv-aiops/ | grep "true" | wc -l

# Identify escalations
grep -r "escalation:" history/prompts/004-phase-iv-aiops/ | wc -l
```

---

**Established**: 2025-12-23
**Status**: ✅ Approval workflow operationalized
