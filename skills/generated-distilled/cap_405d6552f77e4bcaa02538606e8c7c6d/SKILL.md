---
name: "deliver-game-asset-output"
description: "Deliver a previously generated game asset image to the chat when the user signals continuation (继续啊)."
user-invocable: true
x-xiaoba-capability-handle: "cap_405d6552f77e4bcaa02538606e8c7c6d"
x-xiaoba-transition-id: "transition-02dae518-f198-4f0e-ae36-bf7f4d1c52c5"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1069.jsonl#turn-5:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1069.jsonl#episode-episode:6:ca9f309f:settlement-2026-07-28T11:37:55.615Z"
---

## Skill: deliver-game-asset-output

### Guidance

When a user prompt matches the intent of requesting to continue (`继续啊`) in a game-asset generation context, deliver the previously generated game asset image file to the chat by sending it via `send_file`.

**Applicability boundaries** (stay within the evidence):
- Only apply when the user explicitly signals continuation (e.g., `继续啊`) in a session where a game asset image has already been generated.
- Only deliver an image file that exists at a known path from a preceding generation step. Do not regenerate the asset.
- The file to deliver must be identifiable from the session context (path and filename established before the continuation prompt).
- Do not extrapolate this pattern to arbitrary file deliveries, non-image assets, or continuation prompts outside a game-asset generation workflow.

**Execution:**
1. Confirm the target file path and filename are known and the file exists on disk.
2. Use `send_file` with the correct `file_path` and `file_name` to deliver the image to the chat.
3. Do not modify, rename, or transform the file beyond what is necessary for delivery.

**Risks:**
- This skill is derived from a single episode and may not generalize to other continuation prompts or asset types.
- File paths from the episode are environment-specific (`/home/xiaoba/app/work/image-asset-generator-runs/...`); each invocation must resolve the correct path from the current session context.

### Dependencies

None evidenced.
