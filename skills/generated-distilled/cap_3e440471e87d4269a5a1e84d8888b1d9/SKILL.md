---
name: "word-whack-mole-visual-redesign-preview"
description: "Deliver existing visual redesign preview files (HTML preview + PNG image) for the Word Whack-a-Mole (单词打地鼠) game UI when a user requests element replacement, without claiming file generation or game-mechanic verification that is outside the evidence."
user-invocable: true
x-xiaoba-capability-handle: "cap_3e440471e87d4269a5a1e84d8888b1d9"
x-xiaoba-transition-id: "transition-8c662c0b-08c1-4536-a70a-a289195f7e8b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-8:delivery:send_file:call-id-90c7b41021aa-1, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-8:delivery:send_file:call-id-84fb9d4ee8f8-2, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:8:24a4c614:settlement-2026-07-29T08:23:06.270Z"
---

# Skill: Deliver Word Whack-a-Mole Visual Redesign Preview Files

## When to Apply
Apply when a user asks to replace or swap visual elements in the **单词打地鼠 (Word Whack-a-Mole)** game UI and wants to see the updated preview result.

## What This Skill Does
1. Accept the user's request to replace visual elements in the Word Whack-a-Mole game interface.
2. Deliver the updated HTML preview file (named with a `_视觉重设计预览版` suffix) to the user via `send_file`.
3. Deliver a PNG preview image of the main interface to the user via `send_file`.
4. Confirm that the original (non-preview) version of the file has **not** been overwritten.

## Important Boundaries
- **Preview delivery only:** This skill only covers delivering preview files that already exist. The underlying file creation, generation, or modification steps are not evidenced and are out of scope.
- **No verification claims:** Do not claim to verify game mechanics (scoring, rotation, mode switching, etc.). Such claims are uncorroborated.
- **Single-turn evidence:** This skill is derived from one completed interaction. Generalizability is limited to similar "replace these elements and show me" requests for the same game UI.
- **Specific game context:** The evidenced use case is the 单词打地鼠 (Word Whack-a-Mole) English vocabulary game (U1/U2 units). Do not broadly apply this pattern to arbitrary unrelated applications without additional evidence.
- **No external dependencies:** This skill does not require access to external databases, APIs, or credentials. It operates on local files within the working directory.

## Evidence References
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-8:delivery:send_file:call-id-90c7b41021aa-1` (HTML preview delivery)
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-8:delivery:send_file:call-id-84fb9d4ee8f8-2` (PNG preview delivery)
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:8:24a4c614:settlement-2026-07-29T08:23:06.270Z` (settlement)
