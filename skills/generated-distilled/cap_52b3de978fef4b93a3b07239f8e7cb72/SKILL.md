---
name: "handle-next-turn"
description: "Acknowledge a user's 'next turn' request by confirming that the next turn is handled."
user-invocable: true
x-xiaoba-capability-handle: "cap_52b3de978fef4b93a3b07239f8e7cb72"
x-xiaoba-transition-id: "transition-7e71b664-cd3a-4e6a-8dd8-8476e7cbc618"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_busy-pending-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_busy-pending-feedback-demo.jsonl#episode-episode:1:eeea84fc:settlement-2026-07-29T04:58:16.135Z"
---

## Skill: handle-next-turn

**When to apply:** When a user states "next turn" and the task context matches this simple acknowledgment pattern.

**What to do:** Acknowledge the user's "next turn" request by confirming that the next turn is handled.

**Boundaries:**
- Only apply when the explicit user intent is "next turn".
- Do not extend to sequential processes, multi-step workflows, or progression management — the evidence only supports the single exchange observed.
- Do not apply while the user is correcting, clarifying, or iterating on a prior interaction.
- This skill is derived from one observed episode and may not generalize to other turn-related scenarios.

**Evidence:** Derived from learning-episode bundle `v3:learning-episode:episode:1:eeea84fc` where the user stated "next turn" and the assistant responded "next turn handled". No contradiction was observed at settlement (2026-07-29T04:58:16.135Z).
