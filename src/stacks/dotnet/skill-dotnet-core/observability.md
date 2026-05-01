# dotnet-core/observability.md

# Observability for .NET Core

## Purpose
This file captures practical observability guidance for .NET Core backend systems.

Use this file when:

- designing or reviewing telemetry strategy
- working with ASP.NET Core services, background jobs, or distributed workflows
- deciding what to log, trace, or measure
- improving production diagnostics
- evaluating health checks, correlation IDs, and runtime visibility

Observability is not decoration.
It is part of the system’s operability.

Universal principles about operability and failure should remain in `architect/`.
This file focuses on .NET Core implementation guidance and practical patterns.

---

## 1. Core principles

### Observability should be designed, not added later
Do not wait for incidents to discover what the system should have exposed.

### Favor useful signals over noisy telemetry
More telemetry is not automatically better.
Signals should help answer:
- what happened
- where it happened
- why it happened
- what is affected
- what to do next

### Make important workflows visible end to end
Visibility matters most where:
- business-critical commands run
- async workflows exist
- retries or compensations happen
- multiple dependencies participate
- failures create user impact

### Logs, metrics, and traces serve different purposes
Use them intentionally instead of expecting one signal type to solve everything.

---

## 2. Logging

### Use structured logging
Log with named properties, not only interpolated text.
This makes logs queryable and operationally useful.

### Log meaningful domain and workflow events
Examples:
- request started and completed
- command accepted and completed
- job started, retried, failed, or finished
- external provider call failed
- business state transition occurred

### Avoid log spam
Do not log every line of normal flow.
Over-logging hides important signals and increases cost.

### Include enough context
Useful log context often includes:
- correlation ID or trace ID
- relevant business identifier
- operation or workflow name
- dependency name
- failure classification where relevant

### Do not log sensitive data
Avoid passwords, tokens, full PII, secrets, or hidden internal details.

### Recommendation
Every important failure should produce logs that help an operator understand scope and next steps.

---

## 3. Correlation and traceability

### Use correlation identifiers consistently
A request or workflow should be traceable across boundaries.

### Propagate correlation through:
- incoming HTTP requests
- internal commands where practical
- background jobs
- outgoing HTTP calls
- messaging and event handlers

### Good practice
- preserve incoming correlation if present
- create one if absent
- enrich logs with it consistently

### Warning signs
- logs exist, but one user action cannot be followed across components
- async work loses request identity
- incident analysis depends on timestamps alone

### Recommendation
Correlation is the minimum viable observability for distributed or asynchronous workflows.

---

## 4. Distributed tracing

### Use tracing when workflows span multiple components
Tracing is especially valuable when:
- a request touches several services
- external dependencies contribute latency
- async handoffs are important
- operators need critical path visibility

### Good practice
- trace meaningful spans, not every tiny internal method
- name spans by business-relevant operation where possible
- include useful tags and status information
- connect HTTP, messaging, and background job boundaries when practical

### Warning signs
- traces exist but do not align with business flow
- there are too many spans to understand the request
- errors are visible only as generic failures without context

### Recommendation
Trace major operations and boundary crossings.
Do not turn tracing into low-value noise.

---

## 5. Metrics

### Use metrics for trends, thresholds, and service health signals
Metrics are useful for:
- request rate
- latency
- error rate
- dependency failure rate
- queue depth
- retry count
- job duration
- business throughput indicators

### Prefer metrics that support action
Good metrics answer:
- is the system healthy
- what is degraded
- where should we look next
- how is workload changing

### Avoid vanity metrics
Not every counter is useful.
If no one would act on the metric, question its value.

### Recommendation
Start with a small, useful metric set.
Expand only where operators need more visibility.

---

## 6. ASP.NET Core request visibility

### Make incoming requests observable
Important request-level visibility often includes:
- method
- route or endpoint name
- duration
- status code
- correlation ID
- authentication context where appropriate and safe
- dependency calls and major downstream failures

### Do not rely only on server-level success metrics
A service may return `200` frequently while user-important workflows still fail deeper in the process.

### Recommendation
Expose request behavior in a way that supports both product understanding and incident response.

---

## 7. Background jobs and async workflows

### Background work must be observable as first-class system behavior
A job or async workflow should expose:
- identity
- status
- start and end time
- retry count
- failure reason
- triggering correlation where relevant

