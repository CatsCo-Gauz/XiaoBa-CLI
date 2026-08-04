---
name: "game-hammer-sound-effects"
description: "Propose sound effect and celebration design for a hammer-based game interaction, covering success tone, failure 'Oops' voice, and victory celebration with visual effects, while preserving mute control and audio separation."
user-invocable: true
x-xiaoba-capability-handle: "cap_116b1c8783a24598b5e5d7b86a7a2af0"
x-xiaoba-transition-id: "transition-6be48439-a968-4d86-8328-c63da9adc65c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-12:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:12:b44b0ad7:settlement-2026-07-29T10:58:49.476Z"
---

## Skill: Game Hammer Sound Effects

### Guidance

When the user requests sound effect design for a hammer-based game interaction (success, failure, and victory):

1. **Success sound**: Use a short, crisp "咚＋叮" (dong + ding) tone — satisfying but not prolonged.
2. **Failure sound**: Use a soft, gentle "Oops" human voice — avoid harsh buzzing or beeping.
3. **Victory celebration**: Stop the current question/task, play celebratory music, and trigger visual effects (confetti, star burst, winning character jump), then display the score.
4. **Audio separation**: Ensure sound effects do not overlap with word-reading audio.
5. **Mute control**: Preserve the existing mute/sound toggle; do not override the user's volume preference.
6. **No code changes yet**: Present only the design proposal without modifying the implementation.

### Boundaries

- This skill applies only to audio/visual feedback design for a **hammer-based game interaction** with success, failure, and victory states.
- Do not apply to generic game sound design, music composition, or unrelated UI sound effects.
- Do not apply when the user is actively implementing or iterating on code — this is a proposal-only pattern.
- The victory celebration assumes a quiz or question-based game context with a score display.

### Evidence

- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-12:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:12:b44b0ad7:settlement-2026-07-29T10:58:49.476Z`
