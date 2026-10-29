# electron-core/architecture.md

# Architecture

Process model and project structure for Electron apps.

---

## Processes

| Process | Runs | Responsibilities |
|---------|------|------------------|
| Main | Node.js | App lifecycle, windows, menus, native APIs, IPC handlers |
| Preload | Isolated world, sandboxed | Exposes a minimal API to the page via `contextBridge` |
| Renderer | Chromium | UI only; talks to main exclusively through the preload API |
| Utility (`utilityProcess.fork`) | Node.js | CPU-heavy or crash-prone work (indexing, parsing, native modules) |

The renderer is untrusted. The main process is trusted but must stay responsive — any synchronous work there freezes every window.

---

## Project layout

```
src/
├── main/
│   ├── index.ts          ← composition root: app events, window manager, IPC registration
│   ├── windows/          ← window manager and per-window factories
│   ├── ipc/              ← thin handlers: validate sender + payload, call a service
│   └── services/         ← business logic; no `electron` import where possible
├── preload/
│   └── index.ts          ← contextBridge API, one function per operation
├── renderer/             ← React/Vite UI; only uses window.api
└── shared/
    └── ipc.ts            ← channel names, request/response types or Zod schemas
```

Use `electron-vite` or Electron Forge with the Vite plugin to build the three targets with separate configs.

---

## Dependency rules

- `renderer` imports only `shared` and its own code — never `electron` or Node built-ins
- `preload` imports `electron` (`contextBridge`, `ipcRenderer`) and `shared` types only
- `main/ipc` depends on `main/services`; services do not depend on IPC
- `shared` contains types, schemas, and constants — no runtime side effects

---

## Window manager

One module owns every `BrowserWindow`:

- Creates windows with a shared secure `webPreferences` baseline
- Tracks windows by stable ID; removes them on `closed`
- Persists and restores bounds (clamped to visible displays)
- Shows windows on `ready-to-show` to avoid blank flashes

---

## Scaling up

- Start with one window, one preload, one IPC module
- Split IPC handlers by feature (`ipc/files.ts`, `ipc/settings.ts`) as the API grows
- Generate preload and handler registration from a single typed contract once there are more than a handful of channels (see [patterns.md](patterns.md))
- Add a utility process only when profiling shows main-process work affects responsiveness
