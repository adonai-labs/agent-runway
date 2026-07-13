# react-core/observability.md

# Observability for React

Error boundaries, logging, and performance monitoring for React applications.

---

## Error boundaries

Every production React app needs error boundaries. An unhandled render error without a boundary brings down the entire tree.

```tsx
// components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    // Log to your error tracking service
    console.error('Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Placement strategy:**
- One root boundary at the app level for catastrophic failures
- One boundary per route / major section so a single feature failure does not crash the whole app
- One boundary per feature that fetches data independently

```tsx
// App.tsx — layered boundaries
<ErrorBoundary fallback={<AppCrashPage />}>
  <Layout>
    <Routes>
      <Route path="/orders" element={
        <ErrorBoundary fallback={<FeatureError feature="Orders" />}>
          <OrdersPage />
        </ErrorBoundary>
      } />
    </Routes>
  </Layout>
</ErrorBoundary>
```

---

## Error tracking (Sentry)

```tsx
// lib/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,       // 10% of transactions
  beforeSend(event) {
    // Scrub PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});

// Use Sentry error boundary for automatic capture
import { ErrorBoundary as SentryBoundary } from '@sentry/react';
<SentryBoundary fallback={<FeatureError />}>
  <OrdersPage />
</SentryBoundary>
```

---

## Performance monitoring

**Measure before optimising.** Use the React DevTools Profiler and browser performance tools to identify actual bottlenecks.

```tsx
// Web Vitals — measure in production
import { onCLS, onINP, onLCP } from 'web-vitals';

function reportWebVital({ name, value, rating }: Metric) {
  // Send to your analytics service
  analytics.track('web_vital', { name, value, rating });
}

onCLS(reportWebVital);
onINP(reportWebVital);
onLCP(reportWebVital);
```

**React-specific profiling:**
```tsx
// Wrap expensive subtrees in <Profiler> during development
import { Profiler, type ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (id, phase, duration) => {
  if (duration > 16) {   // longer than one frame at 60fps
    console.warn(`Slow render in ${id} (${phase}): ${duration.toFixed(1)}ms`);
  }
};

<Profiler id="OrderList" onRender={onRender}>
  <OrderList orders={orders} />
</Profiler>
```

---

## Checklist

- [ ] Root error boundary at `App` level; feature-level boundaries on data-fetching sections
- [ ] Error boundaries report to Sentry (or equivalent); PII scrubbed before sending
- [ ] Web Vitals measured and reported in production (CLS, INP, LCP)
- [ ] React DevTools Profiler used before adding `React.memo`, `useMemo`, or `useCallback`
- [ ] `<Profiler>` used in development for components suspected of slow renders
