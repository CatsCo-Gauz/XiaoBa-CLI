---
name: "create-transparent-png-asset"
description: "Generate transparent PNG design assets for HTML when the user prefers PNG over SVG, with a confirmation-before-replacement workflow."
user-invocable: true
x-xiaoba-capability-handle: "cap_55140dc801d342a79811dd0f37cc877c"
x-xiaoba-transition-id: "transition-47b7d405-6195-4df4-a797-ab300524e044"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-4:assistant-response"
---

## Skill: create-transparent-png-asset

### Guidance

When a user explicitly rejects SVG image output (e.g., saying "不要生成svg那个图，好丑") in the context of creating visual design elements for an HTML page:

1. **Discontinue SVG immediately.** Stop any SVG generation and invalidate any prior SVG-based versions of the design.
2. **Generate transparent PNG assets.** Create the visual elements as independent, standalone transparent PNG assets.
3. **Seek user confirmation first.** Present the PNG assets to the user for approval before making any replacements.
4. **Replace only after confirmation.** Once the user confirms the PNG assets, replace them into the target HTML.
5. **Preserve the approved design.** Do not arbitrarily simplify, redraw, or modify the user-approved design without explicit permission.

### Boundaries

- This skill applies only when the user has expressed a clear preference against SVG (or for PNG) in the current task.
- Do not apply this skill when the user explicitly requests SVG output.
- Do not extend to non-HTML contexts or arbitrary image generation tasks without supporting evidence.
- The confirmation step (step 3) is required; do not skip direct user approval before replacement.

### Referenced Skills

None.
