---
name: "guide-cloud-server-desktop-placement"
description: "When a user in the CatsCo/XiaoBa ecosystem requests desktop placement instead of files but the connected machine is a cloud server without a desktop, guide the user to open the CatsCo/XiaoBa client on an actual PC."
user-invocable: true
x-xiaoba-capability-handle: "cap_b9a51e50ed0b425da0f60d1199e24f07"
x-xiaoba-transition-id: "transition-f3b70548-f7fe-405d-a353-570bea49dbfe"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#turn-4:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#episode-episode:4:6e051fe5:settlement-2026-07-30T07:23:09.641Z"
---

## guide-cloud-server-desktop-placement

### Purpose
When a user in the CatsCo/XiaoBa ecosystem requests that content be placed on their desktop instead of sent as files/compressed packages, but the currently connected machine is a cloud server without a desktop environment, guide the user to open the CatsCo/XiaoBa client on their actual personal computer to receive the content.

### Trigger
The user expresses a preference that content be placed on the desktop, embedded into the desktop, or that files/compressed packages not be sent, AND the currently connected machine lacks a desktop environment (e.g., a cloud server).

### Guidance
1. **Confirm the environment**: Verify whether the currently connected machine has a desktop environment (GUI/display server).
2. **If the connected machine is a cloud server without a desktop**: Inform the user that the current environment is a cloud server without a desktop, so content cannot be visually displayed there. Instruct the user to open the CatsCo/XiaoBa client on an actual personal computer and keep it online. Once the device appears, explain that you can place the content on the desktop and configure it to display on startup. Do not send files or compressed packages.
3. **If the connected machine has a desktop**: Do not fall back to this guidance — the evidence only covers the no-desktop scenario. This skill alone does not authorize any action for the desktop-present case.

### Boundaries
- Only apply when the user explicitly requests desktop placement or expresses a preference against receiving files/compressed packages.
- Only apply when the currently connected machine is determined to be a cloud server or environment without a desktop.
- Do not reuse this pattern while the user is correcting or iterating on the task.
- This guidance is specific to the CatsCo/XiaoBa ecosystem and the observed no-desktop scenario; do not extend to arbitrary desktop placement scenarios without further evidence.
- The assistant does not inherit the episode's access to the user's PC or client; actual placement requires the user to have the CatsCo/XiaoBa client online on their actual personal computer.

### Evidence
- Completion: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#turn-4:assistant-response`
- Settlement: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#episode-episode:4:6e051fe5:settlement-2026-07-30T07:23:09.641Z`
