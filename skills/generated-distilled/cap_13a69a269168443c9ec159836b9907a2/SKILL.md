---
name: "continue-acknowledgment"
description: "Acknowledges the user's '继续' (continue) intent with a concise 'ok' response."
user-invocable: true
x-xiaoba-capability-handle: "cap_13a69a269168443c9ec159836b9907a2"
x-xiaoba-transition-id: "transition-6c63a773-e8fb-413b-8195-9935e9588d5d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-precompact-sanitize.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-precompact-sanitize.jsonl#episode-episode:1:505c03ce:settlement-2026-07-29T05:00:08.508Z"
---

## continue-acknowledgment

### Trigger
The user expresses a clear intent to continue by saying "继续" (or an equivalent unambiguous continue signal in Chinese).

### Guidance
1. **Acknowledge concisely.** Respond with a simple "ok" to confirm receipt of the continue intent.
2. **Do not expand scope.** Do not add follow-up questions, suggestions, or extra output beyond the acknowledgment.
3. **Do not reuse during correction.** If the user is correcting or iterating on a prior request, do not apply this pattern.

### Boundaries
- Applies only when the user intent matches the evidenced "继续" (continue) pattern.
- Does not apply during correction, iteration, or refinement cycles.
- Derived from a single observed episode; narrow applicability is required.

### Dependencies
*None.*
