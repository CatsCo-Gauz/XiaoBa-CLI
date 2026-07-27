---
name: "survey-opencli-image-capabilities"
description: "When asked to explore which image/art/generation-related commands opencli offers and record the findings, list opencli commands filtered for image/art terms and write the results to a Markdown notes file."
user-invocable: true
x-xiaoba-capability-handle: "cap_250f1c64c79345e39bc25e1f160b63d0"
x-xiaoba-transition-id: "transition-eca1a5a7-4fc8-49c4-b58e-5d065e6dfae2"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_889.jsonl#turn-5:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_889.jsonl#turn-1:workflow:execute_shell, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_889.jsonl#episode-episode:5:7fb525a5:settlement-2026-07-22T08:28:06.094Z"
---

# Skill: Survey OpenCLI Image Capabilities

## Guidance

When a user asks you to explore which image/art/generation-related commands `opencli` offers, and to **record** the findings (e.g., "记下来"):

1. **List opencli commands filtered for image/art terms**.
   - Run a command such as: `opencli list 2>&1 | grep -i -E "image|photo|pic|draw|art|gen" | head -40`
   - Use the grep filter that matches the image/art category the user is interested in.

2. **Write the findings to a notes file**. Save the command output (and any relevant context, such as the date or working directory) as a Markdown file.

3. **Confirm to the user** that the findings have been recorded.

## Boundaries

- This skill only applies when the user asks you to look into what `opencli` image/art-related commands are available **and** to write down / record the results.
- Do **not** claim that any command was actually tested for authentication requirements — only list what the `opencli list` output shows.
- Do **not** generalize to other opencli categories (e.g., file operations, networking) unless separately evidenced.

## Risks

- Derived from a single settled episode; the specific grep terms used may not capture all image-related commands in a different `opencli` version.
- The `opencli` command set may change over time; re-running the filtered list is advisable for fresh results.
