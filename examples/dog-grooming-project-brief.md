---
blueprint:
  documentId: DOC-DEMO.PROJECT-BRIEF
  documentType: project-brief
  schemaVersion: 1.0.0
  templateVersion: 3.0.0
  status: draft
  owner: Unassigned
  authors: []
  reviewers: []
  approvers: []
  generatedAt: '2026-10-23T00:00:00.000Z'
  updatedAt: '2026-10-23T00:00:00.000Z'
  classification: public
  sourceRefs: [DEMO-INPUT]
  sourceHashes: {}
  assumptions:
    - One groomer reviews requests manually; confirm with the real business owner.
  unknowns:
    - Service area, prices, budget, notification method, and launch date.
  relatedArtifacts: []
  supersedes: []
  humanReview:
    required: true
    status: not-started
---

# Project brief: mobile dog-grooming bookings

**Fictional worked example.** This is an authored demonstration of a developed draft, not raw generator output or a real business plan. No customer research, delivery, testing, or approval has occurred.

## Input and evidence

**DEMO-INPUT — illustrative input:** “I want a booking site for my mobile dog-grooming business. Customers should request an appointment, and I will confirm whether I can fit them in.”

Everything below is derived from that fictional input, explicitly assumed, or still unknown. It is not verified project evidence.

## Problem and options

**Derived:** The business needs a way to collect appointment requests without promising an available slot before the groomer reviews it.

**Proposed options:** Keep taking requests manually; add a request form with manual confirmation; or build automatic scheduling. Compare those options with the owner before choosing. The request form is the candidate scope for this example, not an approved decision.

## Objective and scope

**OBJ-001 — proposed:** Let a customer submit a grooming request and understand that confirmation is pending. Owner: unassigned; status: draft. Basis: DEMO-INPUT. Verify through the request-and-confirmation walkthrough below.

Candidate first release:

- A request form capturing enough information for the groomer to respond.
- A clear “request received; appointment not yet confirmed” message.
- A way for the groomer to review the request and confirm or decline it.

**Assumed exclusions:** Online payment, route optimization, customer accounts, and automatic availability are outside the first release. Confirm these boundaries with the owner.

## Candidate requirement and acceptance check

**REQ-001 — draft:** After a customer submits a valid request, the site must describe its state as pending until the groomer confirms it. Owner: unassigned; priority: proposed high; basis: DEMO-INPUT and OBJ-001.

**AC-001 — proposed acceptance criterion:** Given a submitted request that has not been reviewed, when the customer sees its acknowledgement, then the message says confirmation is pending and does not promise a booked appointment.

**TEST-001 — planned, not executed:** Submit a sample request and check the acknowledgement against AC-001. Also try an incomplete request and check that it gives useful correction instructions. Actual result and evidence: unknown.

Trace: OBJ-001 → REQ-001 → AC-001 → TEST-001.

## Risks and safeguards

**RISK-001 — assumed:** A customer may mistake a request for a confirmed appointment. Candidate safeguard: explicit pending wording. Residual risk and acceptance authority: unknown; validate wording with the owner and representative customers.

**RISK-002 — derived:** The request may include customer contact and location information. Collect only what the owner justifies; decide access, retention, and deletion before launch. Applicable privacy obligations and control evidence: unknown.

## Costs, measures, and governance

Budget, implementation effort, operating cost, baseline request volume, and success targets are **unknown**. Do not invent conversion rates or delivery dates. Ask the owner which booking problem matters and how they currently measure it.

Decision owner and reviewer are **unassigned**. No technical stack or vendor is selected. This draft does not authorize building or launching the service.

## Questions before implementation

1. What service area and appointment rules should the form enforce?
2. What customer and pet details are necessary for a request?
3. How should the groomer receive and answer requests?
4. Who owns the budget, launch decision, and customer data?

**Next decision requested:** Confirm or revise the candidate scope, name an owner, and answer these questions before turning this brief into implementation tasks.

[Back to the templates](../README.md#browse-the-templates) · [See the initial project-brief workbook](template-previews/14_project_brief.md)
