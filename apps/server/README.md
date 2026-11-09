# 🦙 MyLlama — Backend API (`apps/server`)

The TypeScript backend for MyLlama, running on **Bun** with **Hono** and native **Bun SQL**.

---

## 🌟 Responsibilities

- **Security & Network Boundary**: Sits between the web client, PostgreSQL database, and host Ollama instance. The frontend never calls Ollama or the database directly.
- **Model Orchestration**: Forwards prompts to Ollama (`/api/chat`) and streams tokens back to the web client via Server-Sent Events (SSE).
- **Service Health Monitoring**: Probes PostgreSQL connection integrity and Ollama availability.

---

## 🚀 Getting Started

### Local Development

Make sure PostgreSQL is running (e.g. `bun run docker:db` from the root), then from the root:

```bash
bun run dev:server
```

Or from within `apps/server`:

```bash
bun run dev
```

The server listens on **port 4000** (`http://localhost:4000`).

---

## 📦 Containerized Execution

The server is containerized using `docker/server.Dockerfile` and orchestrated via root `compose.yaml`.

```bash
# Build and run together with PostgreSQL
docker compose up -d --build
```

In Docker on macOS, the server connects to host Ollama via `http://host.docker.internal:11434` and to PostgreSQL via the internal Docker network `postgres:5432`.

---

## 📡 API Endpoints

### Health Checks
- `GET /health`: Basic server probe.
  ```json
  { "status": "ok", "service": "myllama-server", "timestamp": "..." }
  ```
- `GET /health/ready`: Deep health check of dependencies (PostgreSQL and Ollama).
  ```json
  {
    "status": "ready",
    "services": {
      "database": { "status": "connected", "message": "PostgreSQL connected successfully" },
      "ollama": { "status": "connected", "version": "0.40.13", "models": ["gemma4:12b-mlx"] }
    }
  }
  ```

### Models & Chat
- `GET /api/models`: Lists installed Ollama models with their metadata and sizes.
- `POST /api/chat`: Proxies chat requests to Ollama.
  - **Body parameters**:
    - `model` *(string, optional)*: Target Ollama model name (auto-detects if omitted).
    - `prompt` *(string, optional)*: Single prompt shortcut.
    - `messages` *(array, optional)*: Array of `{ role: "user" | "assistant", content: string }`.
    - `stream` *(boolean, optional)*: Set `true` to stream responses using Server-Sent Events (SSE).

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | HTTP port for the Bun API |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `DATABASE_URL` | `postgres://myllama:myllama_password@localhost:5432/myllama` | PostgreSQL connection string |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama URL (use `http://host.docker.internal:11434` in Docker) |
