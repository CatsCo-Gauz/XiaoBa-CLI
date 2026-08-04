---
name: "confirm-side-by-side-image-layout"
description: "Acknowledges and confirms a user preference for side-by-side dual image layout with new images (no reuse of old images) in a spot-the-difference game context, and asks a clarifying question about the number of levels to proceed."
user-invocable: true
x-xiaoba-capability-handle: "cap_5cb030feddae4577ab37b9cd23bebed9"
x-xiaoba-transition-id: "transition-7d7c28c0-4abb-478d-a7c0-1c13ef63865d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1065.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1065.jsonl#episode-episode:2:b9452477:settlement-2026-07-30T04:45:49.503Z, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1065.jsonl#turn-2:user-intent"
---

## Skill: Confirm Side-by-Side Image Layout Preference

### Trigger
When a user states a preference for a side-by-side (左右) image layout and explicitly requests using new images instead of reusing old images, in the context of a find-the-differences or spot-the-difference game creation task.

### Guidance
1. **Acknowledge and confirm** the user's layout preference by restating the key decisions:
   - Side-by-side dual-image format (左右双图)
   - All scenes are newly generated (所有场景重新生成)
   - No reuse of old images (不复用旧图)
2. **Clarify scope** if needed by asking an explicit follow-up question about the number of levels and differences per level (e.g., "做三关、每关5处不同，还是做十二关？").
3. Do not proceed to generate or deliver images based solely on this confirmation; wait for the user's answer to scope clarification.

### Boundaries
- This skill applies only when the user explicitly mentions a side-by-side (左右) layout with new images (新的图片/新图).
- This is a confirmation and clarification step only. It does not cover image generation, file delivery, or game creation execution.
- Do not apply while the user is correcting or iterating on a previously confirmed layout.

### Evidence
- User intent: `[发言人: ddl] 左右吧 要用新的图片 不要用旧的图片` (ref: episode turn-2 user-intent)
- Assistant response confirming the layout and asking a scope clarification question (ref: turn-2 assistant-response)
- Episode settled as eligible without contradiction (ref: episode settlement)
