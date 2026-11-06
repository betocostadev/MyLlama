# 🦙 MyLlama

A local-first, open-source workspace for chatting with AI language models powered by a local [Ollama](https://ollama.ai) instance, with a [Bun](https://bun.sh) TypeScript backend and a [TanStack Start](https://tanstack.com/start) Progressive Web App.

---

## 🏗️ Architecture

```text
 Browser / PWA (TanStack Start + Tailwind CSS)
      │
      ▼ HTTP & Streaming SSE (port 3000 -> 4000)
 Bun + TypeScript API (Port 4000) ──────► Host Ollama (Port 11434)
      │                                    (Installed & managed on host)
      ▼ SQL Queries
 PostgreSQL 16 (Port 5432 in Docker)
```

- **Local-first**: Inference and database remain entirely on your machine.
- **Clear Boundaries**: Frontend only speaks to the Bun server; the server mediates all model and database access.
- **Privacy by Design**: Tab-scoped guest sessions (`sessionStorage`) and local profile isolation.

---

## 📁 Repository Structure

```text
myllama/
├── apps/
│   ├── web/                 # TanStack Start PWA (React 19, Vite, Tailwind v4)
│   └── server/              # Bun TypeScript API (Hono, Bun SQL)
├── docker/
│   └── server.Dockerfile   # Production Bun container configuration
├── compose.yaml             # PostgreSQL 16 & containerized server definition
├── package.json             # Bun monorepo workspace & root commands
├── .env.example             # Documented environment configuration
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.2+)
- [Docker Desktop](https://www.docker.com) (for PostgreSQL)
- [Ollama](https://ollama.ai) (optional for initial scaffold, required for chat)

### 2. Install Dependencies
```bash
bun install
```

### 3. Start PostgreSQL (Docker)
Ensure Docker Desktop is open and running, then:
```bash
bun run docker:up
# Or directly: docker compose up -d postgres
```

### 4. Start Development Servers
Run the web application and Bun server concurrently:
```bash
bun run dev
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Bun API Server**: [http://localhost:4000](http://localhost:4000)
- **API Health Check**: [http://localhost:4000/health/ready](http://localhost:4000/health/ready)

### 5. Optional: Start Ollama (on host machine)
```bash
ollama serve
# Pull a lightweight model if needed:
ollama pull llama3.2
```

---

## 📦 Containerized Server Smoke Test

You can build and run both the Bun server and PostgreSQL together in Docker:
```bash
docker compose up --build
```
The server container automatically connects to PostgreSQL on Docker's internal bridge network and resolves Ollama on macOS via `host.docker.internal:11434`.

---

## 🎯 Project Roadmap

- [x] **Milestone 1: Scaffold & End-to-End Connectivity**
  - Bun monorepo workspace setup
  - TanStack Start frontend with live service health indicators
  - Bun API with `/health` and `/health/ready` probe endpoints
  - Docker Compose configuration for PostgreSQL and Bun server
- [ ] **Milestone 2: Database Schema & Migrations**
  - Drizzle ORM integration for Profiles, Conversations, Messages, and Projects
  - Tab-scoped guest identity management
- [ ] **Milestone 3: Ollama Streaming & Chat Integration**
  - Server-Sent Events (SSE) streaming model responses from Ollama to TanStack Start
  - Resilient persistence of conversation history
