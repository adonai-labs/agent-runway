# electron-core/security.md

# Security

Electron-specific security. The renderer is untrusted web content; every boundary is enforced in main.

---

## Secure webPreferences

```typescript
const secureDefaults: WebPreferences = {
  preload: path.join(__dirname, '../preload/index.js'),
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  webSecurity: true,
  allowRunningInsecureContent: false,
  webviewTag: false,
};
```

Apply the same baseline to every window. Never relax it for "trusted" local content.

---

## Content Security Policy

- `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'`
- Serve app files through a custom protocol registered with `protocol.handle` instead of `file://`
- No `'unsafe-eval'`; avoid `'unsafe-inline'` for scripts

---

## Navigation, new windows, permissions

```typescript
app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternal(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (e, url) => { if (new URL(url).origin !== APP_ORIGIN) e.preventDefault(); });
});

session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
```

- `isAllowedExternal`: parse with `new URL`, require `https:`, match a host allow-list
- Never call `shell.openExternal` or `shell.openPath` with unvalidated renderer input

---

## IPC

- Validate the sender (`event.senderFrame.url` origin) and the payload (Zod) in every handler
- Expose one preload function per operation — never `ipcRenderer` itself or a generic `send`
- Return only the data the UI needs; never return file handles, paths outside user scope, or secrets
- Validate file paths from the renderer against an allowed root

---

## Packaging and updates

- Enable fuses: `RunAsNode` off, `EnableNodeOptionsEnvironmentVariable` off, `EnableNodeCliInspectArguments` off, `EnableEmbeddedAsarIntegrityValidation` on, `OnlyLoadAppFromAsar` on
- Code-sign and notarise (macOS) every build; sign Windows installers
- Auto-update only over HTTPS from a source you control (`electron-updater` or `update-electron-app`); updates must be signed
- Stay on a supported Electron major; Chromium security fixes only land there

---

## Secrets

- Store tokens with `safeStorage` (OS-backed encryption), not plain files or `localStorage`
- Never embed API secrets in the app bundle — anything shipped can be extracted

---

## Checklist

- [ ] Secure `webPreferences` baseline on every window
- [ ] CSP set; custom protocol instead of `file://`
- [ ] Navigation, window-open, and permission handlers deny by default
- [ ] All IPC handlers validate sender and payload
- [ ] Fuses enabled; builds signed; updates signed and over HTTPS
- [ ] Secrets in `safeStorage`; none bundled
