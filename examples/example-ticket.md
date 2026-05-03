# task-01-multi-tenant-isolation-enforcement.md

## Type
Feature

## Objective
Enforce tenant isolation for customer and order resources by requiring tenant context at API entry and persistence access.

## Business Context
Current flows allow inconsistent tenant checks. This ticket establishes mandatory boundary checks and repository filtering to eliminate cross-tenant exposure risk.

## Scope Includes
- API middleware/policy to resolve and validate tenant context.
- Application handler updates to require TenantContext.
- Repository updates to enforce `tenant_id` filtering for customer and order reads/writes.
- Integration tests for allowed and denied tenant access.

## Scope Excludes
- Billing and subscription logic.
- Tenant provisioning flows.
- Support/admin cross-tenant override behavior.

## Dependencies
- Auth provider emits trusted tenant claim.
- Feature flag `tenant_isolation_enforced` available.
- QA environment seeded with at least two tenants.

## Proposed Solution Structure
```text
src/
  api/
    middleware/
      tenant-context.ts
      tenant-policy.ts
  application/
    shared/
      tenant-context.ts
    customers/
      get-customer.handler.ts
    orders/
      create-order.handler.ts
  infrastructure/
    persistence/
      repositories/
        customer-repository.ts
        order-repository.ts
tests/
  integration/
    tenant-isolation/
      customer-isolation.test.ts
      order-isolation.test.ts
```

## Acceptance Criteria
1. Given a request without tenant claim, when accessing tenant-scoped endpoint, then response is 401/403 and handler is not executed.
2. Given tenant A identity, when requesting tenant B customer/order, then response is 403 without leaking resource existence.
3. Given tenant A identity, when requesting tenant A customer/order, then response is 200 with expected payload.
4. Given repository calls for scoped entities, when tenant context is missing, then execution is blocked by contract/guard.
5. Given shared non-tenant endpoint, when request is valid, then behavior is unchanged from baseline.

## QA Notes
- Cover positive and negative cases for both customer and order resources.
- Validate API responses do not include stack traces or internal identifiers on denied access.
- Confirm audit logs include correlation ID, actor, tenant, target tenant, and decision.
- Run regression smoke tests on non-tenant endpoints.

## Delivery Checklist
- [ ] Middleware + policy implemented.
- [ ] Handlers updated with TenantContext contract.
- [ ] Repositories enforce `tenant_id` predicate.
- [ ] Integration tests added and passing.
- [ ] Security review checklist completed.

## Risks and Mitigations
- **Risk**: legacy access path bypasses updated repository.  
  **Mitigation**: static search for unscoped repository calls in changed module.
- **Risk**: malformed tenant claim triggers false denials.  
  **Mitigation**: add diagnostics for claim parsing and canary rollout observation.
