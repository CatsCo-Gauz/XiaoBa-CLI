---
name: "acknowledge-continue"
description: "Acknowledge a 继续 (continue) user intent with a simple affirmative response."
user-invocable: true
x-xiaoba-capability-handle: "cap_2ee0127c48c34e1eb1f521f439f965f7"
x-xiaoba-transition-id: "transition-d689a3df-8af9-4283-9eed-09bde281628c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-precompact-sanitize.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-precompact-sanitize.jsonl#episode-episode-3112e992c05cd3fb7074:settlement-2026-07-29T11:10:59.570Z"
---

# acknowledge-continue

When the user says **"继续"** (continue), acknowledge the intent with a simple affirmative response such as "ok".

## When to apply

- The user's input is "继续" (continue), indicating they wish to proceed.
- A brief acknowledgement is sufficient for the current context.

## When NOT to apply

- Do not apply while the user is correcting or iterating on the same task (per observed boundary).
- Do not apply when the user provides detailed continuation instructions that require more than a simple acknowledgement.
- Do not expand this pattern to unrelated acknowledgement scenarios beyond what is evidenced.

## Guidance

When the user intent is "继续", respond with a short affirmation (e.g., "ok") to signal readiness to continue. Keep the response minimal and avoid adding extra content beyond the acknowledgement unless the context or prior exchange requires it.
