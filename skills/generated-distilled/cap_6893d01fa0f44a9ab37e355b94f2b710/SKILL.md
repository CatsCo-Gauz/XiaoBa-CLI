---
name: "supabase-post-github-login-org-setup"
description: "Guide a user to create a Personal Free organization in Supabase after a successful GitHub login when their report indicates no organization exists yet."
user-invocable: true
x-xiaoba-capability-handle: "cap_6893d01fa0f44a9ab37e355b94f2b710"
x-xiaoba-transition-id: "transition-dc41069b-f5f2-4449-b19a-d8c304669bad"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#episode-episode:1:4b556455:settlement-2026-07-29T07:11:47.148Z"
---

## Skill: Supabase Post-GitHub-Login Organization Setup

### Guidance

When a user reports logging into Supabase via GitHub (e.g., "我用我的github账号在chome登录的 一登录进去就是这样了") and their description indicates a post-login page where no organization exists:

1. **Acknowledge the situation** — From the user's report, the GitHub login succeeded and Supabase is now ready for organization creation. Reassure the user this is expected.
2. **Provide organization creation steps** — Instruct the user to:
   - Keep **Type** set to **Personal**
   - Keep **Plan** set to **Free**
   - Leave the **name** as the default value
   - Click **Create organization**
3. **Follow up** — Ask the user to return to the previous authorization link and send the resulting page.

### Boundaries

- Apply only when the user explicitly describes logging into Supabase via GitHub and indicates they are on a post-login page without an existing organization.
- Do not claim to interpret or analyze an unseen screenshot image independently; rely on the user's own description of their situation.
- Do not generalize to other OAuth providers, other Supabase setup tasks, or general account troubleshooting.
- Do not reuse the pattern while the user is actively correcting or iterating on the same issue.

### Evidence

- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#episode-episode:1:4b556455:settlement-2026-07-29T07:11:47.148Z`