### Good practice
- log state transitions
- emit metrics for throughput, failures, retries, and duration
- trace handoffs where the tooling supports it
- persist enough state for operator visibility if the workflow is important

### Warning signs
- operators cannot answer whether a job is stuck
- retries happen invisibly
- users ask support for job status and there is no clear source of truth

### Recommendation
Treat background processing as a user-impacting workflow, not hidden infrastructure plumbing.

---

## 8. Dependency observability

### External dependencies should be visible individually
Examples:
- SQL database
- message broker
- payment provider
- storage provider
- email provider
- third-party APIs

### Good signals
- latency
- failure rate
- timeout rate
- retry volume
- saturation or queueing indicators where relevant

### Warning signs
- all downstream failures collapse into one generic “service error”
- latency problems are visible only at the top-level request
- provider-specific incidents are hard to isolate

### Recommendation
Instrument dependencies so operators can distinguish internal failures from external pressure.

---

## 9. Error visibility

### Make errors diagnosable without leaking internals
Useful error telemetry should include:
- category
- source component
- affected workflow
- correlation reference
- whether the error is transient, validation-related, authorization-related, or unexpected

### Distinguish expected failure from unexpected failure
Examples of expected failure:
- validation rejected
- resource not found
- business rule conflict

Examples of unexpected failure:
- null state
- provider outage
- serialization failure
- unhandled exception

### Recommendation
Observability should help responders prioritize quickly, not treat every issue as equal.

---

## 10. Health checks

### Separate liveness and readiness
Liveness answers:
- should the process be restarted?

Readiness answers:
- should this instance receive traffic?

### Good readiness checks
Readiness should reflect whether the service can handle useful work, not whether every optional dependency is perfect.

### Avoid fragile health checks
A check that constantly flaps may reduce reliability rather than improve it.

### Warning signs
- the system reports healthy while critical workflows are failing
- the readiness probe fails because of non-critical optional dependencies
- health checks create noticeable load on their own

### Recommendation
Health checks should support routing and recovery decisions, not provide false reassurance.

---

## 11. OpenTelemetry and ecosystem guidance

### Use OpenTelemetry where it helps standardize telemetry
OpenTelemetry can be a strong choice when:
- services need consistent traces and metrics
- multiple components should share a telemetry model
- the organization already relies on compatible tooling

### Keep the model intentional
Adopting OpenTelemetry does not remove the need to choose:
- what to trace
- what to measure
- which properties matter
- which workflows deserve first-class visibility

### Recommendation
Use platform support and shared standards, but keep business-critical visibility explicit.

---

## 12. Log and telemetry hygiene

### Keep names and dimensions consistent
Use stable naming for:
- endpoints
- jobs
- workflow states
- dependency names
- error categories

### Avoid cardinality explosions
Do not attach highly unique or unbounded values to metrics dimensions.

### Retain enough information to support investigation
But avoid storing unsafe or low-value data indefinitely.

### Recommendation
Observability quality depends on discipline, not just instrumentation volume.

---

## 13. Alerting mindset

### Alerts should represent actionable conditions
Alert on things that need human attention, not on every anomaly.

### Useful alert categories
- sustained error rate increase
- dependency outage
- queue backlog growth
- repeated job failure
- health degradation with user impact
- latency breach on important workflows

### Avoid noisy alerts
Alert fatigue makes real incidents harder to detect.

### Recommendation
Use alerts to surface operationally meaningful conditions, not to mirror every metric.

---

## 14. Observability review checklist

Use these questions when reviewing observability:

- Can we trace a user-important workflow end to end?
- Are key actions logged with structured context?
- Are correlation IDs present and propagated?
- Do async jobs expose status, retries, and failure clearly?
- Can we distinguish dependency failure from internal failure?
- Are metrics focused on actionability?
- Do health checks reflect meaningful runtime state?
- Is sensitive data excluded from logs and telemetry?
- Would an operator be able to answer “what happened?” quickly?
- Would an incident responder know where to look next?

---

## 15. Recommended minimum baseline

For most production .NET Core services, the minimum practical baseline should include:

- structured request logging
- correlation ID propagation
- error logging with stable categories
- latency and error metrics
- dependency visibility for major external calls
- readiness and liveness checks
- observability for background jobs if they exist
- tracing for distributed or high-value workflows

If the service is critical, asynchronous, or distributed, go beyond the minimum baseline early.