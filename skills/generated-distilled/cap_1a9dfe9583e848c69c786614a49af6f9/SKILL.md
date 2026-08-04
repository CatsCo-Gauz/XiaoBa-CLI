---
name: "resend-file-on-retry"
description: "Resend a file to the chat when the user requests a retry (重试), using the file already known from the current context."
user-invocable: true
x-xiaoba-capability-handle: "cap_1a9dfe9583e848c69c786614a49af6f9"
x-xiaoba-transition-id: "transition-5e20863a-ca20-4c54-bd3c-0ee1c9fd3d46"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-3:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:4:fdf60311:settlement-2026-07-30T05:04:25.173Z"
---

# resend-file-on-retry

## Trigger
When the user says "重试" (retry) in a context where a specific file was part of the ongoing interaction and needs to be resent to the chat.

## Guidance
1. Use `send_file` to resend the file that was the subject of the current context.
2. Provide a descriptive display name that reflects the file's content.

## Boundaries
- Apply only when the user explicitly says "重试" (retry) in the context of resending a file already present on disk.
- This skill does not cover file generation, discovery across multiple directories, or initial creation of the file.
- The file path and name must already be known from the current context; do not invent a scanning or identification step.
- Do not extend to generic file sending unrelated to a retry request, or to non-file retry scenarios.
