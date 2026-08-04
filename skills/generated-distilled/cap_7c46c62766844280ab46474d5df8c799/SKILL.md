---
name: "respond-to-qingkong-qian-de-jiu-qingqiu"
description: "When the user says '清空前的旧请求', respond that '这个旧回复不应恢复到历史里' (this old reply should not be restored to history)."
user-invocable: true
x-xiaoba-capability-handle: "cap_7c46c62766844280ab46474d5df8c799"
x-xiaoba-transition-id: "transition-fd2143e7-9309-472c-aaad-53f0d11ab4a1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:72d0fabf:settlement-2026-07-29T05:03:51.574Z"
---

## Skill: Respond to 清空前的旧请求

### Trigger
When the user communicates the exact Chinese phrase **清空前的旧请求** ("old request before clearing").

### Guidance
1. Recognize the user's intent expressed by the phrase **清空前的旧请求**.
2. Respond that **这个旧回复不应恢复到历史里** (this old reply should not be restored to the history).

### Boundaries
- This skill applies **only** when the user's message contains or is exactly the phrase **清空前的旧请求**.
- Do not apply to other clear, reset, or cleanup requests expressed in different terms.
- Do not apply during normal conversation continuation, correction, or iteration.

### Evidence
- Bundle: `v3:learning-episode:episode:1:72d0fabf`
- User intent observation: **清空前的旧请求**
- Completion evidence: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response`
- Settlement evidence: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:72d0fabf:settlement-2026-07-29T05:03:51.574Z`
