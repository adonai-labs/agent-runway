---
name: react-core
description: React implementation guidance — stack-specific. Covers project structure, component patterns, state management, testing with React Testing Library, security, accessibility, and performance for React 19 SPAs (Vite). Use when the user asks about React-specific structure, hooks, state decisions, testing strategy, or production concerns. Invoke via @react-core after `agent-runway add react`. Combines with typescript-core for type patterns and architect for design reasoning.
---

# React Core

Scope: React 19 SPA (Vite). Server Components and SSR are framework concerns (Next.js, React Router framework mode) and out of scope here.

## How to invoke

After `agent-runway add react`, the skill is installed into each configured agent's skills directory as `react-core`. Use:

- **Cursor:** `@react-core` or ask a React question while editing `*.tsx` / `*.jsx` (rules auto-attach)
- **Claude Code / other agents:** invoke the `react-core` skill by name, or ask in context of React files

Examples:
- How should I structure this feature's components?
- When should I use context vs Zustand vs React Query?
- How do I test this hook without rendering a component?
- Is this memoisation justified?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Guiding principles

Simplicity first. React's mental model is already a good guide — follow it rather than fighting it.

- Start with the simplest state and structure that works; add layers only when complexity demands it
- Composition over configuration; small, focused components over large multi-responsibility ones
- SOLID applies: SRP means one reason to render, DIP via props and hooks rather than direct coupling
- DRY for business logic in hooks and services; duplication in JSX is often acceptable
- Measure before memoising — prefer the React Compiler; add `React.memo`, `useMemo`, `useCallback` by hand only when profiling shows benefit
- Accessibility is not optional — semantic HTML and ARIA are part of the implementation, not an afterthought

---

## What this skill helps with

- Project and feature structure scaled to complexity
- Component patterns — functional, composition, compound, controlled/uncontrolled
- State management decisions — local state, context, Zustand, React Query
- Custom hooks — extracting logic, cleaning up, dependency management
- Testing with React Testing Library — components, hooks, context, async
- Security: XSS, `dangerouslySetInnerHTML`, input validation
- Accessibility: semantic HTML, ARIA, keyboard navigation, focus management
- Performance: memoisation strategy, code splitting, virtualisation

---

## Skill files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Project structure, feature organisation, routing, naming |
| [patterns.md](patterns.md) | Component patterns, hooks, state management decisions |
| [testing.md](testing.md) | RTL setup, component tests, hook tests, MSW, accessibility |
| [security.md](security.md) | XSS, CSP, input validation, dependency audit |
| [observability.md](observability.md) | Error boundaries, logging, performance monitoring |
| [reference.md](reference.md) | Toolchain, Vite config, common commands |

---

## Related

- `typescript-core` — type patterns for props, hooks, and service layers
- `code-review` — `searches-react.md` and `commands-react.md` (installed into the code-review skill) for stack-specific review passes
- Rules: `{{rules}}/react.mdc` auto-attaches on `*.tsx` / `*.jsx`; `{{rules}}/testing-react.mdc` on test files
