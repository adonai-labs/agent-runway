# Multi-tenant Data Isolation Spec

## Status
Proposed

## Type
Feature

## Executive Intent
Protect tenant data boundaries end-to-end by enforcing `tenant_id` isolation in API authorization, application orchestration, and persistence access paths.

## Business Context
The platform is sold to multiple organizations under a shared deployment model. Enterprise procurement requires explicit tenant isolation controls to reduce risk of accidental cross-tenant exposure and support compliance evidence in audits.

## Problem Statement
Current resource access paths rely on mixed isolation patterns:
- some APIs trust route-level checks only,
- some repositories apply tenant filters,
- some legacy paths omit tenant scoping entirely.

This inconsistency creates high-risk failure modes where a valid authenticated user could access another tenant's records.

## Success Metrics
- 0 cross-tenant data access findings in integration test suite.
- 100% tenant-scoped repository methods require explicit tenant context.
- 100% scoped API endpoints enforce tenant authorization policy before business logic execution.
- 0 regressions on shared non-tenant endpoints in smoke tests.

## In Scope
- Tenant context extraction from authenticated identity.
- Tenant authorization middleware/policy in API layer.
- Tenant context propagation through application handlers/use-cases.
- Repository-level tenant filtering for scoped entities (`customer`, `order`, `invoice`).
- Automated integration tests for allow/deny scenarios.

## Out of Scope
- Tenant billing, quota, and subscription logic.
- Tenant creation/provisioning workflows.
- Tenant branding and theme personalization.
- Historical backfill/migration of already-corrupted data.

## Requirements
1. Every tenant-scoped API endpoint must require resolved tenant context before invoking application logic.
2. Every tenant-scoped repository call must include `tenant_id` as a required argument.
3. Cross-tenant read/write attempts must return `403` and must not leak resource existence metadata.
4. Service-to-service internal calls must carry validated tenant context (no optional fallback to global scope).
5. Logs for denied access must include correlation ID and tenant identifiers, excluding sensitive payloads.

## Architectural Decisions
1. **TenantContext as explicit dependency**  
   Use a typed `TenantContext` object passed through application boundaries, not ambient globals.

2. **Fail-closed policy**  
   Missing tenant context is treated as authorization failure, never as default tenant.

3. **Repository contract hardening**  
   Tenant-scoped methods become explicit contract methods; unscoped variants are removed or limited to system-only paths.

## Trade-offs
- **Pros**: deterministic isolation, easier reviewability, stronger audit posture.
- **Cons**: broader refactor surface in existing handlers; potential short-term delivery slowdown.
- **Decision**: accept short-term refactor cost to remove long-term data exposure risk.

## Proposed Solution Structure
```text
src/
  api/
    middleware/
      tenant-context.ts
      tenant-policy.ts
    routes/
      customers/
      orders/
      invoices/
  application/
    shared/
      tenant-context.ts
    customers/
      get-customer.handler.ts
    orders/
      create-order.handler.ts
  domain/
    shared/
      tenant-id.ts
  infrastructure/
    persistence/
      repositories/
        customer-repository.ts
        order-repository.ts
        invoice-repository.ts
tests/
  integration/
    tenant-isolation/
      customer-isolation.test.ts
      order-isolation.test.ts
      invoice-isolation.test.ts
```

## Implementation Slices
1. **Boundary Enforcement**  
   API middleware + policy integration.
2. **Application Propagation**  
   TenantContext required in handler contracts.
3. **Persistence Hardening**  
   Repository signatures and query filters.
4. **Validation and Observability**  
   Integration tests, denied-access audit logs, regression smoke tests.

## Rollout Strategy
- Feature flag: `tenant_isolation_enforced`.
- Stage rollout: test -> staging -> canary production tenant -> full rollout.
- Rollback: disable flag and revert to previous repository access adapter while maintaining audit logging.

## Quality Gates
- [ ] Build/type-check/lint passes.
- [ ] Integration tests for allow/deny isolation scenarios pass.
- [ ] Security review confirms fail-closed behavior.
- [ ] Code review verifies no tenant-scoped repository method can be called without context.

## Acceptance Criteria (Given/When/Then)
1. **Missing Tenant**
   - Given an authenticated request without tenant claim,
   - When calling a tenant-scoped endpoint,
   - Then API returns 401/403 and no business handler executes.

2. **Cross-tenant Read Denied**
   - Given user context for tenant A,
   - When requesting customer/order/invoice belonging to tenant B,
   - Then API returns 403 without revealing whether resource exists.

3. **Same-tenant Access Allowed**
   - Given user context for tenant A,
   - When requesting tenant A resources,
   - Then request succeeds with expected payload.

4. **Repository Contract Enforcement**
   - Given repository method for scoped entity,
   - When invoked without tenant context,
   - Then compile-time or runtime guard prevents execution.

## Risks and Mitigations
- **Risk**: Legacy handlers bypass new contracts.  
  **Mitigation**: add static search checks + PR checklist for unscoped repository calls.

- **Risk**: False-positive authorization failures due to malformed claims.  
  **Mitigation**: add claim validation diagnostics and staged rollout.

## Open Questions
- Should support/admin override access be supported in this release or tracked as separate audited capability?
- Do internal async jobs always receive tenant context today, or is envelope enrichment needed first?
