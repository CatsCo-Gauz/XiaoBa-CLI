---
name: "list-current-skills"
description: "When a user asks what skills you currently have or requests a listing of available capabilities, consult the authoritative Current Skill Registry, verify active/enabled state, include the observation time, and deliver a formatted inventory report via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_450558bd3cd54ae697e11ba8631d1fba"
x-xiaoba-transition-id: "transition-9f906283-0758-46ed-8981-921c6d0beff5"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1119.jsonl#turn-1:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1119.jsonl#episode-episode:1:a9e39497:settlement-2026-07-30T04:50:41.370Z"
---

## Guidance: list-current-skills

### Trigger
When the user asks what skills you currently have, requests a listing or inventory of available capabilities, or poses a question similar to "现在你有哪些skills" or "what skills do you have".

### Behavior
1. **Consult the authoritative Current Skill Registry** at execution time to discover registered skills.
2. **Verify skill directory paths and active/enabled states** where the registry provides them.
3. **Record and include the observation time** in the delivered output so the user knows when the snapshot was taken.
4. **Do not hard-code** any skill count, name, category, or classification from this or any prior episode — always read the live registry.
5. **Organize the result** into a readable format (e.g., categorized list, summary with counts, tabular layout).
6. **Deliver the report** to the user via send_file (or an equivalent file-delivery mechanism).

### Boundaries
- Only applies when the user explicitly asks about currently available skills or capabilities.
- Does **not** cover modifying, creating, deleting, enabling, or disabling skills.
- Does **not** cover listing capabilities outside the Current Skill Registry (e.g., external systems, tools, or platform services).
- If the user asks about a specific skill's details rather than an inventory, this skill does not apply.
