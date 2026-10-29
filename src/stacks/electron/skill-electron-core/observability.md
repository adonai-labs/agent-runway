# electron-core/observability.md

# Observability

Logging, crash reporting, metrics, and recovery for desktop apps.

---

## Logging

- Use one logger in main (e.g. `electron-log` or Pino writing to `app.getPath('logs')`); rotate files
- Renderer logs go through a dedicated IPC channel or the logger's renderer transport — not `console` only
- Structured entries: timestamp, process (`main`/`renderer`/`utility`), window ID, operation, error
- Never log tokens, file contents, or PII; redact paths under the user's home directory where possible

---

## Crash reporting

```typescript
crashReporter.start({ submitURL: config.crashUrl, uploadToServer: userConsented });

app.on('render-process-gone', (_e, webContents, details) => {
  log.error({ reason: details.reason, exitCode: details.exitCode }, 'renderer gone');
  if (details.reason !== 'clean-exit') windowManager.recover(webContents);
});
app.on('child-process-gone', (_e, details) => log.error({ ...details }, 'child process gone'));
process.on('uncaughtException', (err) => { log.error({ err }, 'uncaught exception'); });
process.on('unhandledRejection', (reason) => { log.error({ reason }, 'unhandled rejection'); });
```

- Native crash dumps (Crashpad) via `crashReporter`; JS errors via Sentry (`@sentry/electron`) or similar
- Upload only with user consent; include app version, Electron version, and OS

---

## Metrics

- Sample `app.getAppMetrics()` (CPU, memory per process) at a fixed interval into a bounded buffer
- Track startup time (`app.on('ready')` → first `ready-to-show`) and IPC latency per channel
- Watch for monotonic memory growth across window open/close cycles — a leak signal

---

## Recovery

- Renderer crash → reload or recreate the window; show a recovery screen after repeated failures
- Utility process exit → restart with bounded backoff
- Unrecoverable main-process error → log, show a dialog with restart/report options, then `app.relaunch()` + `app.exit(1)`

---

## Checklist

- [ ] Central logger with rotation; renderer logs routed to it
- [ ] `crashReporter` and JS error reporting enabled with consent
- [ ] `render-process-gone` and `child-process-gone` handled
- [ ] Startup time and memory monitored; bounded metric buffers
