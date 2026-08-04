---
name: "restore-previous-desktop-entry"
description: "Restore a local desktop shortcut/entry to the version that existed before a recent change (e.g., replacing the entry with a desktop-pet or alternative-clone variant), by recreating the original shortcut, preserving existing app data, and avoiding unrequested clone restoration or startup items."
user-invocable: true
x-xiaoba-capability-handle: "cap_6a8bc33c7851425ba567eb87768b3ff7"
x-xiaoba-transition-id: "transition-0f9f3645-eafc-4976-9b41-fe91f304ce96"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_1035.jsonl#turn-1:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_1035.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_1035.jsonl#episode-episode:1:1c4e5fe0:settlement-2026-08-03T11:45:44.527Z"
---

# Restore Previous Desktop Entry

## When to use
Use when the user asks to revert a local desktop app entry or shortcut to the version that existed before a recent change — for example, "return to the version before I changed the desktop pet" or "restore the original desktop entry on my local desktop."

## Boundaries
- Applies only to local desktop shortcut/entry restoration matching this capability. Do not reuse the pattern while the user is correcting or iterating on the task.
- The exact "previous version" is often not technically specified by the user; confirm which version or entry is meant before recreating it.
- Do not extend to external services, accounts, credentials, remote repositories, or any data access beyond the local desktop entry being restored.
- Derived from a single completed episode; treat claims about the resulting desktop state as needing verification rather than independently confirmed fact.

## Steps
1. Clarify the target version. If the user's "previous version" is ambiguous (not technically described), ask which version or entry they want restored before making changes.
2. Identify the original entry versus the changed variant. In the evidenced case, the original entry was the web-app desktop shortcut and the change was a desktop-pet / alternative-clone variant.
3. Recreate the desktop shortcut (e.g., a `.lnk` file on the desktop) pointing to the original entry.
4. Do not restore the alternative clone variant unless the user explicitly asks for it.
5. Do not add startup items unless explicitly requested.
6. Preserve existing app data during restoration — do not delete or overwrite user data.
7. Verify the shortcut exists on the desktop and, where possible, that it opens the intended original app; confirm the outcome with the user.

## Notes
- Avoid hard-coding private identifiers (user names, group IDs, local host paths) from prior sessions.
- Completion in the source episode was recorded via a settlement notice without contradiction, not via an independent filesystem check; perform your own verification of the restored entry.
