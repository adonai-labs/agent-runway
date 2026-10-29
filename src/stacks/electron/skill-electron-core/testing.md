# electron-core/testing.md

# Testing

Test pyramid for Electron: most tests run without Electron at all.

---

## Test types

| Type | What | Tools |
|------|------|-------|
| **Unit** | Services, validation schemas, pure logic | Vitest |
| **Handler** | IPC handlers with fake events (sender + payload validation) | Vitest |
| **Renderer** | Components and hooks against a mocked `window.api` | Vitest + React Testing Library |
| **E2E** | Critical flows in the packaged/built app | Playwright (`_electron`) |

---

## IPC handler tests

```typescript
import { saveFileHandler } from '../main/ipc/files';

vi.mock('../main/services/file-service', () => ({ fileService: { save: vi.fn(async () => ({ path: '/tmp/a.txt' })) } }));

const event = (url: string) => ({ senderFrame: { url } }) as unknown as IpcMainInvokeEvent;

it('saves when sender and payload are valid', async () => {
  await expect(saveFileHandler(event(APP_ORIGIN + '/index.html'), { name: 'a.txt', content: 'x' }))
    .resolves.toEqual({ path: '/tmp/a.txt' });
});

it('rejects untrusted senders', async () => {
  await expect(saveFileHandler(event('https://evil.example'), { name: 'a', content: '' }))
    .rejects.toThrow('Untrusted sender');
});

it('rejects invalid payloads', async () => {
  await expect(saveFileHandler(event(APP_ORIGIN + '/'), { name: 42 })).rejects.toThrow();
});
```

---

## Renderer tests

```typescript
beforeEach(() => {
  vi.stubGlobal('api', { saveFile: vi.fn().mockResolvedValue({ path: '/tmp/a.txt' }) });
});
afterEach(() => vi.unstubAllGlobals());
```

- Never import `electron` in renderer tests
- Test that subscription hooks call the unsubscribe function on unmount

---

## E2E with Playwright

```typescript
import { _electron as electron, expect, test } from '@playwright/test';

test('renderer has no Node access and can save', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] });
  const page = await app.firstWindow();

  expect(await page.evaluate(() => typeof (globalThis as any).process)).toBe('undefined');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved')).toBeVisible();
  await app.close();
});
```

- Build before E2E; point `userData` at a temp directory per run (`app.setPath` driven by an env var in test mode)
- Use `app.evaluate(({ app }) => ...)` to assert main-process state when needed
- Run E2E on every OS you ship to in CI (xvfb on Linux)

---

## Checklist

- [ ] Services tested without Electron
- [ ] Every IPC handler has valid / untrusted sender / invalid payload tests
- [ ] Renderer tests mock `window.api` only
- [ ] Playwright E2E covers critical flows and a renderer security smoke test
