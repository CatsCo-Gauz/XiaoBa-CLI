---
name: "generate-kraft-paper-pdf"
description: "When a user criticizes that an old kraft paper format (陈旧牛皮纸) was not used in a prior delivery, write a Python script using reportlab to generate a PDF with old kraft paper styling and deliver it via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_f580d2d4d49f4cc7aeba48f5d7a8c358"
x-xiaoba-transition-id: "transition-73259e07-d54c-4cbf-9f6b-3c47045f00c6"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-2:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#episode-episode:2:2b0d6706:settlement-2026-07-23T04:22:50.088Z"
---

# generate-kraft-paper-pdf

## Guidance

When a user criticizes that an old kraft paper (陈旧牛皮纸) format was not used in a delivered document, generate a PDF with old kraft paper styling by writing and executing a Python script using ReportLab, then deliver the resulting PDF via `send_file`.

### Steps

1. **Understand the user's criticism.** The user has pointed out that the previous delivery lacked an old kraft paper visual treatment. They want a PDF document that looks like aged/old kraft paper.

2. **Write a Python script** (e.g., `make_kraft_pdf.py`) that uses `reportlab` to generate a PDF with an old kraft paper aesthetic:
   - Set page size to A4.
   - Use the `UnicodeCIDFont` for proper Chinese character rendering.
   - Apply a kraft-paper background color and styling to simulate aged/old kraft paper (陈旧牛皮纸).
   - Include any relevant content the user previously requested.

3. **Execute the script** to produce the PDF output file.

4. **Deliver the PDF** via `send_file` with an appropriate filename.

### Boundaries

- Only apply when the user explicitly points out that an old kraft paper format was not used in a previous delivery (e.g., "你好像没有利用陈旧牛皮纸的格式").
- Do not use this skill for general HTML kraft-paper styling; the related skill `create-kraft-paper-style-html` handles HTML-based kraft paper output.
- This skill covers only PDF generation via a Python/ReportLab script.
- Do not reuse the pattern while the user is still iterating or correcting the delivery.

### Risks

- This guidance is derived from a single completed delivery attempt and may not generalize to all kraft paper PDF requests.
- The Python script path and content may need adjustment based on the user's specific document content and requirements.
- The `reportlab` library and `UnicodeCIDFont` must be available in the runtime environment.
