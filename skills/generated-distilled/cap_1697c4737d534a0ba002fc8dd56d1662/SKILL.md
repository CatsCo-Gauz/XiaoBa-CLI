---
name: "word-whack-listening-chrome-acceptance-summary"
description: "Produce and deliver the Chrome acceptance summary documentation for the 单词打地鼠纯听音 (Word Whack-a-Mole pure listening) feature: write the acceptance HTML documenting already-obtained Chrome test results (pure-listening flow, page and word-list behaviors, environment) with explicit Chrome-only and API-stub boundaries, then send the existing PDF to the chat. Does not create or run tests, convert HTML to PDF, or cover Safari/real-device verification."
user-invocable: true
x-xiaoba-capability-handle: "cap_1697c4737d534a0ba002fc8dd56d1662"
x-xiaoba-transition-id: "transition-f096c6de-9532-4de1-99e6-9916db334905"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1012.jsonl#turn-5:delivery:write_file:call-id-a9d15c458751-1, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1012.jsonl#turn-5:delivery:write_file:call-id-7c077ef97090-2, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1012.jsonl#turn-5:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1012.jsonl#episode-episode:5:dbf363bf:settlement-2026-07-28T10:26:23.108Z"
---

# word-whack-listening-chrome-acceptance-summary

## Trigger
The user requests continuation ("继续啊") or the acceptance documentation for the **单词打地鼠纯听音** (Word Whack-a-Mole pure listening) feature, in a context where the Chrome acceptance results have **already been obtained** ("浏览器验收已补完" — acceptance already completed). The episode shows the user asking to continue, followed by delivery of the completed acceptance documentation, not a test run.

## When to use / when not to use
- **Use when:** Chrome acceptance results for the 单词打地鼠纯听音 feature already exist and the user needs those results summarized in an acceptance document and delivered.
- **Do not use to:** create or run Playwright acceptance tests, execute a browser, verify Safari or real-device behavior, or convert the HTML into a PDF — none of those steps are evidenced in this episode.

## Steps

1. **Write the acceptance summary HTML** (file name `单词打地鼠纯听音_Chrome验收说明.html`) documenting the already-obtained results, following the evidenced structure:
   - **Environment line:** `验收环境：Chrome for Testing 151.0.7922.34，自动化测试`.
   - **Pass statement:** the pure-listening master page ran without runtime errors in both local-file and HTTP-webpage modes.
   - **Verified pure-listening flow:** the prompt always shows "听一听" with no Chinese or numeric question text; each round shows three distinct English options including the target word; auto-read and repeat-read both receive the current target English (this is API-call verification, not evidence that audio was actually heard); a correct answer adds one star, a wrong answer adds no star and displays the correct English word.
   - **Verified page and word-list behavior:** at 800×512 and 1024×600 the page does not scroll and word cards stay within the viewport without intersecting each other; file mode allows adding a word list, saving, resetting, and using the new list for later rounds; HTTP mode hides the edit area while keeping the list-switch entry; no pageerror or console error occurred across the three test groups.
   - **Boundary note (required):** the conclusion covers Chrome automation only; Safari real-device visual rendering and real audio output still need separate acceptance on the user's device.

2. **Deliver the PDF** (`单词打地鼠纯听音_Chrome验收说明.pdf`) via `send_file`. The PDF already exists at its path and is sent to the chat; no conversion or regeneration step is evidenced or claimed.

## Boundaries
- **Documentation of completed results only.** The acceptance was finished before this delivery; do not claim to have run the tests, collected results, or performed verification within this capability.
- **No PDF conversion step** is evidenced — deliver the existing PDF rather than describing an HTML-to-PDF pipeline.
- **Chrome automation only.** No generalization to Safari, mobile browsers, or real devices; keep the "Safari 另行验收" note in the document.
- **No real audio claim.** Speech is verified via stubbed API calls; never present that check as actual sound output validation.
- **Episode-specific paths.** The evidence uses hardcoded paths under `/home/xiaoba/app/tmp/` and `/home/xiaoba/app/skills/...`. Re-resolve file paths for the current environment; do not carry over episode paths or directory structure as reusable defaults.

## Key Constraints
- Preserve the documented content sections (environment, pass statement, verified flows, page/word-list behaviors) and the boundary note in the delivered summary.
- Always state the "Chrome-only / Safari separate verification" boundary and the "API call, not real audio" limitation explicitly in the document.
- Send the PDF to the chat via `send_file` with the exact filename `单词打地鼠纯听音_Chrome验收说明.pdf`.
