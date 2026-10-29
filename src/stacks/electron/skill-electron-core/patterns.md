# electron-core/patterns.md

# Patterns

Typed IPC, preload bridges, utility processes, and lifecycle handling.

---

## Typed IPC contract

```typescript
// shared/ipc.ts
import { z } from 'zod';

export const SaveFile = z.object({ name: z.string().max(255), content: z.string().max(1_000_000) });

export interface IpcApi {
  'file:save': (req: z.infer<typeof SaveFile>) => Promise<{ path: string }>;
  'settings:get': () => Promise<Settings>;
}
```

- Channels use `feature:action` names and are declared once
- Request schemas live next to the contract so main can parse them

---

## Handler with sender + payload validation

```typescript
// main/ipc/files.ts
export async function saveFileHandler(event: IpcMainInvokeEvent, raw: unknown) {
  assertTrustedSender(event);
  const req = SaveFile.parse(raw);
  return fileService.save(req);          // service has no electron import
}

export function registerFileIpc() {
  ipcMain.handle('file:save', saveFileHandler);
}

function assertTrustedSender(event: IpcMainInvokeEvent) {
  const url = event.senderFrame?.url;
  if (!url || new URL(url).origin !== APP_ORIGIN) throw new Error('Untrusted sender');
}
```

Exporting the handler separately from registration makes it unit-testable with a fake event.

---

## Preload bridge

```typescript
// preload/index.ts
const api = {
  saveFile: (req: SaveFileRequest) => ipcRenderer.invoke('file:save', req),
  onUpdateAvailable: (cb: (version: string) => void) => {
    const listener = (_e: IpcRendererEvent, v: string) => cb(v);
    ipcRenderer.on('update:available', listener);
    return () => ipcRenderer.removeListener('update:available', listener);
  },
};
contextBridge.exposeInMainWorld('api', api);
export type PreloadApi = typeof api;
```

- One function per operation; never a generic `send(channel, ...)`
- Subscriptions return an unsubscribe function; never pass the raw `event` to the page
- Declare `window.api: PreloadApi` in a renderer `.d.ts`

---

## Heavy work off the main process

```typescript
const worker = utilityProcess.fork(path.join(__dirname, 'indexer.js'));
worker.postMessage({ type: 'index', dir });
worker.on('message', (msg) => mainWindow.webContents.send('index:progress', msg));
worker.on('exit', (code) => { if (code !== 0) scheduleRestart(); });
```

Use `MessageChannelMain` to give a renderer a direct port to a utility process for high-volume streams.

---

## Lifecycle

- Request a single-instance lock (`app.requestSingleInstanceLock()`); focus the existing window on `second-instance`
- Quit on `window-all-closed` except on macOS; recreate a window on `activate`
- Flush state and close resources in `before-quit`; keep it fast and bounded
