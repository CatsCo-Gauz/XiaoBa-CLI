---
name: "explain-url-version-cache-busting"
description: "Explains the distinction between version routing (e.g., v2 replacing latest) and cache-busting query parameters (e.g., ?v=2) when a user questions why a versioned query parameter is present after a version has replaced latest."
user-invocable: true
x-xiaoba-capability-handle: "cap_11935612162c43af9c870d78f698c87d"
x-xiaoba-transition-id: "transition-5bfd2f53-a803-400d-befc-59955a39bcfc"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-5:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:5:f83272a1:settlement-2026-07-29T10:07:29.520Z"
---

## Skill: explain-url-version-cache-busting

### Guidance

When a user asks why a versioned query parameter (e.g., `?v=2`) is being added to a URL when the corresponding version has already replaced `latest`, clarify that the two are separate concerns:

1. **Version routing** – The version identifier (e.g., `v2`) has already replaced `latest` as the default resource path. No additional path versioning is needed.
2. **Cache-busting query parameter** – The `?v=2` suffix is added solely to force the browser or client to bypass its local cache and fetch a fresh copy. It does **not** represent an alternate version path.

After the cache has been refreshed, the plain `latest` URL (which now resolves to the `v2` content) can be used normally without the query parameter.

### Trigger

A user expresses confusion about why a versioned URL query parameter (like `?v=2`) is present when they expected the version to have already replaced the `latest` designation.

### Boundaries

- **Input scope**: Only applies when the user is questioning the purpose of a versioned query parameter in relation to version routing.
- **Do not apply** when the user is reporting a bug, requesting a feature change, or correcting a previous answer.
- **Do not extend** to general URL design, general cache strategy, or other unrelated versioning questions.
