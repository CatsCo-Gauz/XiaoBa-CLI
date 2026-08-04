---
name: "retry-phonics-cannon-html"
description: "Re-delivers the phonics cannon (自然拼读大炮) classroom teaching aid HTML file when a user requests a retry (重试), using send_file from the known output path within an active session where the file was previously generated."
user-invocable: true
x-xiaoba-capability-handle: "cap_ed5124f8c52b4891b964980b91e034f8"
x-xiaoba-transition-id: "transition-a37bf4d0-c83e-4a97-9d2e-22f8f995a206"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:4:1bb78dd3:settlement-2026-07-30T09:15:43.329Z"
---

### Current Skill: retry-phonics-cannon-html

**What this skill does**  
Re-delivers the phonics cannon (自然拼读大炮) classroom teaching aid HTML file when a user says "重试" (retry) during an active session where that file was previously generated.

**When to apply**  
- The user utterance is a retry command (重试 / retry) from a known speaker in a teaching-aid generation context.  
- The target HTML file (`自然拼读大炮_课堂大屏教具_V1.0.html`) already exists at the known output path under `/home/xiaoba/app/work/image-asset-generator-runs/phonics-cannon-yellow-helper-v2-20260730/`.  
- The interaction takes place in a context where the same file was previously delivered and the user is asking to re-send it.

**How to apply**  
1. Confirm the user's intent is a retry of the previously sent phonics cannon HTML teaching aid.  
2. Use `send_file` to deliver the file from its existing path:  
   `/home/xiaoba/app/work/image-asset-generator-runs/phonics-cannon-yellow-helper-v2-20260730/自然拼读大炮_课堂大屏教具_V1.0.html`  
3. Confirm delivery to the user (acknowledge that the file has been re-sent).

**Boundaries**  
- This skill covers *re-delivery only*, not the initial generation or modification of the phonics cannon teaching aid.  
- Do not apply when the user is correcting, iterating, or requesting changes to the file content.  
- Do not generalize to arbitrary files, other classroom tools, or non-HTML artifacts.  
- Do not apply outside a session where this specific file was previously generated and delivered.

**Evidence refs**  
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-2:delivery:send_file`  
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:4:1bb78dd3:settlement-2026-07-30T09:15:43.329Z`

**Referenced skills**  
*(none)*
