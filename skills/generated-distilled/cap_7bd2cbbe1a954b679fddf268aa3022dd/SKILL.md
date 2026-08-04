---
name: "compact-html-game-layout"
description: "Make an HTML educational game layout more compact when the user reports it is too empty or not compact enough, by reducing spacing, enlarging game elements, and distributing options across rows."
user-invocable: true
x-xiaoba-capability-handle: "cap_7bd2cbbe1a954b679fddf268aa3022dd"
x-xiaoba-transition-id: "transition-b438790f-39b3-4623-89fd-14224558e6c0"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-9:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-9:delivery:send_file:call-id-be7044f67be9-1, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-9:delivery:send_file:call-id-c05cac1c6219-2, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:9:60521082:settlement-2026-07-29T10:30:46.180Z"
---

## Skill Draft

### compact-html-game-layout

**Trigger**  
The user indicates that an HTML game layout is too empty, spacious, or not compact enough (e.g., "太空了可能是因为不紧凑").

**Guidance**  
1. Read the source HTML file of the game that needs compacting.  
2. Create a Python transformation script that:  
   - Modifies the game's option/spot distribution logic so that choices are spread across multiple rows (e.g., force a mix across both rows rather than clustering in one row).  
   - Adds or adjusts CSS media queries targeting compact viewports (e.g., `max-height: 700px` and `max-height: 540px`) to:  
     - Reduce vertical spacing and gap between grid rows.  
     - Enlarge game elements (holes, moles, choice buttons) relative to available space.  
     - Minimize horizontal padding and gaps.  
   - Writes the transformed HTML to a new output file.  
3. Send the compacted HTML file to the user for review.  
4. Optionally generate and send a screenshot of the compact layout for visual confirmation.

**Boundaries**  
- This skill is evidenced from one completed episode involving an HTML educational "Whack-a-Word" game. Apply only when a similar grid-based educational game HTML needs compacting.  
- The skill targets layout compacting (spacing, element sizing, row distribution), not game mechanics, content, or decorative additions.  
- Do not reuse while the user is correcting or iterating on the same task.  
- The Python transformation approach shown in evidence reads the source, performs targeted string replacements, then writes the result; adapt the specific CSS values and logic transformations to match the target game's structure.
