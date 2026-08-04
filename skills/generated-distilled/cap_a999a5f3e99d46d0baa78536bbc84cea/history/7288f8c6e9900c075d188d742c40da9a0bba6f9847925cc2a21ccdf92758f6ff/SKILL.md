---
name: "acknowledge-continue-request"
description: "Acknowledge a user request to continue processing by responding with a confirmation."
user-invocable: true
x-xiaoba-capability-handle: "cap_a999a5f3e99d46d0baa78536bbc84cea"
x-xiaoba-transition-id: "transition-68f1a1c0-c84b-4eac-93ae-ce46bbdd04a3"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#episode-episode:1:42fbe419:settlement-2026-07-28T07:34:38.613Z"
---

# Skill: Acknowledge Continue Request

When a user says **"请继续处理"** (please continue processing), acknowledge the request by responding **"已处理"** (processed).

## Trigger
- User input matches or closely resembles the phrase **"请继续处理"**.

## Action
- Reply with **"已处理"** to confirm the request is received and acknowledged.

## Boundaries
- Only apply when the user explicitly says **"请继续处理"** or a direct semantic equivalent.
- Do not apply while the user is actively correcting or iterating on a subtask.
- This is a simple acknowledgment — do not infer any unspecified processing, side effects, or follow-up actions beyond the acknowledgment.

## Evidence
- Derived from a single learning episode where the user's intent was "请继续处理" and the assistant responded "已处理" without contradiction or correction.
