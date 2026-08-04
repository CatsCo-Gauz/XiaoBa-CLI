---
name: "deliver-sports-final-oil-painting"
description: "When a user asks in Chinese about what model generates images, then requests generating additional images based on a previous report about a sports final event and embedding them into a PDF, deliver the oil painting style image file via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_a0f896d96d0c4fedbe39124f9a88d2a5"
x-xiaoba-transition-id: "transition-3ab123e9-4418-4a6d-9772-c3015703fa17"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-6:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:6:3fd692f1:settlement-2026-07-22T10:28:32.438Z"
---

# deliver-sports-final-oil-painting

## Description
When a user asks in Chinese about what model generates images, then requests generating additional images based on a previous report about a sports final event and embedding them into a PDF (确认是嵌入而非简单重排), deliver the oil painting style image file via send_file.

## Applicability
- The user's request explicitly references generating images based on a prior report about a sports final (e.g., World Cup final).
- The user confirms the images should be **embedded** into a PDF, not simply rearranged.
- The request is about an oil painting or image generation for a completed sports event.

## Boundaries
- Only apply when a new request matches the same user-facing capability evidenced here (image generation for a sports final report with PDF embedding intent).
- Do not reuse this pattern while the user is actively correcting or iterating on the delivery.
- This skill does not include researching the event; it covers delivering an already-generated oil painting image file in response to such a request.

## Guidance
1. When the user asks about the image generation model used and requests generating more images based on a previous report to embed into a PDF, confirm the embedding requirement.
2. Deliver the generated oil painting PNG file of the sports final event using `send_file` with the appropriate file name and path.

## Risks
- This skill is derived from a single completed delivery attempt and may not generalize to other image styles, events, or document formats.
- The evidence does not cover the actual image generation process or model query — only the delivery of the resulting file.
- Keep the skill bounded by the supplied evidence; do not assume the system can generate arbitrary images or embed files into PDFs.
