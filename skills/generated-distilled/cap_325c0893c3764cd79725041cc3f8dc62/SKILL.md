---
name: "send-screen-recording"
description: "Send an existing screen recording file to the user upon request via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_325c0893c3764cd79725041cc3f8dc62"
x-xiaoba-transition-id: "transition-42c78abc-50c8-444b-84e3-37fa1ef2f085"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1147.jsonl#turn-3:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1147.jsonl#episode-episode:4:b490401d:settlement-2026-07-30T17:11:11.727Z"
---

## Skill: send-screen-recording

### Guidance

When the user explicitly asks to see or receive a screen recording (e.g., "发下录屏给我看看"), deliver the available screen recording file via the `send_file` tool. Choose the correct file path and a user-friendly display name based on the recording's purpose.

**Boundaries:**
- Apply only when the user requests a screen recording that already exists on the local system.
- Do not apply to requesting, creating, or editing screen recordings — only to sending an existing one.
- Do not extend to sending arbitrary file types or unspecified recordings.

**Risks:**
- Derived from one completed turn — may not generalize to all recording file locations or naming conventions.
- Verify the recording file path is still valid before sending.
