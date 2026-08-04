---
name: "trace-character-origin"
description: "When a user asks to trace the origin of a named character, entity, or cultural phenomenon (e.g., by noting many fan works and asking for its '出处'), research public sources to determine the original source and deliver a structured report of findings."
user-invocable: true
x-xiaoba-capability-handle: "cap_f7ce1467afbd4c199698cda071b19d92"
x-xiaoba-transition-id: "transition-ad5e13c5-40e4-4927-9d47-09b543c9c21b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1033.jsonl#turn-2:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1033.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1033.jsonl#episode-episode:2:79005daf:settlement-2026-07-30T06:23:24.648Z"
---

# trace-character-origin

## When to apply

Apply when a user asks you to trace or find the origin (出处) of a named character, entity, or cultural phenomenon, especially when they provide contextual clues such as noting that there are many fan works (二创), derivative content, or widespread usage of the entity. The user typically names the entity and asks about its original source.

## What to do

1. **Identify the target entity** from the user's request. Confirm the exact name, any aliases, and the context clues the user provides about its prevalence.

2. **Research public sources** to trace the origin:
   - Search official game/mod repositories (e.g., GitHub) for the entity's first appearance in code or assets
   - Check mod hosting platforms (e.g., Modrinth, CurseForge) for earliest known releases
   - Look at relevant video platforms (e.g., Bilibili, YouTube) for the earliest appearance videos
   - Check community derivative-content repositories (e.g., YSM model repos, VRChat projects) for early adaptations
   - Cross-reference timestamps (commit dates, release dates, upload dates) to establish a timeline

3. **Analyze and separate findings**:
   - Distinguish the **direct original source** (where the entity first officially appeared) from subsequent derivative/fan works
   - Separate **established facts** (verifiable via primary sources) from **unverified claims** (hearsay, community speculation)
   - Note clearly where conclusive evidence exists vs. where gaps remain
   - Cite specific URLs, commit hashes, dates, and video timestamps

4. **Structure the findings** into a clear report:
   - **Executive verdict**: A direct, concise answer about the entity's origin
   - **Key evidence points**: Organized with sources for each claim
   - **Timeline**: Chronological view of the entity's appearance and spread
   - **Fact vs. speculation**: Clear labeling of what is verified versus what is plausible but unconfirmed
   - **Source list**: All URLs and references used

5. **Format delivery**: Use the `create-html-report` skill to produce a well-formatted self-contained HTML report with A4-ready Chinese styling, then send the report file to the user.

## Boundaries

- Only apply when the user explicitly asks to trace the origin of a named entity (e.g., "帮我找一下X的出处").
- Do not apply to general knowledge questions, encyclopedia lookups, or factual queries that do not involve origin tracing through multiple sources.
- Do not extend to analyzing arbitrary articles, transcripts, meeting notes, or documents unrelated to origin tracing.
- Research only publicly available sources; do not attempt to access private repositories, accounts, or unauthorized data.
- Clearly mark any claims that cannot be verified with a direct citation as unconfirmed.
- Focus on the origin; do not produce extensive analysis of the entity's cultural impact unless the user explicitly requests it.
- Do not inherit access, permissions, or credentials from the episode; use only what is currently authorized.
