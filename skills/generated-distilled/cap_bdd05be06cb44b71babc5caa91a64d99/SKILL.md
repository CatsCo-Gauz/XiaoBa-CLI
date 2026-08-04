---
name: "deliver-lightweight-pdf"
description: "When a user says a delivered file is too large because embedded images/photos are too big, deliver a pre-existing lightweight/reduced-size PDF version via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_bdd05be06cb44b71babc5caa91a64d99"
x-xiaoba-transition-id: "transition-a94c2a05-101c-4a8c-a317-77b4e880b5b1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-9:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-9:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:9:93f28e92:settlement-2026-07-22T11:02:19.173Z"
---

# deliver-lightweight-pdf

## Description
When a user indicates that a previously delivered file (e.g., a PDF report) is too large and attributes the size to embedded photos or images being too big, deliver a pre-existing lightweight/reduced-size version of the PDF via `send_file`.

## Guidance

1. **Recognize the trigger**: The user states that a file is too large and mentions or implies that embedded photos/images are causing the excessive size. The language will often refer to "照片太大了" (photos are too big) or similar phrasing about images making the file oversized and asking for adjustment.

2. **Identify the pre-existing lightweight version**: Locate the lightweight edition of the PDF that already exists at a known path. The file name typically indicates it is a lightweight edition (e.g., containing `_轻量版`).

3. **Deliver via send_file**: Use the `send_file` tool with the `file_path` set to the absolute path of the lightweight PDF and `file_name` set to the display-friendly file name (e.g., `"2026世界杯决赛_历史风霜油画图文报告_轻量版.pdf"`).

4. **Boundaries**:
   - This skill applies only when the user's complaint is specifically about file size attributed to embedded images or photos, and a lightweight version already exists at a known location.
   - Do not apply this pattern while the user is still iterating on content or design of the report — wait for a clear file-size-reduction request.
   - This skill does not cover creating the original report, generating new images, or producing the lightweight variant; it only covers delivering a pre-existing lightweight edition.
   - If the user's concern is about something other than file size (e.g., content accuracy, styling), do not invoke this pattern.
