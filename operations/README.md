# Phase IV Operations Framework – AIOps & Intelligent Kubernetes Operations

**Version**: 1.0.0
**Date**: 2025-12-23
**Purpose**: AI-assisted operational excellence for Todo Chatbot cluster

---

## Overview

Phase IV Operations implements intelligent Kubernetes operations using kubectl-ai (diagnostics) and kagent (analytics). This framework enables:

- **Pod Failure Diagnosis** (<2 second response time)
- **Proactive Scaling** (data-driven HPA recommendations)
- **Resource Optimization** (7-day usage analysis)
- **Cluster Health Reporting** (weekly automated reports)
- **Security Posture Audits** (weekly vulnerability assessments)
- **Operational Runbooks** (auto-generated from AI analysis)

All operations are human-centered, reversible within 5 minutes, and 100% auditable via Prompt History Records (PHRs).

---

## Directory Structure

```
operations/
├── README.md                          # This file
├── PLAYBOOK.md                        # Comprehensive operational playbook
├── TRAINING.md                        # Architect training guide
├── workflows/                         # Operational workflows
│   ├── kubectl-ai-diagnose-pod.sh     # Pod failure diagnosis
│   ├── kubectl-ai-validate-scaling.sh # Scaling validation
│   ├── kagent-recommend-scaling.sh    # Scaling recommendations
│   ├── kagent-analyze-usage.sh        # Resource usage analysis
│   ├── kagent-cluster-health.sh       # Weekly health reports
│   ├── kagent-security-audit.sh       # Weekly security assessments
│   ├── approval-workflow.md           # Approval SLA definitions
│   └── phr-*.md                       # PHR templates
├── runbooks/                          # Operational runbooks
│   ├── troubleshoot-crashloopbackoff.md
│   ├── troubleshoot-oomkilled.md
│   ├── scaling-decision-runbook.md
│   ├── resource-optimization-runbook.md
│   ├── rolling-update-failures.md
│   └── security-remediation-runbook.md
├── setup/                             # Setup scripts
│   ├── kubectl-ai-setup.sh            # kubectl-ai integration
│   ├── kagent-setup.sh                # kagent configuration
│   └── metrics-server-enable.sh       # Minikube metrics-server
├── cron/                              # Scheduled jobs
│   ├── health-report-cron.sh          # Weekly cluster health (Mondays 00:00 UTC)
│   └── security-audit-cron.sh         # Weekly security audit (Fridays 00:00 UTC)
├── tests/                             # Operational tests
│   ├── test-pod-failure-diagnosis.sh  # US1 end-to-end test
│   ├── test-proactive-scaling.sh      # US2 end-to-end test
│   ├── test-resource-optimization.sh  # US3 end-to-end test
│   └── test-phr-compliance.sh         # PHR audit
└── fallback/                          # Manual procedures
    ├── manual-kubectl-procedures.md   # kubectl-ai fallback
    └── manual-analysis-procedures.md  # kagent fallback
```

---

## Quick Start

### Phase IV.1 MVP (4-6 hours)

Demonstrates kubectl-ai pod failure diagnosis with architect approval workflow.

```bash
# 1. Setup
cd operations/setup
./kubectl-ai-setup.sh
./metrics-server-enable.sh

# 2. Create pod failure diagnosis workflow
cd ../workflows
source kubectl-ai-diagnose-pod.sh

# 3. Test end-to-end
cd ../tests
./test-pod-failure-diagnosis.sh

# 4. Review operational playbook
cat ../PLAYBOOK.md
```

### Full Phase IV (10-12 hours)

Adds kagent analytics pipeline, scaling recommendations, health reporting, security audits.

```bash
# 1. Complete Phase IV.1 MVP
# (same as above)

# 2. Setup kagent analytics
cd operations/setup
./kagent-setup.sh

# 3. Configure scaling recommendations
cd ../workflows
source kagent-recommend-scaling.sh

# 4. Configure health reporting and security audits
./kagent-cluster-health.sh
./kagent-security-audit.sh

# 5. Setup cron jobs
cd ../cron
crontab health-report-cron.sh
crontab security-audit-cron.sh
```

---

## Operational Principles

### Human-in-the-Loop Approval

All operational changes require architect review and approval **before execution**:

| Risk Tier | Operations | Approval | Window | Rollback |
|-----------|-----------|----------|--------|----------|
| Trivial | Pod restart (1x) | None | N/A | Re-trigger |
| Low | Manual scaling 1-2 replicas | Review | 5 min | Revert |
| Medium | HPA enable, resource changes | Approval | 30 min | Revert |
| Critical | Secrets, namespace changes | Approval + security | 60-120 min | Rollback |

### Reversibility Mandate

All Phase IV operations must be **reversible within 5 minutes**:
- ConfigMap changes: Instant rollback (no pod restart)
- Deployment changes: Rolling update rollback (≤5 min)
- HPA policies: Instant disable + manual scaling revert
- All data preserved; no loss from operational changes

### 100% Auditability

Every operational decision documented in PHRs with:
1. **AI Recommendation**: kubectl-ai or kagent output
2. **Architect Approval**: Timestamp, decision, justification
3. **Pre/Post Metrics**: Baseline → outcome comparison
4. **Rollback Plan**: Reversal procedure (if applicable)

