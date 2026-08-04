---
name: "list-opencli-image-commands"
description: "When a user asks about what image/art/generation commands are available in opencli, list opencli commands related to images, photos, drawing, or art generation by running a filtered opencli list command."
user-invocable: true
x-xiaoba-capability-handle: "cap_52d5f8a2507c432fb6888bd56b358438"
x-xiaoba-transition-id: "transition-f203de3b-c99d-4c2e-aac4-edf813e6b5bd"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_889.jsonl#turn-1:workflow:execute_shell, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_889.jsonl#episode-episode:4:f200774b:settlement-2026-07-22T08:24:11.918Z"
---

# List OpenCLI Image Commands

## Applicability
When a user asks about what image/art/generation commands are available in opencli, or wants to discover opencli commands related to images, photos, drawing, or art generation.

## Guidance
1. Run a filtered `opencli list` command to discover image/generation-related commands:
   ```shell
   opencli list 2>&1 | grep -i -E "image|photo|pic|draw|art|gen" | head -40
   ```
2. Present the filtered results to the user, showing which image/art command names are present in their opencli environment.

## Boundaries
- Only apply when the user is exploring or inquiring about opencli image/generation command names.
- Do not apply when the user is actively iterating on a specific image generation task or correcting a previous delivery.
- This skill lists command names only; it does not verify whether commands work, require authentication, or produce successful output.

## Risks
- Derived from a single completed delivery attempt; the grep pattern and available commands may differ across environments or opencli versions.
- The skill lists available command names from opencli help output but does not execute any image generation or verify command usability.
