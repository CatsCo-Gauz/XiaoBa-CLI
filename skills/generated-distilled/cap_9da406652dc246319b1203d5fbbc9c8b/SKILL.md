---
name: "monitor-computer-online-status"
description: "Acknowledge a user request to monitor a designated computer's online status at a specified polling interval until completion."
user-invocable: true
x-xiaoba-capability-handle: "cap_9da406652dc246319b1203d5fbbc9c8b"
x-xiaoba-transition-id: "transition-6abfb2a8-9949-4526-a4d3-09337762e554"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#turn-8:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#episode-episode:8:c51fba79:settlement-2026-07-30T07:46:55.561Z"
---

# monitor-computer-online-status

## Guidance

When the user asks to monitor a designated computer's online status with a specified polling interval (e.g., "30秒监测一次 直到完成"):

1. **Acknowledge** the monitoring request and confirm the polling interval and condition ("直到完成" / until complete).

### Boundaries

- The target machine identifier and polling interval must be provided by the user at runtime; do not reuse episode-specific machine names (e.g., "FFFFFFFK").
- Do not assume installation privileges, credentials, or system-level access — these require current authorization at runtime.
- This skill covers only the acknowledgment of the monitoring request. Actual polling, installation, file operations, or startup configuration depend on runtime context and are not covered by this evidence.
- The skill does not prescribe what "直到完成" means; completion semantics come from the runtime task context.

### Dependencies

None.
