---
name: "data-dashboard-refresh-embedding"
description: "Explain the data-scraping dashboard's real-time polling cadence (60s backend fetch, per-second countdown, manual refresh) and where it is embedded in the user's desktop TODO (collapsible hotspot card on the Today/Home right side; below the task list on narrow screens)."
user-invocable: true
x-xiaoba-capability-handle: "cap_8080d36242be423483ee48bccb1bc60d"
x-xiaoba-transition-id: "transition-09af35eb-60c2-43b3-a0f5-29a45527a99d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_617.jsonl#turn-8:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-08-03/catscompany_cc_group_grp_617.jsonl#episode-episode:8:5531bdb2:settlement-2026-08-03T07:29:39.551Z"
---

# Data Dashboard Refresh & Embedding Guidance

## When to use
Apply when a user asks about the data-scraping dashboard's update freshness or cadence (e.g., "is this updated in real time?", "how many seconds between updates?") or where the dashboard would be embedded in their desktop TODO app.

## Guidance
- Describe the dashboard as real-time polling: backend data is fetched automatically every 60 seconds, the on-page countdown changes every second, and a manual immediate refresh is available.
- Embedding plan: place a collapsible hotspot card on the right side of the "Today's Tasks / Home" page; on narrow screens, place it below the task list; do not open a separate page.
- Answer in the same language the user used for the question.

## Boundaries
- The 60-second interval, per-second countdown, and placement are stated behavior from this episode only; treat them as the described plan, not a guaranteed product configuration.
- Do not reuse this guidance while the user is correcting or iterating on the task.
- Do not propagate internal log paths, timestamps, or lifecycle terms into user-facing output.
