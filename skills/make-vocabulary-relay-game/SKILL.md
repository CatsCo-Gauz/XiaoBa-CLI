---
name: "make-vocabulary-relay-game"
description: "Create or update a self-contained projected classroom English vocabulary relay game from teacher-provided word lists. Use when a teacher wants an energetic team vocabulary game that combines Chinese-English matching, aloud reading, chained correct answers, and a visible race toward a finish line."
user-invocable: true
---

# make-vocabulary-relay-game

## Purpose

Turn a teacher's vocabulary list into a fast, projection-friendly classroom game called **单词接力闯关**. It is deliberately distinct from simple card-matching and hidden-trap games:

- Matching is the entry action, not the whole game.
- Correct answers create a visible team advance and potential combo.
- Wrong answers end the combo and create a short, clear cost instead of exposing secret information.
- The game rewards accurate reading, meaning recall, and group strategy without requiring students to type.

## When to use

Use this skill when a teacher asks to create, replace, or update vocabulary in a two-team English classroom relay game, especially when they provide English words, Chinese meanings, or both.

Do not use it for an ordinary 24-card/12-pair fixed matching board, for a game where teams secretly place traps, or for individual homework drills.

## Required interaction

Before creating the game, gather only the missing essentials:

1. Vocabulary: English word and Chinese meaning pairs. If only English words are supplied, provide sensible Chinese translations and label them for teacher review.
2. Learner level: default to primary or lower-secondary if omitted.
3. Number of teams: default to two.

Use 12 to 24 pairs by default. If fewer than 12 are supplied, repeat only after asking the teacher to approve additional review words. If more than 24 are supplied, use a selectable set or ask whether to split into rounds.

## Game design

### Core loop

1. The teacher starts a round and the active team receives a visible English word.
2. A student reads it aloud. The teacher taps or clicks the word after a correct reading.
3. The team chooses one of three Chinese meaning cards. Exactly one is correct; distractors come from the same list and should be plausible but not ambiguous.
4. A correct match moves the team's runner one space. A second consecutive correct answer lets the team choose a **冲刺** option: answer a second, harder card for one bonus space.
5. An incorrect choice ends that team's combo, briefly marks the missed word for later review, and passes the turn. Do not use humiliation, lives, or permanent elimination.
6. The first team to reach the finish line wins. If all words are exhausted first, the team farther along wins; ties are resolved with one sudden-death word.

### Learning safeguards

- Require a read-aloud confirmation before a meaning choice can be scored.
- Do not repeat a correctly completed pair until every pair has appeared once.
- Put missed words in a visible review tray. At the end, let the teacher replay only this tray.
- Make every correct answer reveal the English word, Chinese meaning, and optionally an example phrase for about two seconds.
- Use randomized order for words and distractors at every new game.

### Difficulty

Provide three modes:

- 热身: two choices, no sprint, short track.
- 标准: three choices, sprint after two consecutive correct answers.
- 挑战: four choices, sprint after two consecutive correct answers, and one pronunciation-only prompt per team.

The default is 标准.

## HTML deliverable requirements

Create a single offline-capable UTF-8 HTML file. Do not depend on CDNs, external fonts, remote images, network access, logins, or build tools.

The page must include:

- A teacher setup panel for entering or pasting word pairs, selecting mode, team names, and starting/resetting a game.
- A large projector-friendly game view with team colors, turn indicator, runner positions, finish line, score progress, English word, choice cards, combo indicator, and review tray.
- Controls suitable for a teacher: mark read correctly, choose a meaning card, skip, undo last score, replay missed words, reset, fullscreen, and sound toggle.
- Keyboard shortcuts: space confirms reading, keys 1 to 4 choose a card, R resets, F toggles fullscreen, and U undoes the latest scored action.
- Accessible color contrast, large touch targets, text labels in addition to color, and no essential sound-only feedback.
- A clean Chinese teacher note in the setup panel explaining the rules in no more than five short lines.

Prefer a playful but uncluttered visual language: a road or map for progress, bold cards, clear success and correction states, and minimal animation that never delays the next turn.

## Implementation guidance

1. Parse pasted content in the forms `word, 中文`, `word - 中文`, `word：中文`, or tab-separated columns. Show parse errors beside the affected row.
2. Store teacher entries and preferences in localStorage only, with a clear button to erase them.
3. Build distractors from unused meanings. Prevent duplicate correct options and avoid a choice whose wording exactly repeats the prompt.
4. Keep state in a small explicit JavaScript model: word queue, completed pairs, missed pairs, turn, team progress, combo count, history stack, and settings.
5. Implement undo from the history stack so it restores the previous turn, progress, combo, queue, and review tray exactly.
6. Test the game with 12 pairs, all three modes, two and three teams, a wrong answer, a sprint success, a sprint failure, undo, replay-missed, keyboard control, refresh persistence, and fullscreen.
7. Save the finished HTML under a task-specific output directory, use a clear Chinese filename such as `单词接力闯关_水果主题.html`, and deliver it with `send_file`.

## Boundaries

- The teacher remains the authority on reading correctness; the page must not claim to assess pronunciation automatically.
- Never require students' accounts, record student names, or transmit vocabulary data.
- Do not use copyrighted character art or externally fetched assets.
- Do not replace a teacher's provided translation silently when it is already supplied.
