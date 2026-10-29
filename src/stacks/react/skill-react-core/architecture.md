# react-core/architecture.md

# Architecture

Project and feature structure for React applications — scaled to what is needed.

---

## Start flat

For a small app or a single-concern feature: a simple structure is enough.

```
src/
├── components/       ← shared UI components
├── hooks/            ← custom hooks
├── services/         ← API clients and business logic
├── types/            ← TypeScript types and interfaces
├── App.tsx
└── main.tsx
```

Do not introduce layers until the flat structure becomes hard to navigate or change.

---

## Feature-based structure (larger apps)

When features are distinct enough that their components, hooks, and logic should be co-located:

```
src/
├── features/
│   ├── orders/
│   │   ├── components/
│   │   │   ├── OrderList.tsx
│   │   │   └── OrderDetail.tsx
│   │   ├── hooks/
│   │   │   └── useOrders.ts
│   │   ├── services/
│   │   │   └── orderService.ts
│   │   └── index.ts          ← barrel export
│   └── auth/
│       └── ...
├── components/
│   └── ui/                   ← shared, design-system-level components
│       ├── Button/
│       │   ├── Button.tsx
│       │   ├── Button.test.tsx
│       │   └── index.ts
│       └── Input/
├── hooks/                    ← shared hooks (useDebounce, useLocalStorage)
├── lib/                      ← third-party wrappers and clients
│   └── queryClient.ts
├── types/
└── App.tsx
```

**Rules:**
- Co-locate component, its test, and its types in the same directory
- Features export through `index.ts`; other features import from the barrel, not from internal paths
- Shared UI components (`components/ui/`) have no business logic or API dependencies
- Avoid `components/features/` — put feature components inside `features/`

---

## Routing

```tsx
// src/App.tsx — route-level code splitting as the default
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

const Orders   = lazy(() => import('./features/orders/OrdersPage'));
const Settings = lazy(() => import('./features/settings/SettingsPage'));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/orders"   element={<Orders />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Rules:**
- Split at the route level by default; add component-level splitting only for heavy third-party imports (charts, editors, PDF)
- One `Suspense` boundary per meaningful loading unit; avoid nesting multiple spinners

---

## Naming conventions

| Concept | Convention | Example |
|---------|------------|---------|
| Components | `PascalCase.tsx` | `OrderDetail.tsx` |
| Custom hooks | `use` prefix, `camelCase.ts` | `useOrders.ts` |
| Contexts | `PascalCase` + `Context.tsx` | `AuthContext.tsx` |
| Services / utils | `camelCase.ts` | `orderService.ts` |
| Types / interfaces | `PascalCase` | `OrderDto`, `UseOrdersResult` |
| Test files | same name + `.test.tsx` | `OrderDetail.test.tsx` |
| CSS Modules | same name + `.module.css` | `OrderDetail.module.css` |
