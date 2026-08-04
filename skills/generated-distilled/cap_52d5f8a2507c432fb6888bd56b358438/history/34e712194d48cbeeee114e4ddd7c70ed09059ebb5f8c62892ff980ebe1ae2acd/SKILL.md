---
name: "list-opencli-image-commands"
description: "When a user asks about using opencli for image generation or wants to explore alternative opencli image-generation methods, list available opencli commands related to images, photos, drawing, or art generation by running a filtered opencli list command."
user-invocable: true
x-xiaoba-capability-handle: "cap_52d5f8a2507c432fb6888bd56b358438"
x-xiaoba-transition-id: "transition-a6bd913d-7392-421e-9ef6-2c9ea20ec9b0"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_889.jsonl#turn-1:workflow:execute_shell, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_889.jsonl#episode-episode:2:5b419e33:settlement-2026-07-22T08:17:07.683Z"
---

# Skill: List OpenCLI Image Commands

## Description
When a user asks about using opencli for image generation or wants to explore different image generation methods via opencli, list the available opencli commands related to images, photos, drawing, or art generation.

## Guidance
1. When the user expresses intent to use opencli for image generation or asks about alternative opencli image generation methods, use `execute_shell` on the agent's own environment to list relevant commands.
2. Run: `opencli list 2>&1 | grep -i -E "image|photo|pic|draw|art|gen" | head -40`
3. Present the matching commands to the user so they can choose which opencli image-generation approach to use.

## Boundaries
- This skill applies only when the user's request specifically involves **opencli** and image/photo/art generation.
- Do not apply this skill while the user is correcting or iterating on a delivery.
- Only one completed delivery attempt supports this skill; applicability to significantly different opencli workflows is not yet evidenced.

## Risks
- The agent executes shell commands on its own environment, which implies local shell execution privilege.
- The observed command output was truncated in the evidence; actual results may include more command details.