---

## Phase IV Workflows

### US1: Pod Failure Diagnosis

**Trigger**: Pod enters CrashLoopBackOff, OOMKilled, or manual query
**Workflow**:
1. kubectl-ai analyzes logs, events, restart history (<2s)
2. Recommendation includes root cause, fix, expected outcome
3. Architect reviews and approves in PHR
4. Remediation action executed (restart, config change, scale)
5. Metrics monitored for 1 hour; outcome documented

**SLA**: Diagnosis <2s, Architect approval <5 min, Remediation <15 min

### US2: Proactive Scaling

**Trigger**: CPU >70% for 5+ min, or <20% for 15+ min
**Workflow**:
1. kagent analyzes current load, recommends HPA policy
2. kubectl-ai validates recommendation against cluster capacity
3. Architect approves scaling policy in PHR
4. HPA enabled; metrics monitored for 1 hour
5. Replica count changes verified; cost impact documented

**SLA**: Recommendation <10s, Architect approval <30 min, Scaling <5 min

### US3: Resource Optimization

**Trigger**: Pod stable 7+ days
**Workflow**:
1. kagent analyzes 7-day usage (p50, p95, p99)
2. Recommends CPU/memory limits with >30% safety margin
3. Architect approves new limits in PHR
4. Deployment rolling update applies limits
5. Pod stability verified (0 restarts); savings documented

**SLA**: Analysis <10s, Architect approval <30 min, Deployment <5 min

### US4: Rolling Update Monitoring

**Trigger**: Helm upgrade or Deployment patch initiated
**Workflow**:
1. kubectl-ai monitors first 3 replicas for 2 minutes
2. Tracks error rate; halts if >5%, continues if <5%
3. Architect reviews halt/continue decision
4. Outcome recorded in PHR

**SLA**: Monitoring real-time, Architect review <30 min

### US5: Cluster Health Reporting

**Trigger**: Weekly (Mondays 00:00 UTC)
**Workflow**:
1. kagent generates weekly cluster health analysis
2. Reports: pod status, node health, latency, error rates
3. Recommendations: scaling, resource adjustment, fixes
4. Critical findings flagged; non-critical archived
5. Architect reviews and approves recommendations

**Report Contents**: Pod summary, node health, latency percentiles, error rates, recommendations

### US6: Security Posture Audit

**Trigger**: Weekly (Fridays 00:00 UTC)
**Workflow**:
1. kagent audits image vulnerabilities, RBAC, network policies, secrets
2. Vulnerabilities ranked by severity
3. Remediation recommendations provided
4. Critical findings escalated to architect
5. Architect approves and executes remediation

**Assessment Coverage**: Images, RBAC, network policies, secrets management

---

## Approval Workflow

### PHR (Prompt History Record) Format

Every operational decision documented in `history/prompts/004-phase-iv-aiops/`:

```yaml
---
id: [ID]
title: [Operation title]
stage: [phase-iv-operational]
date: [2025-12-24]
feature: 004-phase-iv-aiops
labels: ["kubectl-ai", "operational", "approval"]
---

## AI Recommendation

[kubectl-ai or kagent output]

## Pre-Action Metrics

- Pod count: [current]
- CPU utilization: [current]
- Error rate: [current]

## Architect Decision

- Decision: [approve/reject]
- Timestamp: [ISO-8601]
- Justification: [rationale]

## Post-Action Validation (1-hour monitoring)

- 5 min: [status]
- 15 min: [status]
- 1 hour: [status]

## Rollback Plan

[Procedure to undo change]
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **MTTD** | <5 minutes | Time from pod failure detection to diagnosis |
| **MTTR** | <15 minutes | Time from architect approval to remediation |
| **kubectl-ai Response** | <2 seconds | Diagnostic command latency |
| **kagent Report Quality** | ≥80% actionable | % of recommendations acted upon |
| **Approval Latency** | <30 min routine, <5 min emergency | Time from recommendation to approval |
| **Toil Reduction** | ≥50% | Manual hours saved |
| **Cost Savings** | ≥20% | Cluster cost reduction |
| **Zero Config Outages** | 100% | Configuration-related incidents resolved |
| **PHR Compliance** | 100% | All medium/critical ops documented |
| **Rollback Success** | 100% within 5 min | All reversals complete within SLA |

---

## Fallback Procedures

If kubectl-ai or kagent unavailable:

**kubectl-ai Fallback**: Manual kubectl commands
```bash
kubectl logs <pod> -c <container> --tail=100
kubectl describe pod <pod>
kubectl top pods --containers
kubectl get events
```

**kagent Fallback**: Manual metrics analysis
```bash
kubectl top pods --containers
kubectl get pods -w
kubectl metrics
```

See `fallback/` directory for detailed manual procedures.

---

## Next Steps

1. **Phase IV.1 MVP**: Execute `./test-pod-failure-diagnosis.sh`
2. **Phase IV.2**: Add scaling, optimization, health reporting
3. **Phase IV.3**: Full analytics pipeline with cron jobs
4. **Phase IV.4**: Comprehensive documentation and training

---

**Created**: 2025-12-23
**Status**: ✅ Phase IV operational framework initialized
