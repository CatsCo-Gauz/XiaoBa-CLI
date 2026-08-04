---
name: "phonics-block-word-composition"
description: "Design word composition from phonics blocks in a bomb/cannonball animation game, where blocks fly to a central composition area and long words trigger auto-widening with text shrinking"
user-invocable: true
x-xiaoba-capability-handle: "cap_08fa8e8dab3b497782a77fefc2330018"
x-xiaoba-transition-id: "transition-67bddb2b-9c35-4eee-9c6d-0dc080635277"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-4:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:5:2657c8af:settlement-2026-07-30T05:06:07.930Z"
---

# Skill: Phonics Block Word Composition

## When to Apply
Apply when designing or modifying a phonics learning game that builds words from individual sound blocks (拼读块) conveyed via bomb/cannonball animation, and the user raises a concern about placing whole words into fixed-size containers.

## What to Do
Do not place entire words into fixed-size bomb containers. Instead:

1. Use projectiles (炮弹) to carry individual phonics blocks (拼读块), such as `c` and `at`
2. The blocks fly to a central composition area
3. The complete word (e.g., `cat`) displays in the independent composition area, assembled from the flown-in blocks
4. For longer words, the composition area auto-widens and slightly shrinks the text to fit
5. The underlying animation structure does not need to change

## Supporting Evidence
- **User intent observed:** "[发言人: uma] 我有个问题，就是把单词放进这个炸弹里的话，之后如果单词长怎么办"
- **Accepted solution:** The assistant proposed using phonics blocks on projectiles and a separate composition area with auto-widening and text shrinking for long words. The solution was delivered without contradiction and settled as eligible.

## Boundaries
- This skill is derived from a single completed AgentTurn and may not generalize to unrelated game mechanics or non-phonics learning contexts.
- Do not apply while the user is actively correcting or iterating on the design; wait for a clear new task match.
- The design preserves the bomb/cannonball animation structure; it does not redesign the full game architecture.
