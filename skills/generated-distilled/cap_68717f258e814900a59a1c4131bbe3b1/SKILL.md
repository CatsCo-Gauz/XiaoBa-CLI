---
name: "deliver-prepared-pdf-with-assets"
description: "When pre-existing asset files and a pre-built PDF are at known local paths, stage the assets into an output directory and deliver the PDF via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_68717f258e814900a59a1c4131bbe3b1"
x-xiaoba-transition-id: "transition-fe5e34bb-8438-4174-b5e0-b708710c78d4"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-7:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-7:workflow:execute_shell, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:7:cb36158a:settlement-2026-07-22T10:36:32.435Z"
---

# deliver-prepared-pdf-with-assets

## When to use
When pre-existing asset files (images, fonts) and a pre-built PDF are at known local paths, and the task is to stage those assets into an output directory and deliver the PDF via send_file. This skill does not generate, compose, or modify the PDF or assets — they must already exist.

## Guidance

1. **Stage supporting assets**
   - Create the output directory and a subdirectory for assets.
   - Copy each pre-existing asset file (images, font files) from its known source path into the assets subdirectory.

2. **Deliver the PDF**
   - Use `send_file` with the `file_name` (the PDF's display filename) and `file_path` (the full path to the PDF in the output directory).

## Boundaries
- The PDF and all asset files must already exist at predetermined local paths before this skill is invoked. This skill does not generate, edit, or compose any files.
- Only applies when the user signal is a brief acknowledgment (e.g., "可以的" / "okay") *and* the preceding conversation already established that asset preparation and PDF delivery is the expected next step. The user's intent from "可以的" alone is ambiguous without that broader context.
- Do not apply when the user is requesting changes, corrections, or iterations to the report content or appearance.
- This skill is derived from a single completed delivery attempt; its applicability beyond similar file-staging and PDF-delivery tasks is uncertain.

## Evidence notes
- The user-intent observation in the evidence bundle records only "[发言人: pi-dal]\n可以的" — the surrounding conversation context is not available in this bundle, so what specific request this acknowledges is unknown.
- The delivery outcome is supported by a single source file; confidence in generalization beyond this instance is limited.
