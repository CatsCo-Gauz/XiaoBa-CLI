---
name: "dynamic-planning-subagent-system-prompt"
description: "Guidance for handling dynamic planning state and subagent status in Anthropic API system prompts: plan list and subagent state are inserted as system role messages and then collected into the top-level system field, distinct from user runtime feedback and assistant messages."
user-invocable: true
x-xiaoba-capability-handle: "cap_b518401db3f04359a46f8c16bb0c57d1"
x-xiaoba-transition-id: "transition-520b2ec3-fc76-4592-ac74-cc1c58ef40c3"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#episode-episode:3:b6713c8f:settlement-2026-07-29T09:50:09.349Z"
---

# Skill: Dynamic Planning Subagent System Prompt

## Trigger
Applies when implementing or configuring dynamic planning with subagent state tracking in an Anthropic API-based agent system, and the question arises whether plan data and subagent status belong in the system prompt, user role, or assistant role.

## Guidance

1. **System role for plan state**: Insert the plan list and subagent state as a system role message, temporarily placed before the latest user message.

2. **Anthropic top-level system field**: Collect all system role messages and merge them into the top-level `system` field when adapting for the Anthropic API. This means plan updates, subtask running transitions, and waiting state changes all rewrite the top-level `system` field.

3. **Role separation**:
   - Plan lists, subagent status, and dynamic planning state → system (not user or assistant)
   - Only runtime feedback from the environment → user role
   - Assistant responses → assistant role

4. **Implementation pattern**: When the plan or subagent state changes, reconstruct the full system prompt content rather than appending to user or assistant turns.

## Boundaries

- This guidance applies specifically to Anthropic API message format adaptation. Other API providers may use different system prompt mechanisms.
- Only applies when the agent architecture uses explicit subagent state tracking and dynamic plan updates.
- Does not apply to static single-turn prompts or systems using a fixed system prompt.

## Dependencies

*None evidenced.*
