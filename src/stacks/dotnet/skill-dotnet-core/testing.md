# dotnet-core/testing.md

# Testing for .NET Core

## Purpose
This file defines practical testing guidance for .NET Core applications.

Use this file when:

- deciding what kind of test to write
- reviewing whether a test suite is well balanced
- designing code for testability
- testing ASP.NET Core endpoints, middleware, handlers, and infrastructure-backed flows
- choosing between unit, integration, functional, and service-level tests

Testing is not a coverage vanity exercise.
The goal is to create fast feedback for important behavior while preserving confidence in critical flows.

---

## 1. Core principles

### Tests are part of the system
Tests are not external decoration.
They should be designed as first-class system components.

### Design for testability
If business rules can only be tested through the UI, full HTTP stack, or real infrastructure, the design is usually too coupled.

### Do not depend on volatile things in core tests
GUI, framework plumbing, full hosting setup, and unstable infrastructure make tests slower and more fragile.
Important business behavior should be testable without them.

### Prefer a balanced test portfolio
Use different test types for different risks.
Do not try to solve every confidence problem with one kind of test.

### Focus tests on behavior, not structure
Tests should verify important outcomes and rules, not mirror every class and method mechanically.

---

## 2. What to test

### Test business rules most aggressively
The most valuable tests usually cover:
- invariants
- decision logic
- state transitions
- use-case rules
- failure conditions
- idempotency-sensitive behavior
- integration contracts that matter

### Test framework glue selectively
Do not over-test what ASP.NET Core, EF Core, or the runtime already guarantees.
Test your use of the framework where your configuration, pipeline, or composition creates risk.

### Test critical flows end to end
A small number of integration or functional tests should prove that the application works when assembled.

### Avoid spending most of the test budget on trivial pass-through code
If a component only forwards calls without meaningful behavior, its test value is usually low.

---

## 3. Test categories

## 3.1 Unit tests

### Purpose
Verify a small piece of behavior in isolation.

### Best targets
- domain entities
- value objects
- business rule services
- validators
- use-case handlers with mocked dependencies
- pure transformation logic

### Characteristics
- fast
- focused
- deterministic
- no real infrastructure
- no web server
- no real database
- no network

### Guidance
Prefer unit tests for business logic and stateful decision-making.

### Warning signs
- a “unit test” boots the whole application
- unit tests depend on timing or environment
- most assertions verify mocks instead of behavior

---

## 3.2 Integration tests

### Purpose
Verify that assembled components work together correctly.

### Best targets
- ASP.NET Core request pipeline
- endpoint-to-handler-to-persistence flows
- EF Core mappings and persistence behavior
- middleware behavior in the real pipeline
- serialization, routing, filters, auth wiring
- database-backed application flows

### Characteristics
- real app composition
- often real database or realistic infrastructure
- slower than unit tests
- fewer than unit tests
- high confidence for wiring and runtime behavior

### Guidance
Use integration tests to validate important application slices, not every permutation.

### Warning signs
- integration tests replace all unit tests
- they are so slow that developers stop running them
- they use fake infrastructure while claiming to validate real integration

---

## 3.3 Functional tests

### Purpose
Verify the application from a user or consumer perspective.

### Best targets
- important HTTP workflows
- externally visible behavior
- happy path and key failure path for major features
- cross-component outcomes

### Guidance
Functional tests should prove that the product behaves correctly, regardless of internal implementation.

### Warning signs
- functional tests assert too many internal details
- too many functional tests duplicate lower-level coverage
- the suite becomes brittle because it checks incidental formatting or implementation choices

---

## 3.4 Service or end-to-end tests

### Purpose
Verify multi-service or environment-level flows when one service alone is not enough.

### Best targets
- workflows spanning multiple services
- event-driven flows
- contract boundaries
- distributed operational behavior

### Guidance
These tests are expensive.
Use them for critical cross-service confidence, not routine local behavior.

### Warning signs
- every feature requires full environment startup
- failures are hard to localize
- the team relies on these tests because local design is not testable enough

---

## 4. Designing for testability

### Keep business rules independent from volatile delivery mechanisms
Business behavior should be testable without GUI, HTTP, or framework-heavy setup.

### Keep important behavior away from controllers and middleware when possible
Controllers and middleware should remain thin enough that business rules can be tested elsewhere.

### Use a testing API mindset
Tests should interact with stable behavioral seams rather than mirror the internal class structure too closely.

### Avoid structural coupling in tests
Do not create one test class per production class just because the class exists.
Test behavior and use cases, not the shape of the code tree.

