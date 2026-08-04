---
name: "generate-html-game-on-vague-prompt"
description: "Generate and deliver an interactive HTML game file via send_file when the user gives a vague Chinese creative invitation like '你随便编'."
user-invocable: true
x-xiaoba-capability-handle: "cap_00cbae9a33424839853fe5f7b7576ce3"
x-xiaoba-transition-id: "transition-e943bc63-4077-49d0-b44a-7e0eaa394302"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-5:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:5:5291e684:settlement-2026-07-29T07:16:41.543Z"
---

## Skill: Generate Interactive HTML Game on Vague Chinese Prompt

### Guidance

When the user says **"你随便编"** (or a semantically equivalent open-ended Chinese invitation meaning "make something up"), you may respond by generating an interactive HTML game file and delivering it via `send_file`.

**Trigger boundaries**
- The trigger is the user explicitly giving a vague creative invitation (你随便编 / "make something up") in Chinese.
- Do not apply this skill to other open-ended prompts, specific task requests, or non-Chinese utterances.
- Do not apply when the user is correcting, iterating, or has already specified a concrete deliverable.

**Action**
- Generate an interactive HTML game (a single self-contained `.html` file with embedded CSS and JavaScript).
- Deliver the file to the user using `send_file` with a descriptive Chinese file name.
- Do not attempt to deploy, host, or publish the file online — deliver only the offline file.

**Boundaries**
- This skill does not prescribe what kind of game to create; the episode evidence shows a location-vocabulary game, but the assistant's choice of theme is autonomous and not part of the transferable rule.
- Do not extend this guidance to documents, reports, lists, slides, or non-game interactive content.

**Referenced skills**: None.
