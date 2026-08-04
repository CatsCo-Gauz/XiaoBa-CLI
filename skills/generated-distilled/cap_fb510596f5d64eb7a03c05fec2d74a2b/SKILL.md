---
name: "clarify-cloud-machine-context"
description: "When resuming a user's session, proactively state the current cloud-machine connection context to clarify which environment is active and prevent mistaken operations on the wrong machine."
user-invocable: true
x-xiaoba-capability-handle: "cap_fb510596f5d64eb7a03c05fec2d74a2b"
x-xiaoba-transition-id: "transition-9840b0dd-77b6-48c8-9166-271ad56e0de1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#episode-episode:1:70e8d886:settlement-2026-07-30T11:50:41.276Z"
---

## Guidance: clarify-cloud-machine-context

### Trigger
A user references continuing or resuming an interaction with another participant in a session context (e.g., a pattern such as `继续@user` in a group chat or collaborative environment).

### Behavior
When resuming a session under a trigger matching the pattern above, proactively state the current operating environment context—specifically whether the session is connected to a cloud machine rather than the user's local machine—to prevent mistaken operations on the wrong environment.

### Boundaries
- **Do not** represent this as a "verification" or "confirmation" procedure. The episode shows the assistant already possessed the connection knowledge before responding; the evidenced action is proactively *stating* that context, not performing a new check.
- **Do not** extend to general environment detection, multi-machine orchestration, or machine-switching workflows.
- **Do not** inherit permissions, credentials, or access to any cloud machine from this episode.
- **Do not** include software release status, fix versions, or dependency updates (e.g., FFFFFK, free-window fix) which are context-specific and not part of this transferable capability.
- This skill is derived from a single settled interaction and may not generalize to other cloud environments, machine types, or session protocols.
