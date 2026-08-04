---
name: "deliver-word-mole-production-assets"
description: "Deliver pre-existing Word Mole (单词打地鼠) game production asset files (PNG master sheet, transparent PNG bundle, and checking board) when the user requests the materials."
user-invocable: true
x-xiaoba-capability-handle: "cap_9a94adf9b6384130a28afe4d18fa8bac"
x-xiaoba-transition-id: "transition-9c965026-de57-46fa-aef8-e21243d6f0e9"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-6:delivery:send_file:call-id-291dde13533d-1, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-6:delivery:send_file:call-id-8bd110375d52-2, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-6:delivery:send_file:call-id-ea4dc8ada633-3, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:6:e2f5f34e:settlement-2026-07-29T09:34:25.563Z"
---

## Skill: deliver-word-mole-production-assets

**When to apply**  
Apply when the user explicitly requests delivery of Word Mole (单词打地鼠) game production asset materials (素材), indicating they want the previously prepared PNG asset files sent to them.

**Guidance**  

1. Confirm which assets are being requested — the Word Mole game production assets that have been prepared.  
2. Locate the three pre-existing production asset files and deliver them via `send_file`:  
   - The PNG master asset sheet (素材总板).  
   - The ZIP bundle of individual transparent PNG assets (独立透明PNG素材包).  
   - The transparent PNG checking board (透明PNG素材检查板).  
3. After delivery, provide a brief summary of what was sent, including the number and types of assets included (e.g., characters, moles, hammer, holes, word cards, score bars, buttons, clouds, sun, flowers).

**Boundaries**  

- This skill covers only the delivery of pre-existing Word Mole (单词打地鼠) game production assets. It does **not** cover creating, generating, modifying, or packaging these assets.  
- File paths must be resolved from the runtime context at the time of delivery; do not hard-code absolute paths from a prior session.  
- Do not apply when the user is asking about unrelated materials, different games, or requesting new asset creation.