### Prefer seams that allow tests to:
- bypass expensive infrastructure when the behavior under test does not require it
- force the system into important states
- verify business outcomes directly

---

## 5. Unit testing guidance for ASP.NET Core

### Controllers
Unit test controllers only for controller behavior:
- returned status/result types
- interaction with dependencies
- branching based on application results

Do not use controller unit tests to verify:
- routing
- model binding
- filters
- full middleware pipeline
- framework internals

### Middleware
Unit test custom middleware when it contains meaningful branching or response behavior.
Use integration tests when you need confidence in pipeline composition.

### Handlers and application services
These are often high-value test targets when they coordinate business use cases.

### Domain logic
This should usually have the highest density of unit tests.

---

## 6. Integration testing guidance for ASP.NET Core

### Prefer testing realistic slices
Good integration tests validate:
- HTTP request to endpoint
- endpoint to application logic
- persistence interaction
- serialization and status codes
- auth or validation wiring when relevant

### Use the ASP.NET Core test host for app-level integration tests
A test host gives good confidence without full network overhead.

### Reuse the real Startup or app configuration carefully
The closer the integration test is to real application composition, the more confidence it provides.
But ensure test setup still remains deterministic.

### Watch out for environment-specific setup
If views, configuration, content root, or environment assumptions are needed, configure them intentionally.

---

## 7. Database testing

### Test database-backed behavior where it matters
Examples:
- EF Core mappings
- query correctness
- transaction boundaries
- persistence side effects
- uniqueness or constraint-sensitive flows

### Prefer realistic DB testing for important persistence behavior
In-memory substitutes can be useful for some scenarios, but they should not give false confidence for provider-specific behavior.

### Use lightweight substitutes carefully
SQLite in-memory can be useful for many test scenarios, but it is still not identical to the production provider.

### Recommendation
For important persistence behavior, favor realistic integration tests over heavily mocked repositories.

---

## 8. Testcontainers and realistic infrastructure

### Use realistic dependencies when integration confidence matters
Containers are useful when you need:
- the real database engine
- message brokers
- provider behavior close to production
- isolated, repeatable infrastructure in tests

### Good use cases
- database integration tests
- messaging/outbox tests
- startup and migration verification
- external dependency contract checks using local containers

### Warning signs
- the setup becomes so heavy that developers stop running it
- containerized tests are used for trivial business logic
- the suite duplicates cheaper tests unnecessarily

### Recommendation
Use Testcontainers or equivalent realistic infrastructure selectively, for the flows where fidelity matters.

---

## 9. Test balance strategy

### A good default balance is:
- many unit tests for domain and business rules
- fewer integration tests for important slices
- a small number of functional tests for key user-facing flows
- very selective service-level or end-to-end tests

### Prefer confidence layering
Let:
- unit tests catch local rule breakage fast
- integration tests prove composition
- functional tests prove product behavior
- service tests prove distributed cooperation where needed

---

## 10. What to avoid

### Avoid over-mocking
If every test asserts only that mocks were called, the suite may stop proving meaningful behavior.

### Avoid structural test coupling
Tests should not break every time code is reorganized internally.

### Avoid brittle UI-like backend tests
If most backend confidence depends on full-stack, environment-heavy tests, feedback will slow down and fragility will rise.

### Avoid fake confidence from unrealistic infrastructure
A passing test against an unrealistic database or fake pipeline can be misleading.

### Avoid coverage obsession
High coverage with low-value assertions is worse than targeted coverage of critical behavior.

---

## 11. Practical recommendations for .NET Core projects

### Prefer xUnit as a pragmatic default
Use a mainstream framework with strong ecosystem support unless the team already has a better-established standard.

### Use `dotnet test` as the standard execution path
Tests should run consistently in local dev and CI.

### Use `WebApplicationFactory` or test host approaches for app-level integration
Prefer established ASP.NET Core testing primitives over hand-rolled hosting when possible.

### Use realistic DB tests for critical persistence
Especially where provider behavior matters.

### Keep the test suite fast enough to run often
A good test suite is one developers actually run.

---

## 12. Review checklist

Use these questions when reviewing testing strategy:

- Are core business rules tested directly?
- Are we testing behavior rather than code structure?
- Can important logic be tested without full infrastructure?
- Are unit tests focused and fast?
- Are integration tests validating real composition?
- Are database-backed flows tested realistically where needed?
- Are there a few high-value functional tests for critical workflows?
- Is the suite overly dependent on mocks?
- Is the suite overly dependent on slow end-to-end environments?
- Would this suite catch a meaningful regression quickly?