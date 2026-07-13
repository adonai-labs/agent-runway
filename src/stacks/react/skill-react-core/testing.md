# react-core/testing.md

# Testing for React

---

## Core principles

- Test behaviour, not implementation — assert what the user sees and does, not internal state or method calls
- Use accessible queries: `getByRole`, `getByLabelText` over `getByTestId` or CSS selectors
- A component tested through its user-facing API survives refactors; one tested by internal details does not

---

## Setup

```ts
// vitest.config.ts (preferred) or jest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});

// src/test/setup.ts
import '@testing-library/jest-dom';
```

---

## Custom render with providers

Create a single `render` helper that wraps with all necessary providers. Import this in every test instead of the raw RTL `render`.

```tsx
// src/test/render.tsx
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}
```

---

## Component tests

```tsx
// features/orders/components/OrderCard.test.tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { OrderCard } from './OrderCard';

const mockOrder: Order = { id: 'ord-1', total: '$99.00', status: 'pending' };

describe('OrderCard', () => {
  it('displays order id and total', () => {
    renderWithProviders(<OrderCard order={mockOrder} onCancel={vi.fn()} />);

    expect(screen.getByText('ord-1')).toBeInTheDocument();
    expect(screen.getByText('$99.00')).toBeInTheDocument();
  });

  it('calls onCancel with the order id when cancel is clicked', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    renderWithProviders(<OrderCard order={mockOrder} onCancel={handleCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel order/i }));

    expect(handleCancel).toHaveBeenCalledWith('ord-1');
  });
});
```

---

## Hook tests

```tsx
// hooks/useOrders.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { useOrders } from './useOrders';
import { createWrapper } from '@/test/render';

describe('useOrders', () => {
  it('returns orders on success', async () => {
    server.use(
      http.get('/api/orders', () => HttpResponse.json([{ id: 'ord-1', total: '$99' }])),
    );

    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0].id).toBe('ord-1');
  });

  it('exposes error on API failure', async () => {
    server.use(http.get('/api/orders', () => HttpResponse.error()));

    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
```

---

## API mocking with MSW

```ts
// src/test/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/test/setup.ts
import { server } from './server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Prefer MSW over `jest.mock` / `vi.mock` for API calls — it tests the actual fetch behaviour.

---

## Accessibility testing

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<LoginForm />);
  expect(await axe(container)).toHaveNoViolations();
});
```

Run `axe` on all forms, dialogs, and navigation components as a baseline.

---

## Checklist

- [ ] Custom `renderWithProviders` used in all component tests
- [ ] Queries use `getByRole`, `getByLabelText` first; `getByTestId` only as a last resort
- [ ] User interactions use `userEvent.setup()` not `fireEvent`
- [ ] Async state tested with `findBy*` or `waitFor`, not fixed timeouts
- [ ] Hooks tested with `renderHook`; providers supplied via wrapper
- [ ] API calls mocked with MSW; no `fetch` mocks or `jest.mock` on http modules
- [ ] Forms and dialogs run through `jest-axe`; no violations
