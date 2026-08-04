---
name: "analyze-game-ui-screenshot-issues"
description: "Analyze a user-provided game/app UI screenshot to identify visual and layout problems, explain root causes from visual observation, and deliver a structured analysis document with prioritized fix recommendations."
user-invocable: true
x-xiaoba-capability-handle: "cap_23a9f9a143f94b6ab193025b5315c696"
x-xiaoba-transition-id: "transition-c26cd0c8-d389-45b3-abef-11eeedada25a"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-9:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-9:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:9:c1bc2e2c:settlement-2026-07-29T08:32:00.875Z"
---

# Skill: Analyze Game UI Screenshot Issues

## Trigger

The user shares a screenshot of a real game or app UI (e.g., a "单词打地鼠" game screen) and explicitly asks you to look at the picture, analyze what is wrong, and provide a solution. The request typically includes an image attachment.

## Behavior

1. **Examine the screenshot** – Review the provided screenshot to visually identify layout and visual problems.
2. **Identify observed issues** – Describe what you see from visual inspection, such as:
   - Stale or outdated visual elements still present (e.g., old holes still visible)
   - Assets not suited for direct use (e.g., concept-board crops used in production without adaptation)
   - Viewport or breakpoint problems compressing the layout (e.g., low-height breakpoints squashing the interface)
3. **Explain likely root causes** – Based on visual observation, explain why each issue may have occurred (e.g., legacy markup not cleaned up, assets designed for larger canvases, missing responsive rules).
4. **Provide a structured fix plan** – Recommend a concrete, actionable remediation order (e.g., rebuild layout skeleton first, then replace assets, then adjust fine details).
5. **Produce an analysis document** – Write a formatted HTML analysis report (using `write_file`) containing:
   - A title and summary of findings
   - Visual findings with observed root causes
   - A prioritized fix plan with implementation suggestions
   - A verification checklist for confirming fixes
6. **Deliver the document** – Use `send_file` to share the report with the user (format may vary; evidenced delivery was a PDF).

## Boundaries

- **Input scope:** This skill applies only when the user shares a game/app UI screenshot and explicitly asks for analysis and a solution. Do not trigger on general code questions, design principles discussions, or non-screenshot attachments.
- **Output scope:** Produce an analysis document and fix plan. Do not modify the user's source code, HTML, or production files unless separately requested and authorized.
- **No inherited access:** Do not assume access to the user's project, repository, or deployment environment. Only use the screenshot and explicitly provided context.
- **Findings as observations:** Present analysis findings as visual observations from the screenshot, not as independently verified root causes.

## Rationale

This skill was learned from a completed episode where the user (uma) shared a screenshot of a "单词打地鼠" (Word Whack-a-Mole) game UI with visible layout problems. The assistant examined the screenshot, identified core issues (old holes still visible, concept-board crop not suitable for live use, low-height breakpoints squashing the interface), produced a structured HTML analysis with fix plan and verification checklist, and delivered both an HTML file (via write_file) and a PDF (via send_file). The episode settled as eligible without contradiction.
