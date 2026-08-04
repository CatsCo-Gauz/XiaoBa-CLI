---
name: word-whack-mole-wordlists
description: Create or update the approved pure-listening Word Whack-a-Mole HTML by managing teacher-named English word lists only. Use when a teacher asks to make a new word-list version, add English vocabulary, or continue an existing approved Word Whack-a-Mole HTML. Do not use to redesign the game or alter its layout, scoring, animations, or teams.
user-invocable: true
---

# 单词打地鼠纯听音固定换词 Skill

## Purpose

This is a fixed-template pure-listening vocabulary workflow. The approved HTML locks the game title 单词打地鼠, polished embedded PNG artwork, compact six-hole layout, three English choices per round, blue/red full-team rounds, manual handoff, scoring, hammer feedback, English speech, game sound effects, victory celebration, and agent-managed embedded word lists.

Only teacher-named English word lists may be changed.

## Non-negotiable behavior

- The teacher supplies English words or phrases only. Do not request, infer, display, or add Chinese meanings or separate prompts.
- The top of every round displays only 听一听. The game speaks the target English item and shows three English mole choices.
- The orange sound button repeats the current target English item.
- Whether opened as a local file or at an http or https URL, the HTML allows switching embedded word lists and playing only.
- The page must not expose controls to add, rename, edit, save, or delete word lists. Any list change must be embedded into a newly generated HTML by the agent.
- Switching lists immediately restarts the game and resets both team scores.
- Every new list name must be supplied by the teacher. Never invent, infer, translate, or silently assign a list name.
- Each list needs at least 3 unique English items. Suggest 8 to 10 items, but do not impose a maximum.
- Each round has exactly three English choices distributed across both hole rows. A match selects up to six target items; blue and red teams answer the same target set, each team completes six consecutive questions, and the page waits for a manual 红队开始 handoff between teams.
- Correct answers trigger the hammer plus a short 咚＋叮 cue. Wrong answers and timeouts trigger the embedded human Oops cue. The final result compares both scores and shows a celebration melody, confetti, stars, and the winning PNG mascot animation.
- Keep CAN_EDIT_LISTS=false. Ignore browser-local custom lists and expose only embedded list switching.
- Never replace the approved PNG artwork with SVG, Emoji, CSS approximations, or assets cut from an overview board.

## When to use

Use when the request is to create or continue this approved pure-listening 单词打地鼠 page with teacher-supplied English vocabulary.

Do not use when the user asks for Chinese prompts, translations, new gameplay, new visual design, changed team rules, remote editing, a database, login, cloud sync, a different game, or an arbitrary HTML project. Treat those as a separate design decision before touching this Skill.

## Required clarification

Before any file write, ask and wait only for missing facts that affect the output:

1. Is this a new HTML or should the Skill continue an existing HTML?
2. What exact name does the teacher choose for every new word list?
3. What English words or phrases belong to each named list?

Do not ask about Chinese meanings, teams, title, layout, animation, number of holes, cloud editing, or list count; those are absent or fixed. If the source and vocabulary are already clear, do not ask again.

For a continued HTML, first inspect embedded lists. Append requested new lists; never overwrite or delete an existing embedded list unless the user explicitly asks to replace it. The page has no word-list editor and does not use browser-local list data.

## Input format

Accept one English word or phrase per line. Preserve teacher wording and casing unless a clear typo is confirmed.

Example:

five
nine
one hundred

Reject a list if it has fewer than 3 items, blank items, or case-insensitive duplicates. State the concrete rows needing correction.

The JSON specification uses string arrays:

[
  {
    "name": "老师给出的词表名",
    "words": ["five", "nine", "one hundred"]
  }
]

The updater may read legacy `{q,a}` entries only to migrate an older approved HTML by keeping the English `a` value. When a legacy source is detected, it places the migrated embedded lists into the current pure-listening template; it never combines string data with legacy gameplay code. New teacher input and new output use English strings only.

## Files

- Approved template: assets/单词打地鼠_多词表母版.html
- Safe list updater: scripts/apply_word_lists.py

The template contains explicit word-list markers. Never use broad replacement on its CSS, unrelated HTML structure, animations, or scoring logic.

## Workflow

1. Confirm new versus continue and collect the teacher-defined name and English items for every new list.
2. Choose the source:
   - New: copy assets/单词打地鼠_多词表母版.html to a new output name.
   - Continue: make a dated backup adjacent to the supplied file and use that file as source.
3. Inspect source lists:

   python3 scripts/apply_word_lists.py --source SOURCE.html --output ignored.html --mode inspect

4. Write a temporary JSON spec outside the final deliverable using `{name, words:["..."]}`.
5. For a new file, replace all embedded lists. For continuing, append only named new lists:

   python3 scripts/apply_word_lists.py --source SOURCE.html --output OUTPUT.html --spec lists.json --mode replace-all

   python3 scripts/apply_word_lists.py --source SOURCE.html --output OUTPUT.html --spec lists.json --mode append

6. Validate in a real browser. At minimum verify:
   - The page loads with no runtime error.
   - Every requested list appears with its exact teacher-supplied name.
   - The top stays 听一听 and never exposes a separate target prompt.
   - Starting a game yields six holes and exactly three visible English choices.
   - The speech call receives the current target English item; the sound button repeats it.
   - Correct, wrong, timeout, hammer feedback, 咚＋叮, embedded Oops, scoring, and win behavior still work.
   - Blue completes six consecutive questions, the handoff modal remains until 红队开始 is clicked, then red completes six consecutive questions using the same six targets.
   - Blue win, red win, and tie results compare scores correctly; celebration visuals and the win sound trigger and reset cleanly on restart.
   - Switching a list resets scores to zero and uses the new list.
   - A file URL hides add, rename, edit, save, and delete controls while preserving list switching.
   - An http or https URL does the same and does not load browser-local list data.
   - Test at 800 by 500, 1024 by 650, and 1440 by 900; verify no overflow or celebration clipping and spot-check long English labels when supplied.
   - Verify the three visible choices span both hole rows, mute behavior is coherent, restart clears celebration state, and the console has no errors.
7. Keep the source untouched. Deliver an independently named HTML and report only verified behavior. Do not claim audible sound was heard when automation only verified `speechSynthesis.speak()` calls.

## Naming and delivery

Use a clear Chinese HTML filename based on the teacher's topic, such as 单词打地鼠_水果听音词表.html. For a multi-list edition, use 单词打地鼠_纯听音多词表版.html.

Every list addition or modification must be embedded through this Skill and delivered as an updated HTML. The page itself must remain non-editable.

## Boundaries

- Do not add Chinese meanings, translations, or separate prompts.
- Do not add cloud databases, accounts, syncing, remote editing, analytics, or data collection.
- Do not rename a teacher's list.
- Do not silently add vocabulary items.
- Do not replace the approved PNG compact team-round template with an older, SVG, Emoji, or simplified game version.
- Do not expose word-list editing controls or use local browser storage for word-list changes.
