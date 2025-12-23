---
id: [SEQUENTIAL_NUMBER]
title: [POD_NAME] Pod Failure Diagnosis & Remediation
stage: phase-iv-operational
date: [YYYY-MM-DD]
feature: 004-phase-iv-aiops
command: /sp.implement (phase-iv-mvp) or manual operation
labels: ["kubectl-ai", "operational", "pod-failure", "approval", "tier-2"]
links:
  spec: specs/004-phase-iv-aiops/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - [affected deployment/configmap/secret, if any]
tests:
  - kubectl-ai diagnosis completed within 2 seconds
  - Pod reaches Ready state after remediation
  - No new restart events within 1 hour
---

## Diagnosis Summary

### Pod Information
- **Pod Name**: [pod-name]
- **Namespace**: [namespace]
- **Failure State**: [CrashLoopBackOff | OOMKilled | ImagePullBackOff | Pending | Other]
- **Restart Count**: [number]
- **Diagnosis Timestamp**: [ISO-8601]

### kubectl-ai Analysis Output

[Paste full kubectl-ai diagnosis output here, including:
- Root cause analysis
- Failure pattern analysis
- Remediation recommendation
- Expected outcome]

### Pre-Action Metrics

- **Pod Status**: [current phase]
- **Restart Count**: [number]
- **Container State**: [state details]
- **Recent Error Rate**: [% of requests, if applicable]
- **Resource Utilization**:
  - CPU: [current usage]
  - Memory: [current usage]
- **Log Tail** (last 10 lines):
  ```
  [paste relevant log lines]
  ```

---

## Architect Decision

### Remediation Action Selected

**Tier**: 2 (Low-Risk) | 3 (Medium-Risk)
- Tier 2: Simple restart, config update, log review
- Tier 3: Resource limit change, image update, scaling

**Action**:
[Select one]:
- [ ] Pod Restart: `kubectl delete pod [pod-name] -n [namespace]`
- [ ] ConfigMap Update: `kubectl patch configmap [name] -p '{...}'`
- [ ] Resource Update: `kubectl patch deployment [name] -p '{...}'`
- [ ] Manual Investigation: No immediate action, escalate to engineers
- [ ] Other: [describe action]

**Decision**: approve | reject | conditional

**Architect Name**: [approver]
**Timestamp**: [ISO-8601]
**SLA Window**: 5 minutes (Tier 2) | 30 minutes (Tier 3)
**Approval Met?**: yes | no

### Justification

[Detailed reasoning for selected action]:
- Why this action chosen (not others)
- Expected outcome after action
- Risk assessment (if any)
- Rollback plan if needed

### Safety Validation

- [ ] Action is reversible within 5 minutes
- [ ] Cluster has sufficient resources for action
- [ ] No ongoing deployments that could conflict
- [ ] Notification sent to relevant teams (if applicable)

---

## Action Execution Log

### Pre-Action Snapshot

```
$ kubectl describe pod [pod-name] -n [namespace]
[output]

$ kubectl logs [pod-name] -n [namespace] --tail=20
[output]
```

### Execution Steps

```bash
# Step 1: [action command]
$ [command]
[output]

# Step 2: [validation command]
$ [command]
[output]
```

**Execution Timestamp**: [ISO-8601]
**Execution Status**: success | partial | failed

### Execution Errors (if any)

```
[error output, if action failed]
```

**Remediation**: [if action failed, what was done to recover]

---

## Post-Action Validation

### 1-Minute Check
- [ ] Pod status changed from [old-state] to [new-state]
- [ ] Restart count: [before] → [after]
- [ ] Container restarted: yes | no

```
$ kubectl get pod [pod-name] -n [namespace]
[output at 1 minute post-action]
```

### 5-Minute Check
- [ ] Pod Ready state: [yes/no]
- [ ] Error rate trending: [up/down/stable]
- [ ] Restart count stabilized: [yes/no]

```
$ kubectl get pod [pod-name] -n [namespace] -o wide
[output at 5 minutes post-action]

$ kubectl logs [pod-name] -n [namespace] --tail=20
[output showing health post-action]
```

### 1-Hour Check (Continuous Monitoring)
- [ ] No new restarts: yes | no
- [ ] Error rate <5%: yes | no
- [ ] Resource utilization normal: yes | no
- [ ] Service responding: yes | no

```
$ kubectl get pod [pod-name] -n [namespace]
[output at 1 hour post-action]

$ kubectl top pod [pod-name] -n [namespace]
[resource utilization after action]
```

---

## Rollback Plan

**If post-action validation fails, execute rollback**:

### Rollback Steps

1. **Revert ConfigMap** (if updated):
   ```bash
   kubectl rollout undo deployment/[name] -n [namespace]
   ```

2. **Restart Pod** (if corrupted):
   ```bash
   kubectl delete pod [pod-name] -n [namespace]
   ```

3. **Restore from Backup** (if data affected):
   ```bash
   [backup restoration procedure]
   ```

4. **Verify Rollback**:
   ```bash
   kubectl get pod [pod-name] -n [namespace]
   kubectl logs [pod-name] -n [namespace]
   ```

**Rollback Timestamp**: [when rollback was executed, if needed]
**Rollback Status**: success | partial | failed

---

## Outcome Summary

### Final Status

- **Overall Outcome**: success | partial-success | failed
- **Pod Status Post-Action**: [Ready/CrashLoopBackOff/Other]
- **Restart Count Final**: [number]
- **Root Cause Resolved?**: yes | no | partial

### Lessons Learned

[Any insights for future similar failures]:
- Pattern observed: [e.g., memory spike on Mondays at 2pm]
- Prevention: [e.g., increase memory limit, add monitoring alert]
- Monitoring improvement: [additional metric to track]

### Metrics & Cost Impact

- **MTTD** (Mean Time To Diagnosis): [seconds] ✓ Target: <2 seconds
- **MTTR** (Mean Time To Remediation): [minutes] ✓ Target: <15 minutes
- **Total Service Downtime**: [minutes]
- **Cost of Action**: [estimate if applicable]

### Follow-Up Actions

- [ ] Create ticket for root cause fix (e.g., code bug, config issue)
- [ ] Update runbook with new pattern observed
- [ ] Add monitoring/alerting for early detection next time
- [ ] Schedule post-mortem if pattern recurs

**Follow-up Ticket**: [link, if created]
**Owner**: [assigned to]
**Due Date**: [date]

---

## Compliance & Audit

- **Approved By**: [architect name]
- **Approval Timestamp**: [ISO-8601, within SLA window?]
- **Execution Authorized**: yes (within SLA) | escalated (SLA exceeded)
- **100% PHR Documented**: yes
- **Rollback Plan Tested**: yes | no

---

## Instructions for Architect

1. **Review kubectl-ai diagnosis** above
2. **Select remediation action** (restart, config update, etc.)
3. **Provide justification** for your decision
4. **Verify SLA compliance** (5 min for Tier 2, 30 min for Tier 3)
5. **Execute action** and monitor post-action validation (1 hour)
6. **Complete post-action metrics** section
7. **File this PHR** in `history/prompts/004-phase-iv-aiops/` directory

---

**Status**: Complete | In Progress | Escalated
**Last Updated**: [ISO-8601]
