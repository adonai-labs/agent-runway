# electron-core/reference.md

# Reference

Toolchain, scripts, and common commands for Electron projects.

---

## Toolchain

| Concern | Recommended | Notes |
|---------|-------------|-------|
| Build | `electron-vite` or Electron Forge + Vite plugin | Separate main / preload / renderer builds |
| Packaging | Electron Forge or `electron-builder` | Code signing and notarisation built in |
| Updates | `electron-updater` or `update-electron-app` | HTTPS, signed artefacts |
| Fuses | `@electron/fuses` | Flip at package time |
| Unit tests | Vitest | Services, handlers, renderer |
| E2E | Playwright (`_electron`) | Spectron is dead |
| Static scan | `@doyensec/electronegativity` | Misconfiguration checks |

Keep `electron` on a supported major (the latest three stable majors receive security fixes).

---

## package.json scripts (electron-vite)

```jsonc
{
  "main": "out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "npm run build && playwright test",
    "package": "electron-builder"
  }
}
```

---

## Common commands

```bash
npm run dev                          # dev with HMR for the renderer
npm run build && npm run test:e2e    # build, then Playwright against the output
npm audit --omit=dev --audit-level=high
npx @doyensec/electronegativity -i .
npx @electron/fuses read --app dist/mac/MyApp.app
```

---

## Key APIs

| API | Use for |
|-----|---------|
| `contextBridge.exposeInMainWorld` | Preload → page API |
| `ipcMain.handle` / `ipcRenderer.invoke` | Request–response IPC |
| `utilityProcess.fork` | Background Node work off main |
| `protocol.handle` | Serve app files via custom scheme |
| `safeStorage` | OS-backed encryption for secrets |
| `session.setPermissionRequestHandler` | Deny permissions by default |
| `webContents.setWindowOpenHandler` | Control `window.open` / new windows |
| `crashReporter` | Native crash dumps |
