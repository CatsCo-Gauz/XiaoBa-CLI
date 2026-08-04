---
name: "send-file-to-current-chat"
description: "When the user explicitly asks to be sent a file (e.g., '发给我', 'send me'), use send_file to deliver the referenced file to the current chat. Derived from a settled episode where the agent delivered the HTML file '漫画书寻物游戏_十二关逐件复色版.html' in response to user request '发给我 你现在完全没有发送信息给我'."
user-invocable: true
x-xiaoba-capability-handle: "cap_a234ee9a86e44262b3f42116bf8aec3c"
x-xiaoba-transition-id: "transition-69efbe8e-f266-43db-a27a-3f9876396d37"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1069.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1069.jsonl#episode-episode:2:f0c3cdb2:settlement-2026-07-30T04:37:04.335Z"
---

## Skill: Send a File to the Current Chat on User Request

### Guidance

When the user explicitly asks you to send or transmit a file to them (using phrases such as "发给我" or equivalent requests for delivery), use the `send_file` tool to deliver the file to the current chat. Identify the file the user is referring to from context (e.g., a previously created or discussed file).

### Applicability

- **Trigger**: User request containing an instruction to send them a file (e.g., "发给我", "send me", "transmit the file").
- **Action**: Use `send_file` with the identified file path and an appropriate file name to deliver it to the current chat.
- **Boundaries**:
  - Only apply when the user explicitly asks for file delivery to themselves in the current conversation.
  - Do not use this pattern for email, external sharing, or non-chat delivery methods.
  - The file must already exist at the specified path; do not create or generate new content under this capability unless separately evidenced.
  - Evidence-based: this capability is derived from a single settled episode (episode:2:f0c3cdb2) where the file `漫画书寻物游戏_十二关逐件复色版.html` was delivered via `send_file`.

### Risks

- Derived from a single episode; applicability to other file types or delivery contexts has not been evidenced.
- Does not cover credential-based or externally authorized delivery (e.g., email, cloud storage uploads).
- The user must be referring to a known file; do not guess file paths without prior context.
