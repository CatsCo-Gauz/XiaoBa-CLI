---
name: "reformat-chinese-content-to-formal-html"
description: "Reformats a user's existing Chinese content into a formal, natural-sounding HTML presentation page using write_file and send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_c8d869b876c24374a9b315ce8500a4da"
x-xiaoba-transition-id: "transition-2ddae67a-055c-4cbf-890b-4fc2824198f1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1131.jsonl#turn-2:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1131.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1131.jsonl#episode-episode:2:24193ab2:settlement-2026-07-30T11:54:01.265Z"
---

# Skill: Reformat Chinese Content to Formal HTML Page

## Guidance

When a user asks in Chinese to take existing content and "整理成一个正式的更自然的" (reorganize it into a formal, more natural version), and the expected output is a polished HTML page:

1. **Understand the request**: The user has existing content and wants it rewritten into formal, natural-sounding Chinese suitable for presentation.

2. **Produce a complete, self-contained HTML document**:
   - Use `write_file` to create a single `.html` file
   - Set `<html lang="zh-CN">`
   - Include embedded `<style>` with clean, professional styling appropriate to the content
   - Remove any internal planning language, meta-commentary, or placeholder text from the output
   - Structure the page with semantic sections suitable for the content being presented

3. **Deliver the output**: Use `send_file` to share the completed HTML file.

4. **Boundaries**:
   - This skill applies only when the user explicitly asks to reorganize existing content into a **formal/natural Chinese HTML** page
   - Do not extend to arbitrary document types (PDF, Word, email, etc.)
   - Do not inherit credentials, file system access, or permissions from the original episode
   - Limit to one-off requests; do not assume iterative editing unless the user explicitly asks for changes
   - The output path is `output/` relative to the working directory
   - Evidence is limited to one content type (course introduction page); applicability to substantially different content types is not covered

## Verification

- The HTML file was successfully written and sent
- The content is entirely in Chinese (zh-CN) with formal, natural phrasing
- No internal planning or meta-commentary remains in the delivered file
- The settlement was eligible with no contradiction signal
