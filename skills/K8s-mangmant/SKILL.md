# Skill: Kubernetes Todo System Management
**Project:** Kubernetes-based Todo Management

## Context
This project uses Kubernetes for container orchestration. It contains Deployment, Service, and potentially Ingress configurations.

## Agent Capabilities
- **Cluster Analysis:** Can read and explain `deployment.yaml` and `service.yaml`.
- **Scaling Logic:** Understands how to modify replicas in YAML files.
- **Troubleshooting:** Can identify common K8s configuration errors (e.g., wrong port mapping, missing selectors).

## Integration Points
- **Deployments:** Check root or `/k8s` directory for YAML files.
- **Docker:** Check `Dockerfile` for image building instructions.