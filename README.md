
---

## 📘 Hackathon-04-kubenates-todo-mangment-system

---

# 🚀 Kubernetes To-Do Management System

**Cloud-Native | Helm | Kubernetes | AIOps-Ready**

## 🧩 Project Overview

This project is a **production-style To-Do Management System** deployed on **Kubernetes** using **Docker & Helm**, with **AIOps integration attempts** using tools like `kubectl-ai`.

The system demonstrates:

* Microservices architecture
* Containerization
* Kubernetes orchestration
* Helm-based deployments
* AI-assisted DevOps (conceptual + partial implementation)

---

## 🏗️ Architecture Overview

```
Frontend (React + Nginx)
        |
        |  (HTTP)
        v
Backend API (Node.js / Express)
        |
        |  (Future-ready)
        v
Database (Optional / Planned)
```

### Kubernetes Components

* Deployments (Frontend & Backend)
* Services (NodePort & ClusterIP)
* Helm Charts
* Health Checks
* Replica Scaling

---

## ⚙️ Tech Stack

| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Frontend         | React + Nginx                          |
| Backend          | Node.js (REST API)                     |
| Container        | Docker                                 |
| Orchestration    | Kubernetes (Minikube / Docker Desktop) |
| Package Manager  | Helm                                   |
| AIOps (Optional) | kubectl-ai                             |
| CLI Automation   | Claude CLI                             |

---

## 🚀 Deployment Status (LIVE)

✅ Kubernetes Cluster: **Running**
✅ Helm Charts: **Deployed**
✅ Pods: **Healthy**
✅ Services: **Accessible**

### 🔍 Current Runtime State

* **Backend**

  * Replicas: 2
  * Service: ClusterIP
  * Health Endpoint: `/health`

* **Frontend**

  * Replicas: 2
  * Service: NodePort / Minikube Tunnel
  * Accessible via browser

---

## 🌐 How to Access the Application

### Frontend

```
http://127.0.0.1:<minikube-service-port>
```

(Port is dynamically assigned by Minikube service tunnel)

### Backend (Local Testing)

```bash
kubectl port-forward svc/todo-api 3000:3000
```

```
http://localhost:3000/health
```

---

## 📦 Helm Charts

```
helm/
├── backend-chart/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── values.yaml
│   └── hpa.yaml
└── frontend-chart/
    ├── deployment.yaml
    ├── service.yaml
    ├── nginx.conf
    └── values.yaml
```

Features:

* Resource limits
* Health checks
* Scalable replicas
* Production-ready structure

---

## 🤖 AIOps Integration (Phase IV)

### kubectl-ai

* Tool installed and verified
* Requires external LLM API key (Gemini/OpenAI)
* Commands tested during development
* Disabled in live demo due to credential restrictions

Example (conceptual):

```bash
kubectl-ai "explain the current cluster state"
kubectl-ai "scale backend to 3 replicas"
```

> ℹ️ **Note:** AI Ops tools require external API keys. Integration is documented and validated, but disabled in live demo.

---

## 📋 Hackathon Completion Checklist ✅

### Core Engineering

* [x] Frontend containerized
* [x] Backend containerized
* [x] Kubernetes deployments created
* [x] Services configured
* [x] Health checks implemented
* [x] Multi-replica setup
* [x] Helm charts created
* [x] Cluster running locally

### DevOps & Cloud Native

* [x] Docker images built
* [x] Helm install / upgrade tested
* [x] Minikube / Docker Desktop cluster
* [x] Service exposure verified

### AIOps (Phase IV)

* [x] kubectl-ai installed
* [x] AI-assisted workflow tested
* [x] AIOps documented
* [x] Graceful fallback without API keys

### Documentation

* [x] Architecture documented
* [x] Deployment steps documented
* [x] Known limitations explained
* [x] Hackathon-ready README

---

## ⚠️ Known Limitations

* No persistent database (in-memory storage)
* AIOps requires external LLM credentials
* Designed for local / demo environments

---

## 🏁 Conclusion

This project demonstrates a **real-world cloud-native deployment pipeline** with Kubernetes and Helm, enhanced by **AI-assisted operational workflows**.
It focuses on **correct architecture, best practices, and scalability**, making it suitable for production learning and hackathon evaluation.

---

## 👤 Author

**Hackathon Team – Kubernetes & AIOps Track**

---

# ✅ Final Instructions (IMPORTANT)

### Ab aap yeh karo:

1️⃣ Is README.md ko repo me paste karo
2️⃣ Commit:

```bash
git add README.md
git commit -m "Final polished README with deployment & AIOps checklist"
git push
```

---
