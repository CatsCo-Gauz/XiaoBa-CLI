---
name: "explain-skill-functions-without-saving"
description: "Explain the function of each skill when asked, honoring an explicit request not to save/install them yet; produce a per-skill function explanation (optionally as a catalog document) and do not save, install, or register any skill."
user-invocable: true
x-xiaoba-capability-handle: "cap_ae214919ea1d48c8b104ae837d742137"
x-xiaoba-transition-id: "transition-de7868f9-b270-403a-a344-bc05df48ea57"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_1239.jsonl#turn-8:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_1239.jsonl#turn-8:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_1239.jsonl#turn-8:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_1239.jsonl#episode-episode:8:0fcf172f:settlement-2026-08-03T09:52:13.200Z"
---

# Explain Skill Functions Without Saving

## When to use
Use when a user asks you to explain or describe the function of each skill and explicitly says not to save/install them yet (e.g., "你先向我说说每个skill 的功能吧 ，先不用你保存了"). The deliverable is a per-skill function explanation — not an installation.

Do not use this when the user is correcting or iterating on the task, or when they ask to save/install the skills; saving is a separate capability.

## Core constraint
When the user says "先不用你保存了" (no need to save yet), do **not** save, install, or register any skill. State explicitly in your reply that nothing was saved or installed.

## Steps
1. Resolve what "每个skill" means before enumerating: locally registered skills, a specific loaded skill, or skills from remote catalogs (e.g., ClawHub / SkillsMP / GitHub). Base the list on the sources actually available at execution time.
2. If the user means currently registered skills, enumerate from the current Skill Registry at execution time rather than reusing counts or names from a previous episode. Never hard-code a count (e.g., "约 70 个") or fixed skill names — they change over time.
3. For each skill in scope, state its name and a concise description of its function; group related skills by domain when helpful.
4. Deliver a concise in-chat summary of the functions. If a document is wanted, reuse the create-html-report dependency to produce an A4-print-ready Chinese HTML/PDF and deliver it via send_file.
5. Mark verification boundaries: distinguish checks already performed (e.g., public-page or directory/license review) from what must be reviewed before any future save decision (allowed-tools, scripts, network requests, credentials, data uploads, license obligations).

## Boundaries
- Do not save, install, or register skills when the user asked you not to — that is the core evidenced behavior.
- Do not assume access to remote catalogs, accounts, credentials, or a specific registry state; re-resolve sources and directories at execution time (paths from a previous session are not reusable).
- The guidance is based on one completed episode; treat the underlying skill catalog content as unverified unless re-checked at execution time.
