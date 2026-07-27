---
name: "generate-gauss-robot-cat-avatar"
description: "When a user asks in Chinese to generate a Gauss-style robot cat avatar (e.g., '高斯样子的一只机器猫' as an avatar/头像) with authorization indicated, write a detailed Chinese prompt file to the image-asset-generator-runs directory and deliver the resulting image via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_5dcd3f422cfe4d0c960181e05f466dbf"
x-xiaoba-transition-id: "transition-70347dfc-2de8-4e1b-b096-6a2e1b28154b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_915.jsonl#turn-6:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_915.jsonl#turn-6:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_915.jsonl#episode-episode:6:ae24f0f1:settlement-2026-07-23T05:17:37.288Z"
---

# Skill: Generate Gauss-style Robot Cat Avatar

## Applicability
Applies when a user asks, in Chinese, to generate an avatar/profile picture of a Gauss-style robot cat (e.g., "高斯样子的一只机器猫" as an avatar/头像), and has indicated authorization or consent.

Do **not** apply when:
- The request is for a different character, animal, or style not matching the Gauss–robot cat theme.
- The user is still correcting or iterating on the prompt or the delivered image.
- The task requires configuring SSH keys, GPG keys, or any other system administration work.

## Guidance

1. **Understand the request.** The user wants a square social avatar featuring a robot cat with the dignified, contemplative气质 of Carl Friedrich Gauss — a fusion of 19th-century European scholar aesthetics and sci-fi mechanical elements.

2. **Write a detailed Chinese prompt file.** Use `write_file` to create a prompt at a path under `/home/xiaoba/app/work/image-asset-generator-runs/`. The prompt should describe:
   - A square social avatar (square composition, head-and-shoulders close-up, facing the viewer).
   - A robot cat with clear, friendly facial contours, metal ears, and精密 mechanical joints.
   - Color palette: silver-gray and deep blue metal with少量 warm gold circuit glow.
   - Head styling: tidy silver-white hair and a solemn, scholarly expression reminiscent of a 19th-century European academic.
   - A discreet mathematical-instrument structure on the chest.
   - Background: a dark gradient with faint mathematical or geometric patterns.

3. **Deliver the generated image.** Use `send_file` with the file name of the resulting image asset to present it to the user.

## Boundaries

- This skill covers only the generation of a **Gauss-style robot cat avatar** via prompt writing and image delivery. It does not cover other avatar styles, SSH/GPG key management, or general image generation requests.
- Do not reuse this pattern while the user is correcting or iterating on the delivery.
- The prompt content and file path should be adapted to match the specific Gauss–robot cat theme evidenced in the episode.

## Evidence

- `completionEvidence`: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_915.jsonl#turn-6:delivery:write_file`, `/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_915.jsonl#turn-6:delivery:send_file`
- `settlementEvidence`: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_915.jsonl#episode-episode:6:ae24f0f1:settlement-2026-07-23T05:17:37.288Z`
- `semanticObservations`: user intent to generate a Gauss-style robot cat avatar; artifact operations `write_file {file_path}` and `send_file {file_name}`.
