# node-core/patterns.md

# Async Patterns and Node.js Idioms

**Simplicity rule:** use `async/await` and plain functions first. Reach for streams, worker threads, or EventEmitter only when the problem genuinely requires them — large data pipelines, CPU-bound computation, or event-driven fan-out. Do not introduce them as patterns.

---

## Async / await rules

- Use `async/await` for all I/O; never use `.then().catch()` chains when `await` is available
- Never use `.then()` without a `.catch()` — unhandled rejections crash the process in Node 15+
- Do not mix callbacks and promises in the same call chain; promisify callbacks with `util.promisify` or the `node:promises` variants

```typescript
import { readFile } from 'node:fs/promises';

// Good
const content = await readFile('./data.json', 'utf-8');

// Avoid — callback style in modern code
fs.readFile('./data.json', 'utf-8', (err, data) => { ... });
```

**Parallel operations:**
```typescript
// Good — independent operations run concurrently
const [user, orders] = await Promise.all([
  userRepo.findById(userId),
  orderRepo.findByUser(userId),
]);

// Bad — sequential awaits when operations are independent
const user = await userRepo.findById(userId);
const orders = await orderRepo.findByUser(userId);
```

---

## Streams

Use streams for large data — avoid loading large payloads into memory.

```typescript
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

// Compress a file without loading it into memory
await pipeline(
  createReadStream('./large-file.csv'),
  createGzip(),
  createWriteStream('./large-file.csv.gz'),
);
```

**Transform streams:**
```typescript
import { Transform } from 'node:stream';

class JsonLineParser extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
    try {
      this.push(JSON.parse(chunk.toString()));
      callback();
    } catch (err) {
      callback(err as Error);
    }
  }
}
```

**Rules:**
- Always use `pipeline` from `node:stream/promises` — it handles backpressure and propagates errors correctly
- Never write to a stream after `end()` is called
- Use `objectMode: true` for streams that process JavaScript objects, not raw bytes

---

## EventEmitter

```typescript
import { EventEmitter } from 'node:events';
import type { TypedEventEmitter } from 'some-typed-events-lib'; // or write your own

type OrderEvents = {
  placed: [orderId: string];
  failed: [error: Error, orderId: string];
};

class OrderEventBus extends EventEmitter {
  declare on: <K extends keyof OrderEvents>(event: K, listener: (...args: OrderEvents[K]) => void) => this;
  declare emit: <K extends keyof OrderEvents>(event: K, ...args: OrderEvents[K]) => boolean;
}

const bus = new OrderEventBus();
bus.on('placed', (orderId) => logger.info({ orderId }, 'order placed'));
```

**Rules:**
- Set `setMaxListeners(n)` explicitly if you legitimately add many listeners — the default 10 warning is a leak signal
- Prefer `once()` over `on()` for one-time events (e.g. startup, shutdown)
- Always handle the `error` event — an unhandled `error` event crashes the process

---

## Worker threads

**Use only for CPU-bound work that measurably blocks the event loop** — image processing, compression, heavy computation. Most Node.js services never need worker threads. Profile before reaching for them.

Use for CPU-bound work that would block the event loop (image processing, crypto, compression).

```typescript
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

// worker.ts
if (!isMainThread) {
  const result = heavyComputation(workerData as ComputationInput);
  parentPort!.postMessage(result);
}

// main.ts
function runWorker(data: ComputationInput): Promise<ComputationResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.js', import.meta.url));
    worker.postMessage(data);
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}
```

**Rules:**
- Workers do not share memory by default — communicate via `postMessage` (serialised) or `SharedArrayBuffer` (explicit)
- Keep a pool of workers for high-throughput scenarios; do not create a new worker per request
- Use `worker_threads` for CPU work; use child processes for isolation (untrusted code, different runtimes)

---

## Graceful shutdown

```typescript
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'graceful shutdown started');

  // 1. Stop accepting new requests
  httpServer.close();

  // 2. Wait for in-flight requests (add timeout)
  await new Promise<void>((resolve) => setTimeout(resolve, 5000));

  // 3. Drain workers and queues
  await queueConsumer.stop();

  // 4. Close infrastructure
  await dbPool.end();
  await redisClient.quit();

  logger.info('shutdown complete');
  process.exit(0);
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections — log, then exit cleanly
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection');
  process.exit(1);
});
```
