# Electron-Specific Code Review Searches

These searches complement the TypeScript and universal searches. Run from the repository root; ripgrep's `ts` type covers `.ts`/`.tsx`, add `--type js` for JavaScript sources.

---

## Category: Insecure webPreferences

```bash
rg "nodeIntegration(InWorker|InSubFrames)?\s*:\s*true" --type ts --type js
rg "contextIsolation\s*:\s*false" --type ts --type js
rg "sandbox\s*:\s*false" --type ts --type js
rg "webSecurity\s*:\s*false" --type ts --type js
rg "allowRunningInsecureContent\s*:\s*true|experimentalFeatures\s*:\s*true" --type ts --type js
```

Critical. Each disables a core isolation boundary. Must be removed; no exceptions for "local only" content.

---

## Category: shell.openExternal with Variables

```bash
rg "shell\.openExternal\(\s*[^'\"\s)]" --type ts --type js
rg "shell\.openPath\(" --type ts --type js
```

High. Opening a non-literal URL or path can launch arbitrary protocols/executables. Verify an `https:` allow-list check precedes each call.

---

## Category: Missing Navigation and Window-Open Guards

```bash
rg -l "new BrowserWindow\(" --type ts --type js
rg "setWindowOpenHandler|will-navigate|will-redirect" --type ts --type js
```

High. If the first command finds windows but the second finds no handlers, navigation and `window.open` are unrestricted. Every `webContents` needs `setWindowOpenHandler` (deny by default) and a `will-navigate` origin check.

---

## Category: IPC Handlers without Sender Validation

```bash
rg "ipcMain\.(handle|handleOnce|on|once)\(" -A 6 --type ts --type js
rg "senderFrame|assertTrustedSender|validateSender" --type ts --type js
```

High. Review each handler from the first search: it must validate `event.senderFrame` origin and parse the payload with a schema before use. A low count from the second search relative to the first indicates missing checks.

---

## Category: Over-exposed Preload Bridge

```bash
rg -U "exposeInMainWorld\([^)]*ipcRenderer\b" --type ts --type js
rg "exposeInMainWorld" -A 10 --type ts --type js
```

Critical. Never expose `ipcRenderer`, `require`, `process`, or generic `send(channel, ...)` wrappers. Expose one function per operation.

---

## Category: Legacy remote Module

```bash
rg "enableRemoteModule|@electron/remote|require\(['\"]electron['\"]\)\.remote" --type ts --type js
```

High (legacy). The built-in `remote` module was removed in Electron 14; `@electron/remote` re-adds the same risk. Move the logic to main behind IPC.

---

## Category: webview and Dynamic Code

```bash
rg "<webview|webviewTag\s*:\s*true" --type ts --type js
rg "executeJavaScript\(" --type ts --type js
```

Medium-High. Prefer `WebContentsView`; validate `will-attach-webview` if `<webview>` is unavoidable. `executeJavaScript` must never receive interpolated untrusted data.
