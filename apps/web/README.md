# 🦙 MyLlama — Web Client (`apps/web`)

The frontend for MyLlama, built as a Progressive Web App (PWA) with **TanStack Start**, **React 19**, and **Tailwind CSS v4**.

---

## 🌟 Features

- **Interactive Local AI Chat**: Real-time token streaming via Server-Sent Events (SSE) connected to local Ollama.
- **Model Selector**: Automatically detects and lets you switch between models installed in your local Ollama instance (e.g. `gemma4:12b-mlx`, `llama3.2`).
- **Reasoning / Thinking Drawer**: Collapsible view for models that output internal thought chains.
- **Live Health Probes**: Real-time status indicators for the Bun API, PostgreSQL database, and Ollama engine.
- **Type-Safe Routing**: File-based routing powered by `@tanstack/react-router`.

---

## 🚀 Getting Started

From the repository root:

```bash
# Run web dev server (port 3000)
bun run dev:web
```

Or from within `apps/web`:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

The web client communicates with the Bun backend API. By default, it targets `http://localhost:4000`.

To change this, configure `VITE_API_URL` in `.env`:

```env
VITE_API_URL=http://localhost:4000
```

---

## 📁 Project Structure

```text
apps/web/
├── src/
│   ├── components/        # Reusable UI elements (Header, Footer, ThemeToggle)
│   ├── routes/            # TanStack file-based routes
│   │   ├── __root.tsx     # Root document layout, HTML shell, and devtools
│   │   ├── index.tsx      # Dashboard & real-time Ollama Chat UI
│   │   └── about.tsx      # Architecture & Guiding Principles document
│   ├── router.tsx         # TanStack Router instance factory
│   └── styles.css         # Global styling and Tailwind CSS imports
├── package.json
├── tsconfig.json
└── vite.config.ts         # Vite 8 & TanStack Start build configuration
```

---

## 🏗️ Production Build

To build the client and SSR bundles:

```bash
bun run build
```
Outputs are generated in `dist/client` and `dist/server`.
