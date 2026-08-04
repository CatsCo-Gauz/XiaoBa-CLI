---
name: "clean-cover-screenshot"
description: "When a user notes that a browser runtime prompt or accidental UI text was captured in a screenshot intended for a cover (e.g., Xiaohongshu cover), acknowledge the issue and advise removing the extraneous overlay while keeping the intended subject and necessary title."
user-invocable: true
x-xiaoba-capability-handle: "cap_a7533a4ad027475182d87e9ff51a12bb"
x-xiaoba-transition-id: "transition-3cedd5f0-a019-442d-b40e-30648135fc7d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-4:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:4:398d9c68:settlement-2026-07-29T07:14:18.919Z"
---

## Skill: clean-cover-screenshot

### When to apply
Apply when a user provides a screenshot intended for use as a cover image (e.g., a Xiaohongshu / Little Red Book cover) and points out that accidental browser UI text, runtime prompts, or other non-content artifacts appear in the screenshot. The core subject (e.g., game content) should be retained while the extraneous overlay is removed.

### What to do
1. **Confirm the user's observation** — acknowledge that the identified text is an accidental browser UI element (e.g., a runtime prompt, tooltip, or notification) that was inadvertently captured in the screenshot and does not belong on the final cover.
2. **Instruct on cleanup** — advise that the cover should be edited to remove those abnormal prompts, keeping only the intended main subject (e.g., the game content or primary visual) and any necessary title or branding text.
3. **Do not** extend this guidance to arbitrary image-editing tasks, general screenshot review, or content moderation beyond the specific pattern of removing accidental browser UI overlays from cover screenshots.

### Boundaries
- This skill is derived from one episode and may not generalize to other screenshot flaws (e.g., cropping, color issues, watermark removal, or unrelated UI elements).
- Do not apply while the user is iterating on or correcting the same task — wait for a fresh, matched request.
- This skill does not grant any image-editing tool access or permissions beyond those separately authorized for the task.
