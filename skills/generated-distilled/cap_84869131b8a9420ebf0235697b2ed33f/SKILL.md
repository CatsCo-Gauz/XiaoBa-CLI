---
name: "create-oil-painting-from-sports-final"
description: "When a user asks in Chinese about match conflicts, controversies, and penalties of a sports final and then requests an oil painting style image based on research about that final, research the event and deliver an oil painting image via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_84869131b8a9420ebf0235697b2ed33f"
x-xiaoba-transition-id: "transition-f324dd96-cf0d-44ab-b1ad-9f6679f77176"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-3:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:3:941b8f0d:settlement-2026-07-22T10:18:09.327Z"
---

# create-oil-painting-from-sports-final

## Guidance

When a user asks in Chinese about match conflicts, controversies, or penalties of a sports event (e.g., a final/决赛) and then requests an oil painting style image based on that event:

1. Research the event to understand its key moments, narrative, controversies, and decisive plays.
2. Generate an oil painting style image that captures a dramatic or defining moment from the event.
3. Deliver the resulting image file to the user using `send_file`.

## Applicability

This skill applies when the user's conversation includes both (a) inquiry about conflicts/controversies/penalties of a sports match and (b) a request to create an oil painting style image based on that same event.

## Boundaries

- Only applies to sports events/finals where the user explicitly requests an oil painting (油画风格) image.
- Does not cover other artistic styles (e.g., sketch, watercolor, digital art) unless evidenced.
- Does not cover generating an image without first researching the event context.
- Derived from one completed delivery; applicability to other sports or events beyond finals is not yet evidenced.
