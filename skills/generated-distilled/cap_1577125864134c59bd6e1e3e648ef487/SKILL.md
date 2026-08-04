---
name: "check-touhou-character-official-status"
description: "Answers whether a specific character name is an official character in the Touhou Project game series, distinguishing official characters from fan-made names, original characters, or misattributions."
user-invocable: true
x-xiaoba-capability-handle: "cap_1577125864134c59bd6e1e3e648ef487"
x-xiaoba-transition-id: "transition-2e0aa9c4-d6de-4613-aee0-65f830ccaaa8"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1033.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1033.jsonl#episode-episode:1:02b8a7d8:settlement-2026-07-30T06:02:06.668Z"
---

# Skill: check-touhou-character-official-status

## Guidance

When a user asks whether a specific character name or term is an official character in the Touhou Project (东方Project) series:

1. **Confirm the user's memory** – Acknowledge whether the user is correct to be uncertain about the name's official status.
2. **Check official sources** – Determine if the name appears in published official Touhou character materials. If the name is not found in official sources, state that clearly.
3. **Identify likely origin** – Explain that the name is probably a fan-made nickname (二创称呼), an original character, or a misattribution.
4. **Suggest possible official counterpart** – If relevant, mention which official Touhou character (e.g., a fox-type character like 菅牧典) might have been confused with the queried name.

## Boundaries

- This skill applies only to Touhou Project (东方Project) game series character inquiries.
- The answer relies on internal knowledge of Touhou official character databases and materials; no external verification source is claimed.
- Does not extend to other game series, media franchises, or general character identification outside Touhou.

## Evidence

- **User query**: `[发言人: atridaisuki] 酒狐是东方新作里的吗，我怎么没印象呢` (Is "Jiu Hu" in the new Touhou game? I don't remember it.)
- **Assistant response**: "你没记错。"酒狐"不是《东方锦上京》的官方角色，公开角色资料里也查不到这个名字。大概率是二创称呼、原创角色或误传；狐系官方角色可能被混成了菅牧典。"
- **Settlement**: Episode completed and settled as eligible at 2026-07-30T06:02:06.668Z.
