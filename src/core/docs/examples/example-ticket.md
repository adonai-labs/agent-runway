# Example Ticket (task-01-multi-tenant-isolation-enforcement)

## Objective
Enforce tenant isolation for customer/order access paths.

## Scope Includes
- Tenant context middleware/policy
- Handler contract updates
- Repository tenant filters
- Integration tests

## Scope Excludes
- Billing/provisioning
- Cross-tenant support overrides

## Acceptance Criteria
1. Missing tenant context -> 401/403 before handler execution.
2. Tenant A cannot access tenant B resources (403).
3. Tenant A can access tenant A resources (200).

## QA Notes
- Validate at least two tenants.
- Include negative read/write tests.
- Verify no regression on non-tenant endpoints.

