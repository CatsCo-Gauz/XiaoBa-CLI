---
name: "confirm-phonics-game-layout"
description: "Confirm and record a user's design decision about phonics game interface layout, where projectiles contain phonics blocks and complete words display in a central synthesis area with auto-scaling."
user-invocable: true
x-xiaoba-capability-handle: "cap_07bbea718f064ccb9a9ad949b3a98567"
x-xiaoba-transition-id: "transition-dc276066-e54b-4af7-83af-9b557f452ccf"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-5:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:6:f3ccbdb1:settlement-2026-07-30T05:07:00.479Z"
---

## Skill: Confirm Phonics Game Layout Design

### When to Apply
Apply when the user confirms ("对的" / correct) a design decision about an educational phonics game interface, specifically concerning:

- What content goes into game projectiles/bullets (拼读块 / phonics blocks)
- Where complete words (完整单词) are displayed (central independent synthesis area)
- Auto-scaling behavior based on word length
- Subsequent material/structure adjustments

### Evidence Boundary
This skill is derived from a single completed AgentTurn where the user confirmed a design layout decision. Do not extend this pattern to:
- Other educational domains beyond phonics block games
- Unconfirmed or iterated design decisions
- Implementation, coding, or asset creation tasks

### Guidance

When the user confirms a phonics game layout design (e.g., responds "对的" to a proposed structure):

1. **Acknowledge the confirmation** clearly.
2. **Record the agreed design parameters** by restating them for shared understanding:
   - Bullets/projectiles contain only phonics blocks (拼读块)
   - Complete words display in a central independent synthesis area (中央独立合成区)
   - Text auto-scales according to length
   - Next-version materials will adjust to this structure
3. **Do not modify, expand, or reinterpret** the agreed design beyond what the user has confirmed.
4. **End with a clear confirmation** that the design direction is locked.

### Dependencies
None.
