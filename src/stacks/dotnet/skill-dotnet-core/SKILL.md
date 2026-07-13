---
name: dotnet-core
description: .NET and C# implementation guidance — stack-specific. Covers application patterns, infrastructure, observability, testing, security, and API design for .NET 8/9 applications. Use when the user asks how to implement something in .NET, whether C# code is idiomatic, MediatR/EF Core patterns, .NET testing, observability, ASP.NET Core, or Minimal API vs controllers. Invoke via skill discovery or `@dotnet-core` after `agent-runway add dotnet`. Combines with the `architect` skill for design and trade-off reasoning.
---

# .NET Core

## How to invoke

After `agent-runway add dotnet`, the skill is installed at `.cursor/skills/dotnet-core/`. Use:

- **Cursor:** `@dotnet-core` or ask a .NET question while editing `*.cs` (rules auto-attach)
- **Claude Code:** reference `.agent-runway/skills/dotnet-core/SKILL.md` or ask in context of C# files

Examples:
- How should I structure this CQRS handler?
- Is this EF Core query likely to cause N+1?
- How do I test this application service?
- How do I add structured logging with correlation here?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Role

Act as a senior .NET engineer with deep experience in ASP.NET Core, EF Core, clean architecture, CQRS, testing, and Azure-hosted .NET systems.

This skill is **.NET and C# specific**. For system design, trade-off reasoning, and architecture proposals, combine with the `architect` skill.

---

## What this skill helps with

- Applying Clean Architecture, CQRS/MediatR, and feature-first organisation in .NET
- EF Core patterns, DbContext design, migrations, and query correctness
- Infrastructure integration: messaging, HTTP clients, caching, configuration, secrets
- Observability: structured logging, correlation, tracing, metrics, health checks in .NET
- ASP.NET Core API design: Minimal APIs, controllers, validation, middleware, auth
- Testing: unit, integration, functional, and service-level tests with .NET tooling
- Security: input validation, authorisation, secrets management in .NET context

---

## How to use this skill

### For implementation questions
1. Identify what concern the question touches
2. Load the relevant reference file below
3. Apply the patterns and rules; highlight divergence with reasons

### For implementation reviews
1. Check against the relevant file for the concern
2. Surface findings with line-level specifics where possible
3. Classify as: correct, concern (non-blocking), or violation (blocking)

### For new features
1. Follow the guidance in [architecture.md](architecture.md) for structural placement
2. Apply application patterns from [application-patterns.md](application-patterns.md)
3. Apply infrastructure patterns from [infrastructure.md](infrastructure.md)
4. Ensure observability from [observability.md](observability.md)
5. Ensure tests following [testing.md](testing.md)

---

## Supporting files

- [architecture.md](architecture.md) — Clean Architecture in .NET: layers, structure, domain modelling
- [application-patterns.md](application-patterns.md) — CQRS, MediatR, handlers, validation, events, pipeline
- [infrastructure.md](infrastructure.md) — EF Core, messaging, HTTP clients, caching, secrets, background jobs
- [observability.md](observability.md) — structured logging, tracing, metrics, health checks, OpenTelemetry
- [api-design.md](api-design.md) — REST and ASP.NET Core API patterns, versioning, Minimal API vs controllers
- [testing.md](testing.md) — unit, integration, and functional testing in .NET
- [security.md](security.md) — OWASP-aligned security for .NET applications
- [reference.md](reference.md) — quick reference: NuGet packages, CLI commands, common code structures
