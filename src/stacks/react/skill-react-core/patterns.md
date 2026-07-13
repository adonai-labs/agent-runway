# react-core/patterns.md

# Component Patterns and State Management

Patterns for React — applied when the problem justifies the structure.

**Simplicity rule:** a functional component with local state and typed props is the right starting point. Add hooks, context, or external stores only when you have a concrete reason.

---

## Component anatomy

```tsx
// Typed props; extend base props when appropriate
interface OrderCardProps {
  order: Order;
  onCancel: (id: string) => void;
  className?: string;
}

// Named export; no default exports in feature code
export function OrderCard({ order, onCancel, className }: OrderCardProps) {
  const handleCancel = () => onCancel(order.id);

  return (
    <article className={className} aria-label={`Order ${order.id}`}>
      <h2>{order.id}</h2>
      <p>Total: {order.total}</p>
      <button type="button" onClick={handleCancel}>
        Cancel order
      </button>
    </article>
  );
}
```

**Rules:**
- Functional components only; no class components
- Named exports for components; default exports only for route-level pages (required by `React.lazy`)
- One component per file; keep files under ~150 lines — if larger, the component likely has too many responsibilities

---

## Custom hooks

Extract stateful logic into hooks when it is reused across components or when a component's logic becomes hard to read.

```tsx
// hooks/useOrders.ts
interface UseOrdersResult {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useOrders(): UseOrdersResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: orderService.list,
  });

  return {
    orders: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
```

**Hook rules:**
- Name with `use` prefix; return a typed object (not a positional tuple unless the API resembles `useState`)
- Include cleanup in `useEffect` for listeners, timers, and subscriptions
- All values from scope used inside a hook must be in the dependency array; no `// eslint-disable-line` suppressions
- Test hooks independently with `renderHook`

---

## State management decision tree

Start at the top; only move down when the current level is insufficient:

```
1. Local state (useState / useReducer)
   → Single component; no sharing needed

2. Lifted state
   → Two or three sibling components need the same value; lift to their common parent

3. Context
   → Infrequently changing value needed across a subtree (theme, locale, auth status)
   → NOT suitable for frequently updating values (causes re-renders across the tree)

4. External store (Zustand)
   → Complex shared client state with frequent updates
   → Multiple parts of the app react to the same state changes

5. Server state (React Query / SWR)
   → Data that lives on the server; needs fetch, cache, sync, and background refresh
   → Keep entirely separate from client state
```

**Do not reach for Zustand or React Query until you have hit the limitation of the level above.**

---

## Context — when and how

```tsx
// contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Stable reference; value rarely changes — context is appropriate here
  const value = useMemo<AuthContextValue>(
    () => ({ user, signOut: () => setUser(null) }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook that enforces provider presence
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**Rules:**
- Wrap context value in `useMemo` to prevent consumer re-renders on parent renders
- Provide a custom hook with a provider guard; never use `useContext` directly outside the context file
- Split contexts by update frequency — auth and theme are infrequent; form state is not a context concern

---

## Compound components

Use when a set of components share implicit state and are always used together.

```tsx
// Tabs compound component — shared state stays internal
interface TabsProps { children: ReactNode; defaultTab?: string }

export function Tabs({ children, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? '');
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div role="tablist">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.Tab = function Tab({ id, label }: { id: string; label: string }) {
  const { active, setActive } = useTabsContext();
  return (
    <button
      role="tab"
      aria-selected={active === id}
      onClick={() => setActive(id)}
    >
      {label}
    </button>
  );
};
```
