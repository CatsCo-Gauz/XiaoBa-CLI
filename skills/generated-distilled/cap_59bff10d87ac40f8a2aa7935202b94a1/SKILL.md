---
name: "diagnose-cross-device-persistence-needs"
description: "When a user reports that same-account records are not visible across devices on a static site, diagnose the missing cloud database layer and recommend secure Supabase authorization."
user-invocable: true
x-xiaoba-capability-handle: "cap_59bff10d87ac40f8a2aa7935202b94a1"
x-xiaoba-transition-id: "transition-30cb7ed0-6487-44b8-9773-9a3f0aec7e76"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1035.jsonl#episode-episode:1:9f9cce2d:settlement-2026-07-29T06:13:37.883Z"
---

## Skill: Diagnose Cross-Device Persistence Needs for Static Sites

### Description
When a user reports that records created under the same account are not visible across different devices while using a static website, assess the current hosting architecture, identify the absence of cloud database permissions, and explain the fundamental limitation. Recommend a secure authorization step (e.g., Supabase via official login link or device code) as the prerequisite for building cross-device persistence, without handling passwords or secrets directly.

### Guidance

**Input requirements**
- User states or implies that data written while logged into the same account on one device is not visible on another device.
- The site in question is known or confirmed to be a static website (e.g., hosted on GitHub Pages).

**Diagnostic steps**
1. Confirm the site is statically hosted (no server-side runtime).
2. Check whether any cloud database (e.g., Supabase, Firebase, custom backend) has been provisioned and its credentials are available.
3. If no cloud database exists, explain: a static page cannot write records across devices by itself because there is no shared writable data layer.

**Recommendation**
- State that cross-device persistence requires a cloud database.
- Propose a specific cloud database (e.g., Supabase) that the user can authorize.
- Instruct the user to authorize via **official login link or device code only** — never ask for or accept plaintext passwords.
- Do not proceed to build the database, encrypt accounts, migrate old records, or republish until the user has completed the authorization step.

**Boundaries**
- This skill is limited to the **diagnosis and recommendation** phase. It does not cover database setup, data migration, encryption, or deployment.
- Do not inherit or assume any existing cloud database credentials, OAuth tokens, or GitHub repository write access from the episode.
- Do not extend to arbitrary websites, CMS platforms, or non-static architectures without additional evidence.
- If the user is actively correcting or iterating on the same task, do not reuse this pattern until a fresh, settled request is received.

### Risks
- The recommended solution requires the user to grant external authorization, which carries security implications. The assistant must never handle plaintext passwords or secrets.
- Derived from a single completed episode; applicability should be re-evaluated if broader evidence becomes available.
