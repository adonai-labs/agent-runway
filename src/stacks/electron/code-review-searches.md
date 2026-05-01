# Electron Code Review Searches

## Security

### Context isolation and nodeIntegration
Search: `nodeIntegration: true`
Search: `contextIsolation: false`
Search: `enableRemoteModule: true`

### IPC patterns
Search: `ipcRenderer.send`
Search: `ipcMain.on`
Search: `contextBridge.exposeInMainWorld`

## Process model

### Remote module usage (deprecated)
Search: `require('electron').remote`
Search: `remote.require`

### Shell and external protocols
Search: `shell.openExternal`
Search: `shell.openPath`

## Dependencies
Search: `require(` in renderer context files (`*.renderer.ts`, `*.html`)
