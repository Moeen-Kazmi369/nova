# NOVA ACE + ACEPLACE Workstation: Correct Integration Model

## Overview
NOVA ACE should be user-customizable with its own instructions and knowledge base. However, that customization must live in the task composition layer, not in the deterministic runtime layer.

**The Core Separation:**
- **ACEPLACE** is the execution runtime. It accepts tasks, creates execution envelopes, verifies canonical identity, acquires authority through leases, executes deterministic step flows, and persists artifacts and traces.
- It does **not** create identity, originate authority, or let chat flows become runtime control.

**The Runtime Law:**
`Execution Envelope → Runtime Worker → Agent Engine`
Agents are stateless. The envelope holds state.

---

## 1. What NOVA ACE Should Be
NOVA ACE is the conversational task composition layer for ACEPLACE Workstation.

### It should:
* Communicate with the user by voice or text.
* Use its own instructions and knowledge base.
* Reduce hallucination by grounding itself in that knowledge.
* Ask clarifying questions.
* Prepare the best possible task draft.
* Send that draft into the Task Composer.
* Convert approved work into a deterministic Execution Envelope.

### It should NOT:
* Create ACELOGIC identity.
* Issue execution authority.
* Acquire leases.
* Own runtime orchestration.
* Directly pass work agent-to-agent.
* Become the source of workflow truth (that belongs to the envelope and runtime).

---

## 2. User Configuration (Instructions & Knowledge)
Users must be able to add instructions and knowledge into NOVA ACE to make it a company-grounded intelligence layer.

### Configurable Instructions:
* Speaking style/tone (how NOVA ACE should speak).
* Request structuring.
* Domain-specific output preferences.
* Company tone and deliverable style.
* Risk and compliance preferences.
* Aggressiveness of follow-up questions.

### Configurable Knowledge Base:
* PDFs, product docs, white papers.
* Strategy docs, market research.
* Internal process docs, meeting notes.
* Brand and messaging docs.

**Note:** This configuration affects conversation, clarification, and task shaping. It must **not** affect canonical identity, fingerprint authority, lease enforcement, or the runtime state machine.

---

## 3. System Separation

### A. NOVA ACE Layer
* **Purpose:** Talk to user, understand intent, ask questions, use knowledge, produce high-quality task draft.
* **Output:** `TaskDraft`

### B. Task Composer Layer
* **Purpose:** Show drafted task, allow user editing/approval, attach files, preview target agents/flow.
* **Output:** Approved structured task.

### C. Envelope Builder
* **Purpose:** Convert approved task into canonical Execution Envelope.
* **Adds:** Identity context, authority context, execution context, step graph, step hashes, attachments, `#us#` wrapper metadata.

### D. ACEPLACE Runtime
* **Purpose:** Verify identity, acquire authority lease, execute deterministic flows, persist artifacts/traces, send continuity events.

---

## 4. The Most Important Architecture Rule
**NOVA ACE is a control-plane conversational interface, NOT a runtime executor.**

* **Web Tier Allowed:** Receive tasks, create/enqueue envelopes, display status/artifacts/governance.
* **Web Tier Forbidden:** Run runtime loop, hold runtime leases, execute steps, claim execution ownership.

**The Flow:**
`User ↔ NOVA ACE ↔ Task Composer → Envelope Builder → ACEPLACE Runtime`

---

## 5. ACEPLACE Voice Command Experience
The best version is a voice conversation with NOVA ACE that helps refine the request until it is strong enough.

1. **Voice Conversation:** Refines request using configured instructions/knowledge.
2. **Task Composer:** Produces a composed task (objective, audience, deliverable, priorities, agents, etc.).
3. **Execution Envelope:** Only after user approval is the envelope built and handed to runtime.

---

## 6. NOVA ACE Profile Configuration
Each user/workspace can create a NOVA ACE profile:
* **Profile Name**
* **Instructions**
* **Knowledge Collection Bindings**
* **Voice Provider & Model** (e.g., OpenAI Voice, realtime, alloy)
* **Speaking Style & Domain Focus**
* **Output Preferences & Safety Rules**
* **Clarifying-question Behavior**

---

## 7. Output Contract: `TaskDraft`
NOVA ACE outputs a `TaskDraft`, not a runtime command.

**Example Schema:**
```json
{
  "task_draft_id": "draft_001",
  "title": "Create slide deck for NVIDIA engineering meeting",
  "objective": "Present the platform clearly to NVIDIA Systems Engineering",
  "audience": "NVIDIA Systems Engineering Team",
  "deliverable_type": "slide_deck",
  "output_format": "pptx",
  "key_topics": ["platform overview", "benchmarks", "roadmap"],
  "constraints": ["Keep deck concise", "Enterprise tone"],
  "attachments": [],
  "proposed_roles": ["COO", "Researcher", "Worker", "Grader"],
  "priority": "normal"
}
```

---

## 8. Post-Draft Responsibilities (Subham's Side)
The transition from `TaskDraft` to execution:
* Canonical Execution Envelope creation.
* Identity, Authority, and Execution contexts.
* Step generation and integrity hashing.
* Queue persistence and lease enforcement.
* Trace and artifact persistence.

---

## 9. Power of this Design
* Voice-based task creation.
* User-customized intelligence.
* Knowledge-grounded clarification.
* Deterministic runtime execution.
* Identity-bound control & lease-enforced authority.

---

## 10. Why NOVA ACE Must Not Directly Execute
Direct execution blurs the control, execution, and compute planes. Architecture must keep them separate to maintain determinism.

---

## 11. End-to-End Flow Summary
1. **User opens Voice Command.**
2. **NOVA ACE refines request via dialogue.**
3. **NOVA ACE produces TaskDraft.**
4. **Task Composer displays draft for user review.**
5. **User edits or approves.**
6. **Envelope Builder creates ExecutionEnvelope.**
7. **Envelope is enqueued.**
8. **Runtime worker executes and persists results.**

---

## 12. Developer North Star
> "NOVA ACE is the customizable conversational front-end for composing deterministic execution envelopes. ACEPLACE runtime is the only executor."

---

## 13. Final Boundary Enforcement
* **NOVA ACE:** Conversation, clarification, task shaping, task drafting.
* **ACEPLACE:** Envelope creation, identity verification, authority lease, step execution, persistence.
