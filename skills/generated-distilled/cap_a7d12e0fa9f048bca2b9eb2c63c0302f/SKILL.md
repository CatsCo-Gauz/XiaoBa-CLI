---
name: "provide-compatible-video"
description: "When a user reports they cannot view or play a video, provide a compatible version of the video file via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_a7d12e0fa9f048bca2b9eb2c63c0302f"
x-xiaoba-transition-id: "transition-22d9d350-778e-4e37-8d5a-3494436e8dd5"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-11:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:11:c4314b11:settlement-2026-07-29T10:48:41.693Z"
---

# Provide Compatible Video

## Trigger
When the user reports that they cannot view or play a video file (e.g., "这视频怎么看不了" or similar phrasing indicating a playback failure).

## Action
1. Acknowledge the playback issue and explain the likely cause (e.g., encoder profile incompatibility).
2. Send a pre-existing compatible version of the video file to the user using `send_file`, specifying the file path and a clean filename.

## Boundaries
- This skill applies **only** when the user explicitly reports a video playback problem. It does not apply to general questions about video formats, downloading videos, or sharing arbitrary files.
- The compatible video file must already exist and its path must be known; this skill does **not** cover searching for, locating, transcoding, re-encoding, or creating the compatible file.
- Do not apply while the user is correcting, iterating, or providing additional context about the video issue.
