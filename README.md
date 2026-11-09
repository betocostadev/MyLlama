# 🦙 MyLlama

A local-first, open-source workspace for chatting with AI language models powered by a local [Ollama](https://ollama.ai) instance, with a [Bun](https://bun.sh) TypeScript backend and a [TanStack Start](https://tanstack.com/start) Progressive Web App.

---

## 🏗️ Architecture

```text
 Browser / PWA (TanStack Start + Tailwind CSS)
      │
      ▼ HTTP & Streaming SSE (port 3000 -> 4000)
 Bun + TypeScript API (Port 4000 in Docker or Local) ──────► Host Ollama (Port 11434)
      │                                                         (Managed on Mac host)
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
│   ├── web/                 # TanStack Start PWA (React 19, Vite, Tailwind v4, Chat UI)
│   ├── server/              # Bun TypeScript API (Hono, Bun SQL, Ollama SSE proxy)
│   └── mobile/              # Reserved for future React Native / Expo client
├── docker/
│   └── server.Dockerfile   # Production Bun container configuration
├── compose.yaml             # PostgreSQL 16 & containerized Bun server
├── package.json             # Bun monorepo workspace & root commands
├── .env.example             # Documented environment configuration
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.2+)
- [Docker Desktop](https://www.docker.com) (running on your Mac)
- [Ollama](https://ollama.ai) (running on your Mac host)

### 2. Install Workspace Dependencies
```bash
bun install
```

### 3. Running the Stack

You have two workflows depending on whether you want the Bun server running in Docker or locally:

#### Option A: Dockerized Stack (Recommended)
Builds and runs PostgreSQL 16 and the Bun server in Docker:
```bash
bun run docker:up
# Or: docker compose up -d --build
```
Then start the web frontend:
```bash
bun run dev:web
```

#### Option B: Local Server Development
Runs PostgreSQL in Docker, but runs both the web UI and Bun server locally:
```bash
bun run docker:db   # Starts only PostgreSQL in Docker
bun run dev         # Runs web (port 3000) and server (port 4000) locally
```

---

## 🌐 Endpoints & Ports

| Component | Port | Address | Description |
| :--- | :--- | :--- | :--- |
| **Web UI** | 3000 | `http://localhost:3000` | TanStack Start interactive chat & dashboard |
| **Bun API** | 4000 | `http://localhost:4000` | REST & Server-Sent Events (SSE) API |
| **PostgreSQL** | 5432 | `localhost:5432` | Dockerized PostgreSQL 16 database |
| **Ollama** | 11434 | `http://localhost:11434` | Host AI engine (`gemma4:12b-mlx`, etc.) |

---

## 💬 API Routes

- `GET /health`: Basic server heartbeat.
- `GET /health/ready`: Deep dependency readiness (verifies PostgreSQL and Ollama connectivity).
- `GET /api/models`: Lists installed local Ollama models.
- `POST /api/chat`: Proxies chat prompts to Ollama with optional real-time token streaming (`stream: true`).
