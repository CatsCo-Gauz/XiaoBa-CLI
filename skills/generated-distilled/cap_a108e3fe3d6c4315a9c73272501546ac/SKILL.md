---
name: "review-evidence-deadline-fix"
description: "Review fixes to evidence review deadline handling (quantum timeout, review persistence, lease protection, commit race) for correctness and gaps: run baseline checks, add quantum lease-fencing tests, dispatch a read-only reviewer, and apply a commit idempotency / lease-fencing gap checklist before declaring the fix complete."
user-invocable: true
x-xiaoba-capability-handle: "cap_a108e3fe3d6c4315a9c73272501546ac"
x-xiaoba-transition-id: "transition-5af53e35-124b-4448-8dd1-eb2f7078b864"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-1:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-1:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-1:validation:check_subagent:call-id-75f67ec6bf59-1, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-1:validation:check_subagent:call-id-766aa60ea302-2, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#episode-episode:1:77a9c607:settlement-2026-07-29T12:24:08.319Z"
---

# Review Evidence Review Deadline Fix

## When to use
Use when a task asks to continue, fix, or review the handling of evidence review deadline / attempt timeouts in an evidence-review Quantum state machine — specifically changes touching quantum timeout, review persistence, lease protection, and commit race conditions (e.g., the evidence-review-quantum-deadline codebase containing `evidence-review-engine.ts` and `evidence-review-graph-core.ts`).

## Trigger
- User instructs to continue or re-run a fix/review for "evidence review deadline" correctness and gaps (e.g., "[发言人: pi-dal] continue").

## Inputs
- The working copy of the evidence-review codebase and the isolation branch containing the fix.
- Knowledge of which files changed (engine, graph-core, tests).
- Current authorization to run tests and static analysis in the local working copy. This skill does not imply production deployment or restart.

## Steps

1. **Baseline verification** — run the core test suite, type check, and build in the working copy before evaluating the fix. Record results; do not claim a pass without running them.

2. **Write focused lease-fencing tests** — for `completeQuantum` / `failQuantum`, add tests covering at minimum:
   - Reject completion and failure when the Quantum is not leased (expect `not_leased` / `lease_mismatch`; state remains `pending`).
   - Reject a stale attempt after a newer lease is claimed (expect `lease_mismatch`; state remains `leased` with the newer lease).

3. **Dispatch a read-only reviewer** — use a reviewer subagent limited to `read_file`, `glob`, `grep` to review the fix for correctness and gaps against the "one Quantum per round" and durable-first requirements.

4. **Apply the gap checklist before declaring the fix complete**:
   - Commit timeout: `Promise.race` early returns do not cancel the underlying promise; confirm the abort signal is passed into the commit path. A commit that cannot truly be cancelled must not be marked retryable purely from a timeout race.
   - Idempotency: use a stable idempotency key (e.g., `jobId + quantumId`), persist the commit intent first, validate the current lease/token at the atomic commit boundary, and be able to reconstruct a successful Quantum from journal/audit receipts.
   - Lease fencing: `completeQuantum` / `failQuantum` must check the current lease; the review basis fence must also check the lease.

5. **Report honestly** — if high-risk gaps remain (e.g., duplicate execution after commit timeout, incomplete lease fencing), state them explicitly. Do not claim full-chain compliance with "one Quantum per round" and durable-first while unresolved high-risk items exist.

## Boundaries
- Derived from a single completed episode; applies to this codebase and pattern only.
- Review tooling is read-only; do not extend this to production deployment, restarts, or external side effects without explicit authorization.
- Do not reuse this pattern while the same task is still being corrected or iterated on by the user.
