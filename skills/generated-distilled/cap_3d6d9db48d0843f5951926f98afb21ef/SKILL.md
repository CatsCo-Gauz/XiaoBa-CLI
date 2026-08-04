---
name: "rebuild-spot-the-difference-game"
description: "Rebuild a spot-the-difference (找茬) HTML game by defining its rules, page design, and level structure, reusing scene data from an existing version of the game where available, and delivering a self-contained playable HTML file with review-before-delivery discipline."
user-invocable: true
x-xiaoba-capability-handle: "cap_3d6d9db48d0843f5951926f98afb21ef"
x-xiaoba-transition-id: "transition-3f649cbc-4788-4ba4-a351-6330b383215b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-1:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-1:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-1:validation:check_subagent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#episode-episode:1:bd66cdac:settlement-2026-07-29T06:40:13.865Z"
---

## Skill: Rebuild a spot-the-difference (找茬) HTML game

### When to apply
Apply when a user asks to set up or rebuild a **spot-the-difference (找茬) HTML game** — deciding the game rules, page design, and level structure — and expects a self-contained playable game file in return. Especially relevant when a previous version of the game already exists and can serve as the base. This evidence covers one completed delivery; do not generalize to other game genres or general web development.

### Guidance

1. **Treat the user's request as general.** The user asked you to decide the game rules, page design, and level structure yourself ("你自己想想…怎么设置"). Do not present specific features as user-stated requirements; the user did not enumerate them.

2. **Reuse an existing game as the base when one is available.** Read the current game HTML and carry over its scene/level definitions (room/stage data) instead of rebuilding levels from scratch. The source episode achieved this with a small script that extracted scene code from the old file and injected it into a new document, but the extraction method is not fixed — any approach that preserves the base content works.

3. **Produce one self-contained HTML file** containing the UI, rules, and game logic, and save it to a supported output location. Elements visible in the delivered artifact and its review traces include: an intro/landing overlay, a rules overlay, hint and compare buttons, pause/resume (Escape key and auto-pause on tab hide), responsive layout (@media max-width), accessibility attributes (aria-, tabindex, role=, focus-visible), and progress persistence (save.unlocked, bestTime, bestMistakes, persist/load, guided). These describe what the delivered version contained; the delivery summary also mentioned an independent three-star rating and a no-fail main line, which are not independently corroborated in the captured evidence.

4. **Review before delivery, but only claim what is observed.** Launch an independent read-only review of the generated HTML (accessibility, responsive layout, save/persistence, input handling). Do not assert that review rounds completed or passed while a reviewer is still running: in the source episode the reviewer was still in progress (状态: 运行中) when captured, so report only the observable status or wait for completion. Never claim "N rounds of independent review" without observed completion evidence.

5. **Deliver** the final HTML file to the user once the rebuilt game is produced.

### Boundaries
- Applies only to spot-the-difference (找茬) games delivered as a self-contained HTML file — not to other game genres or general web development.
- Do not copy content from web or GitHub examples without respecting copyright and license terms.
- Do not inherit the episode's file paths, output directories, or file-system access; require that any base file is available in the current environment.
- Review completion is not evidenced: the verification subagent was still running at capture time. Base any claim of completed review on observed status, not on the assistant's response text.
- Derived from a single eligible episode; applicability is narrow and may not generalize.
