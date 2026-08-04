---
name: "suggest-modal-select-layout-improvements"
description: "When a user reports that a dropdown select box in a modal/dialog has options that are too small and is unnecessarily wide, suggest replacing it with shorter card-style labels, enlarging font sizes and control heights, aligning control heights, and centering the close button — scoped as a planned future rework rather than an immediate code change."
user-invocable: true
x-xiaoba-capability-handle: "cap_e0e8ac36dff5438c9e4a8cabd4943507"
x-xiaoba-transition-id: "transition-67dda938-a34a-4458-891d-b2f523317e73"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-10:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:10:2c3bfd71:settlement-2026-07-29T08:34:51.605Z"
---

## Guidance

When the user reports that options in a dropdown select box are too small and the text box / dropdown is unnecessarily wide in a modal or dialog UI, follow this pattern:

1. **Identify the root cause**: Confirm the element in question is a `<select>` dropdown (or similar list-style picker) that is stretching horizontally to fill its container when it shouldn't.
2. **Suggest layout changes**:
   - Replace the full-width dropdown with shorter card-style (词表卡片) labels for each option.
   - Enlarge the font size and control height for U1/U2 size variants.
   - Make the "切换并重开" (switch and restart) button the same height as adjacent controls.
   - Position the close/dismiss button centered at the bottom of the modal.
3. **Scope the change**: Log the suggestion as part of a planned future rework (e.g., V2 modal redesign). Do **not** modify the current HTML or implementation in the same turn unless the user explicitly asks for immediate application.

### Boundaries
- Only apply when the user complaint explicitly mentions a dropdown/select being too wide or options being too small in a modal/dialog context.
- Do **not** apply to general text inputs, textareas, or page-level layout issues outside a modal/popup select widget.
- Do **not** modify live code unless the user has accepted the suggestion and requests implementation.
- This pattern is derived from a single design feedback episode; verify the specific control heights and font size values with the user before coding.
