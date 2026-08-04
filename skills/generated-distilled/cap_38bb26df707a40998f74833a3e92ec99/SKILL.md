---
name: "monitor-windows-machine-online"
description: "Monitor a remote Windows computer's online status by running a periodically checking worker subagent and reporting results."
user-invocable: true
x-xiaoba-capability-handle: "cap_38bb26df707a40998f74833a3e92ec99"
x-xiaoba-transition-id: "transition-22d30af9-df01-45ad-b5c4-66962f2a7d9a"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#turn-9:validation:check_subagent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#turn-9:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#episode-episode:9:8ec2d46b:settlement-2026-07-30T07:51:31.297Z"
---

## Skill: monitor-windows-machine-online

### When to apply
When a user asks to continue monitoring or check whether a specific remote Windows computer has come online, and a worker subagent is already configured for periodic status checks.

### What this skill provides
Guidance for monitoring a remote Windows computer's online availability by running a worker subagent that periodically probes the target and reports status back to the user.

### Steps
1. Confirm the existing monitoring subagent is still running and report its current status to the user.
2. Let the subagent continue its periodic checks (e.g., every 30 seconds) using shell commands such as `hostname` and `uname -s` to detect when the target Windows machine connects.
3. Report intermediate status to the user, including whether the currently detected host is the expected Windows machine or another intermediate server.
4. Continue monitoring until the target Windows computer is positively identified as online.
5. Do not claim detection or proceed with installation steps unless the subagent's verification output confirms the target machine has been reached.

### Boundaries
- This skill covers only the monitoring phase: periodically checking whether a remote Windows computer is online.
- It does not cover installation, setup, configuration, or any post-detection steps.
- The subagent must already be configured and running; this skill does not cover creating the subagent from scratch.
- Evidence is limited to one completed episode; the pattern may not generalize to different network topologies, polling intervals, or monitoring targets.
- Do not inherit credentials, network access, or shell permissions from the episode; require current authorization for any remote access.
- The monitoring commands used (`hostname`, `uname -s`) assume a Unix-like intermediate host; adapt if the environment differs.

### Dependencies
None evidenced.
