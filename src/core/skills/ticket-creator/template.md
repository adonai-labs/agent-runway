# Ticket Format — Human + Agent Readable

This template produces tickets that serve two audiences simultaneously:
- **Human readers** (PO, dev, QA) — read Summary → Scope → ACs and stop
- **Agent readers** (`lead`, `ticket-eval`) — read everything, including `Agent Notes`

Narrative sections use free prose. Structured sections use consistent, parseable formats.

---

## Generic Template

```markdown
# [TICKET-KEY]: [Summary — concise, action-oriented, ≤10 words]

## Summary
[One sentence describing what this delivers and who it benefits.]

## Source Intake
- Source type: [improvement | issue | incident | request]
- Source reference: [ticket/link/file/chat]
- Problem signal: [symptom or pain]
- Desired outcome: [what success looks like]

## User Story
As a [specific role],
I want [specific capability],
So that [concrete benefit].

## Scope

**Includes**
- [Specific deliverable 1]
- [Specific deliverable 2]
- [Specific deliverable 3]

**Excludes**
- [Related item explicitly deferred — link ticket if exists]
- [Related item explicitly deferred]

## Proposed Solution Structure
Concrete folder and file layout for this ticket (new files, touched files, modules). Use a tree; must align with project conventions and any parent spec.

```text
[example: src/...]
```

## Chosen Approach
- Approach: [name]
- Why this approach: [short rationale]
- Alternatives checked: [1-2 options or "captured in parent spec"]

## Acceptance Criteria
Each criterion is testable and maps to a test. Append `Verified by: <test path or id>`, or `pending` until the test exists.
- [ ] **[Scenario name]** — Given [precondition] → [expected outcome] — Verified by: [test path/id | pending]
- [ ] **[Scenario name]** — Given [precondition] → [expected outcome] — Verified by: [test path/id | pending]
- [ ] **[Error/edge case]** — Given [precondition] → [expected outcome] — Verified by: [test path/id | pending]

## Agent Notes
- **Relevant area**: [module, service, DB collection, API endpoint]
- **Constraint**: [behavioural rule the implementation must respect]
- **Existing pattern**: [follow X in Y — tells the agent where to look]
- **API / schema changes**: [specific changes needed, named precisely]
- **Risks / edge cases**: [what to watch out for during implementation]
- **Open items**: [unresolved questions that may affect implementation — flag owner]
- **Out of scope**: [explicit exclusions for the agent — prevents over-building]

## Validation
- Test [happy path scenario]
- Test [error / failure scenario]
- Test [edge case]
- Regression risk: [Low / Medium / High] — [brief reason]
- Decision risk: [Low / Medium / High] — [impact x reversibility x uncertainty]
```

## Markdown filename convention

When saving to disk, follow **Artefact naming** in the skill: `.agent-runway/specs/<implementation-slug>/tickets/task-<nn>-<ticket-slice-slug>.md`. Do not use bare `ticket.md` or a filename with no ticket description.

---

## Example — PROJ-201

> This example uses the reduced scope agreed during refinement.
> Excluded items (retry logic, notification preferences, email templates) to be captured as separate tickets.

```markdown
# PROJ-201: Email Notifications for Order Status Changes

## Summary
Send email notifications to customers when their order status changes (confirmed, shipped, delivered) with order details and tracking information.

## User Story
As a customer,
I want to receive email notifications when my order status changes,
So that I stay informed about my purchase without having to check the website repeatedly.

## Scope

**Includes**
- Email sent on order status change: `confirmed`, `shipped`, `delivered`
- Email contains: order number, status, timestamp, items summary, tracking link (if shipped)
- Notification triggered from order status update API endpoint
- Email sent asynchronously via background job queue
- Failed email attempts logged with order ID and error details
- Email template uses company branding (logo, colors, footer)
- One email per status change — no duplicate emails for the same status

**Excludes**
- Email retry logic and dead letter queue handling (separate ticket)
- User notification preferences / opt-out functionality (PROJ-205)
- Custom email templates per user or order type (PROJ-208)
- SMS notifications (PROJ-210)
- In-app notification center (PROJ-215)
- Email delivery tracking and open rates (separate ticket)
- Multi-language email support (decision pending — Product Lead)

## Acceptance Criteria
- [ ] **Order confirmed** — Given order status changes to `confirmed` → email sent with order summary and estimated delivery date — Verified by: pending
- [ ] **Order shipped** — Given order status changes to `shipped` → email sent with tracking number and carrier link — Verified by: pending
- [ ] **Order delivered** — Given order status changes to `delivered` → email sent with delivery confirmation and feedback request link — Verified by: pending
- [ ] **Email content** — Given any status change email → contains order number, current status, timestamp, items list, and relevant action link — Verified by: pending
- [ ] **No duplicates** — Given order status updated multiple times to same status → only one email sent per unique status change — Verified by: pending
- [ ] **Failed email logged** — Given email service fails → error logged with order ID, customer email, status, and error message; order processing continues — Verified by: pending

## Agent Notes
- **Relevant area**: Order Service (backend); Email Service (external); background job queue; PostgreSQL `orders` and `notifications` tables
- **Constraint**: email sending must not block order status updates — use async job queue; failed emails must not cause order API to fail
- **Existing pattern**: follow notification patterns in User Registration flow; reuse existing email service client and job queue infrastructure
- **API: PATCH /orders/{id}/status** — update to trigger notification job after status persisted
- **Queue: order-notifications** — new job queue for email notifications; processes jobs via background worker
- **Schema: notifications table** — new table with columns: `id`, `order_id`, `customer_email`, `notification_type`, `status`, `sent_at`, `error_message`, `created_at`
- **Schema: orders.last_notified_status** — new column tracking last status for which email was sent (prevents duplicates)
- **External service: SendGrid API** — existing integration; use transactional email templates; API key in environment config
- **Email templates**: three new templates (confirmed, shipped, delivered) — created in SendGrid dashboard by Marketing team
- **Migration: Add notifications table and orders column** — backward compatible; existing orders default `last_notified_status` to `null`
- **Risks / edge cases**: high order volume could overwhelm email service rate limits; email service downtime should not block orders; duplicate emails if job retried
- **Open items**:
  - Email template designs pending approval (owner: Marketing Team)
  - SendGrid rate limits confirmation (owner: DevOps Lead)
  - Decision on whether cancelled orders should send notification (owner: Product Lead)
- **Out of scope for this ticket**: retry logic, user preferences, custom templates, SMS, in-app notifications, delivery tracking

## Validation
- Test order confirmed → email received with correct order details
- Test order shipped → email received with tracking link
- Test order delivered → email received with feedback link
- Test same status updated twice → only one email sent
- Test email service down → error logged, order status still updated successfully
- Test all email templates render correctly with order data
- Regression risk: Medium — adds new database table and modifies order status update flow
```
