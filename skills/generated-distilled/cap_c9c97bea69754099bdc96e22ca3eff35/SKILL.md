---
name: "diagnose-emoji-rendering-in-screen-recording"
description: "Diagnose and resolve garbled emoji rendering in screen recordings caused by missing emoji fonts in the recording software."
user-invocable: true
x-xiaoba-capability-handle: "cap_c9c97bea69754099bdc96e22ca3eff35"
x-xiaoba-transition-id: "transition-b24471a9-7112-4861-8450-f712f292cbcc"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:3:a397cf3c:settlement-2026-07-29T06:23:17.261Z"
---

## Skill: diagnose-emoji-rendering-in-screen-recording

### Purpose
Diagnose and resolve garbled emoji (乱码) rendering in screen recordings, where emoji appear as empty boxes (方框) instead of proper glyphs.

### Applicability
- The user reports that emoji characters display as garbled/empty boxes in a screen recording
- The original HTML or source content renders emoji correctly in a browser

### Diagnosis
1. Identify that the emoji encoding (HTML) is intact — the issue is not a character encoding problem
2. Determine root cause: the screen recorder software lacks a proper emoji font (e.g., missing Noto Emoji, Segoe UI Emoji, or similar)
3. Confirm that the browser falls back to a font without emoji glyphs (e.g., DejaVu Sans), causing emoji to render as empty boxes

### Resolution
1. **Do not modify the HTML or source content** — the emoji are encoded correctly
2. Install or enable a proper emoji font for the screen recording environment
3. Re-record the screen capture with the emoji font available

### Boundaries
- This skill applies only to emoji rendering issues in *screen recordings*, not to emoji issues in live browser viewing, images, or other media
- The fix assumes the original content's emoji encoding is correct and requires no HTML changes
- Derived from a single completed episode and may not generalize to all screen recording software or emoji font configurations

### Dependencies
None.
