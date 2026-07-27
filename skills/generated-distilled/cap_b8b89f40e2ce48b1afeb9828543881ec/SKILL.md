---
name: "fix-vision-fallback-provider-test"
description: "When a user reports a bug where a readfile operation incorrectly determines that a multimodal model is not multimodal, preventing a closed-loop test from completing, write or modify the vision fallback provider test file at /home/xiaoba/app/tests/vision-fallback-provider.test.ts to fix the issue, perform modular testing, and optionally arrange independent subagent review until the function converges cleanly."
user-invocable: true
x-xiaoba-capability-handle: "cap_b8b89f40e2ce48b1afeb9828543881ec"
x-xiaoba-transition-id: "transition-8e1cbec2-d117-4fdc-9fee-6cbc48738257"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_894.jsonl#turn-3:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_894.jsonl#episode-episode:3:1291ae9e:settlement-2026-07-23T04:08:16.785Z, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_894.jsonl#turn-3:user-intent"
---

# Skill: fix-vision-fallback-provider-test

## Description

When a user reports a bug where a readfile operation incorrectly determines that a multimodal model (e.g., gpt-5.6-sol) is **not** multimodal, preventing a closed-loop test from completing, write or modify the vision fallback provider test file at `/home/xiaoba/app/tests/vision-fallback-provider.test.ts` to fix the issue. Perform modular testing after the change and, if requested, arrange for an independent subagent review to iteratively clean the function until it converges.

## Guidance

1.  **Understand the bug context.** The model configuration (e.g., gpt-5.6-sol) is inherently multimodal, but a `readfile`-based check incorrectly reports it as non-multimodal. This breaks the closed-loop test for the vision fallback provider.
2.  **Locate and modify the test file.** Edit `/home/xiaoba/app/tests/vision-fallback-provider.test.ts` to correct the logic that determines whether the model is multimodal. The file uses the `node:test` framework (`import { afterEach, describe, test } from 'node:test'`), `node:assert`, `fs`, `http`, and `os`.
3.  **Run modular tests.** Execute the test suite for the vision fallback provider to verify the fix works in isolation.
4.  **If requested, arrange independent subagent review.** Have an independent subagent review the modification from necessary perspectives (e.g., correctness, edge cases, test coverage). If issues are found, iterate: fix, retest, re-review, and repeat until the function converges cleanly.

## Applicability

- **When:** A user explicitly describes a bug where a `readfile` operation fails to recognize a multimodal model as multimodal, and asks you to fix the corresponding test file for a vision fallback provider.
- **When not:** The user is not talking about a vision fallback provider or multimodal model detection bug. The task is unrelated to fixing a test file or does not mention modular testing or independent review.

## Boundaries

- This skill is derived from a single settled learning episode and may not generalize to all vision fallback provider bugs.
- The file path is fixed at `/home/xiaoba/app/tests/vision-fallback-provider.test.ts`; a different file path or a different test framework would be outside the observed evidence.
- The skill does not grant access to modify model configurations or production code outside of this test file.
- Independent subagent review is performed only when explicitly requested or implied by the user's instructions.

## Dependencies

None evidenced.
