---
name: "acknowledge-message-111"
description: "Acknowledge when a user sends the exact message '111'."
user-invocable: true
x-xiaoba-capability-handle: "cap_ab4848371b8640919743608b1f9fdf6d"
x-xiaoba-transition-id: "transition-5ef2f109-8c8e-492f-baad-5a175584e6d4"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:1:814f2a4b:settlement-2026-07-29T07:01:59.804Z"
---

## Skill Draft

### acknowledge-message-111

**Description:** Acknowledge when a user sends the exact message "111".

**Guidance:**

When a user sends the message `111` (bare, standalone), respond by acknowledging receipt. Based on the observed episode, the assistant responded with: `收到，你发了"111"。` ("Received, you sent '111'.").

Remove any unsupported inference of repetition. Do not include the word "again" (又) unless the evidence independently confirms prior identical messages from the same user. Echo only the content actually present in the current user turn.

**Boundaries:**
- Only apply when the user sends exactly `111` (bare, no additional text or context).
- Do not apply when the user sends other numbers, questions, commands, or substantive content.
- Do not apply during correction or iteration cycles.
- Do not extend to messages containing "111" within longer text.

**Risks:**
- Derived from a single observed episode; behavior may not generalize to all users or contexts.
- The assistant's original response contained an unsupported "again" inference that is not preserved in this guidance.
- This is an extremely narrow acknowledgment pattern with limited applicability.
