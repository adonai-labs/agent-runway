# Epic: Multi-tenant Isolation Enforcement

## Epic Goal
Deliver enforceable and auditable tenant isolation for scoped business resources across API, application, and persistence layers.

## Why Now
- Enterprise customers have raised tenant-separation requirements in procurement.
- Security posture review identified inconsistent isolation patterns.
- Upcoming compliance audit requires demonstrable boundary enforcement controls.

## Business Outcomes
- Reduced risk of cross-tenant data exposure.
- Stronger enterprise readiness for regulated customers.
- Reusable isolation pattern for future modules.

## Scope Includes
- Tenant context extraction and validation.
- Tenant authorization policy at API boundary.
- Tenant propagation in application handlers/use-cases.
- Tenant-scoped repository contracts and filtering.
- Integration test matrix for allow/deny tenant scenarios.
- Audit-friendly denied-access logging with correlation IDs.

## Scope Excludes
- Tenant billing/plan enforcement.
- Tenant onboarding/provisioning.
- Data residency and sharding strategy.
- Tenant theming/personalization.

## Success Criteria
1. All scoped repository access paths require explicit tenant context.
2. Cross-tenant reads/writes are blocked with 403 across covered resources.
3. Integration test suite passes for at least 3 scoped entities (customer/order/invoice).
4. No regressions in shared, non-tenant endpoints after rollout.

## Risks
- Legacy code paths may bypass new repository contracts.
- Internal asynchronous flows may miss tenant propagation.
- Canary rollout could surface claim-shape inconsistencies.

## Dependencies
- Auth identity includes trusted tenant claim.
- Logging pipeline supports correlation IDs.
- Test environments include seeded multi-tenant fixtures.
- Feature-flag system available for staged rollout.

## Delivery Plan (Epic + Tickets)
1. `task-01-multi-tenant-isolation-api-tenant-context.md`  
   Add tenant context extraction + API fail-closed policy.
2. `task-02-multi-tenant-isolation-application-propagation.md`  
   Require TenantContext in handlers/use-cases.
3. `task-03-multi-tenant-isolation-repository-filtering.md`  
   Harden repository contracts + tenant filter enforcement.
4. `task-04-multi-tenant-isolation-integration-tests-and-audit-logs.md`  
   Add integration tests + denied-access observability evidence.

## Exit Criteria
- All four tickets delivered and accepted.
- Security review signs off fail-closed behavior.
- Rollout checklist complete (staging + canary + production).
