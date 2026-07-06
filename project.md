# Project Context: Scanalytics Infrastructure & Architecture

Please act as a Senior DevOps and Software Architect. I am managing a personal project named "Scanalytics". Here is the current architectural state of my system. Keep this context for all our interactions.

## 1. Infrastructure Overview
- **Server:** Oracle Cloud VPS (Linux).
- **Connectivity:** Securely managed via Cloudflare Tunnel (`cloudflared`).
- **Network Topology:** 
  - There are NO open ports on the server (no direct public ingress). 
  - All public traffic enters through Cloudflare, which connects to the local `cloudflared` agent running as a Docker container.
  - The tunnel pushes traffic into the internal Docker network.

## 2. Docker Ecosystem
- **Orchestration:** Docker Compose.
- **Internal Network:** All services are connected to a bridge network named `microservices-net`.
- **Containers:** 
  - **Frontend:** React/Vite (serves as the entry point).
  - **API Gateway:** The central routing hub.
  - **Backend:** Core logic (Auth, etc.).
  - **InsightsDashboard:** Analytics engine.
  - **Infrastructure:** Kafka, MongoDB, Elasticsearch (Internal only, no public access).

## 3. Communication Logic (API Gateway Pattern)
- The architecture implements a Reverse Proxy pattern.
- The Frontend is the only entry point.
- **API Routing:**
  - The Frontend makes API calls to `/api/...`.
  - The Vite Dev/Production server (or Nginx) uses a Proxy configuration to route traffic:
    - `/api/insights/*` -> `http://InsightsDashboard:8001/*`
    - `/api/ingestion/*` -> `http://api-gateway:8000/*`
    - `/api/*` -> `http://backend:3000/*`
- All backend services (Mongo, Kafka, ES) are isolated in the private Docker network and communicate via internal DNS names (e.g., `http://mongodb:27017`).

## 4. Current Workflow
- I manage the server via SSH.
- I deploy updates using `docker compose up -d`.
- Cloudflare Tunnel is responsible for the SSL/HTTPS termination and routing to the correct local Docker container.

Please use this context to provide technical support, code refactoring, or architectural advice for the Scanalytics project.