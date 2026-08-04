---
name: "assist-play-spaceship-avoidance-game"
description: "Helps a user who reports they cannot start or play a browser-based spaceship-avoidance game by verifying the link loads normally (standard HTTP request) and providing game-specific instructions (click start button, drag spaceship to dodge obstacles). Based on a completed episode where the user asked '我怎么玩不了' and the assistant confirmed the link and explained the spaceship/meteor-dodging gameplay."
user-invocable: true
x-xiaoba-capability-handle: "cap_da62bce6ccfc4ce5821490ae519930a8"
x-xiaoba-transition-id: "transition-c6546f0b-6df3-46d4-a5f1-c19e7546b40c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:3:ad9e53ee:settlement-2026-07-29T09:57:47.416Z"
---

## assist-play-spaceship-avoidance-game

### When to use
Help a user who reports they cannot start or play a browser-based spaceship-avoidance game (a game where the player drags a spaceship to dodge meteors/obstacles). The user already has a direct link to the game page but encounters trouble beginning or understanding gameplay.

### Input requirements
- A direct URL to the specific spaceship-avoidance game
- The user's description of what happens when they try to play (e.g., button not working, unclear how to start)

### What to do
1. Acknowledge the user's issue.
2. Visit the provided URL (standard HTTP request) to verify the game page loads normally. Report the link status observation to the user.
3. Provide gameplay instructions specific to the game's interface — e.g., click any "Start Challenge" / "开始挑战" button, then drag the spaceship to avoid falling obstacles.
4. If the user reports a specific UI element (button, control) not working, offer to help further by reviewing a screenshot from the user.

### Boundaries
- Only apply when the user's problem is about accessing or playing a browser-based spaceship/obstacle-avoidance game they already have a link for.
- Do not apply to general computer issues, game recommendations, game creation, or other genres of web games.
- Link verification means visiting the URL via standard HTTP — never implies or attempts remote access to the user's computer or device.
- Do not reuse this pattern while the user is correcting or iterating on the task.
- This skill is derived from one completed episode and may not generalize to all spaceship games.

### Evidence
- Episode: User said "我怎么玩不了" — the assistant visited the game URL (standard HTTP request, returned normal), instructed the user to click "开始挑战" (Start Challenge) and drag the spaceship to avoid meteors, and offered to review a screenshot if the button didn't work. ([evidence refs: /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:3:ad9e53ee:settlement-2026-07-29T09:57:47.416Z])
