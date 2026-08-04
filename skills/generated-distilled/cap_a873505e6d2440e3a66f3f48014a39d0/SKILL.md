---
name: "explain-cloud-database-necessity"
description: "When a user questions why a cloud database and login are necessary for their static-hosted web project, explain the static hosting constraint, the purpose of a cloud database and user login, and offer viable alternative services or approaches."
user-invocable: true
x-xiaoba-capability-handle: "cap_a873505e6d2440e3a66f3f48014a39d0"
x-xiaoba-transition-id: "transition-d76877b6-22bc-4651-990b-ba47a76fe8b3"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#episode-episode:2:ba07c783:settlement-2026-07-29T07:15:42.349Z"
---

# Skill: explain-cloud-database-necessity

## Guidance

When a user questions why a cloud database (such as Supabase) and user login are necessary for their project — especially when the app is hosted on a static platform like GitHub Pages — explain the following:

1. **Static hosting constraint**: Platforms like GitHub Pages serve only static files and cannot securely persist user data across sessions or devices on their own.
2. **Purpose of a cloud database**: A cloud database provides managed, server-side storage so data can be saved, retrieved, and synchronized across the user's devices.
3. **Purpose of login**: Login associates stored data with a specific user, ensuring the user can access their own data from any device while keeping it private.
4. **Alternatives**: The specific service (Supabase) is not mandatory. Offer viable alternatives such as Firebase, a self-hosted server, or manual import/export. Note that any automatic cross-device synchronization requires some form of cloud backend.

## Boundaries

- Apply only when the user questions the necessity of a cloud database, user login, or a chosen backend service for their web project.
- Do not apply when the user is actively iterating on or correcting an ongoing implementation task.
- This skill provides architectural explanation and technology options; it does not perform implementation, setup, or migration work.

## Evidence

- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#turn-2:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#episode-episode:2:ba07c783:settlement-2026-07-29T07:15:42.349Z`
