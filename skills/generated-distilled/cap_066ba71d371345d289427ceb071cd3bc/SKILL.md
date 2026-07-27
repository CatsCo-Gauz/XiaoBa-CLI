---
name: "create-html-report"
description: "When a user asks to create, optimize, visually QA, or iteratively fix an HTML/PDF report document, produce a self-contained A4-print-ready Chinese report, render it, inspect every page visually, fix defects until convergence, and only then deliver via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_066ba71d371345d289427ceb071cd3bc"
x-xiaoba-transition-id: "transition-4b128d0a-995a-4d4e-93b7-df496805489b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-5:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-5:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-5:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:5:3d2d59a7:settlement-2026-07-22T09:40:05.733Z"
---

## Skill: create-html-report

### When to apply
Apply when a user asks you to create, optimize, visually QA, or iteratively fix an HTML/PDF report document — typically in Chinese. The report should be a self-contained page suitable for A4 PDF delivery with Chinese-friendly typography and mandatory visual convergence before delivery.

### Guidance
1. **Understand the request.** The user wants an improved/optimized report in HTML format. The report should be visually clean, print-ready (A4 layout), and use Chinese-appropriate fonts (e.g., "Noto Sans CJK SC", "Microsoft YaHei").
2. **Write the HTML file.** Use `write_file` to produce a complete, self-contained HTML document. Include:
   - `<!doctype html>` and `lang="zh-CN"`
   - Embedded CSS with `@page{size:A4;margin:0}`, a clean color scheme, and appropriate font-family stack.
   - Semantic HTML structure for the report content.
3. **Treat the first render as a draft, never as a deliverable.** Render the complete report to its final delivery format. If the delivery is PDF, rasterize every PDF page to a readable image.
4. **Perform mandatory full-document visual QA.** Actually read every rendered page image. Do not accept page count, file size, text extraction, DOM inspection, or successful rendering as substitutes for visual inspection. Check at minimum:
   - clipping, overlap, overflow, accidental extra pages, large blank areas, broken grids, and uneven page density;
   - tiny or unreadable text, bad wrapping, awkward vertical text, orphan headings, crowded cards, and inconsistent spacing;
   - missing content, garbled Chinese, weak contrast, diagram arrows or relationships that are unclear, and footer/page-number defects.
5. **Fix and re-render until convergence.** Any visible defect blocks delivery. Correct the source, render the whole document again, and visually inspect all affected pages plus adjacent pages. Repeat until no obvious defect remains. After the last edit, always run one final visual acceptance pass on the final file; an earlier preview does not count.
6. **Send only the accepted final file.** Use `send_file` only after the visual acceptance pass succeeds. Keep drafts and diagnostic images in a temporary directory and never present them as finished output.

### Non-negotiable delivery gate
- The first generated version is presumed defective until visually reviewed.
- Never deliver an uninspected report, even when generation commands succeed.
- Never claim that a report is verified based only on automated checks.
- If visual inspection is unavailable, stop and state the blocker instead of sending the report.

### Print-layout design constraints
- Design for the final PDF renderer, not for an ideal browser screenshot. Prefer renderer-safe CSS and avoid fragile overflow-dependent layouts.
- Budget content before styling: each A4 page should usually have one core message, one main visual block, and at most two supporting blocks.
- Avoid dense micro-card grids. Do not use more than four columns for text-heavy content; if six or more ideas exist, group or split them.
- Use readable type sizes: body text should normally be at least 10.5-11px in rendered PDF; captions and pills should not carry important content.
- Never hide overflow in content cards unless the hidden content is intentionally decorative. If text does not fit, simplify copy or restructure the page.
- Prefer clear hierarchy, generous spacing, and fewer boxes over decorative complexity. Obvious low-level defects such as clipped cards, cramped text, or illegible mini labels are release blockers.

### Complexity control
- If the user says the report is too complex, over-expanded, unfocused, or asks to manage one stage at a time, reduce scope before redesigning visuals.
- Prefer one closed loop per report or per section: input → collaboration/execution → delivery → memory/skill feedback → next input.
- Ground the stage in concrete product/repository evidence before adding strategy language. Use README, docs, PR notes, workflows, and current capabilities as anchors.
- Keep future stages as short context only unless the user explicitly asks to expand them. Do not give near-term, flywheel, and Palantir-level sections equal weight when the user is asking for short-term focus.

### HTML preview mode
- If the user dislikes the visual style or asks to align effects quickly, switch to HTML preview mode before producing PDF.
- In HTML preview mode, do not generate or send PDF. Produce a browser-friendly HTML file optimized for fast iteration.
- Favor editorial web design over slide/report decoration: strong typography, restrained palette, generous whitespace, fewer cards, clear hierarchy, and one obvious reading path.
- Do not overuse gradients, badges, micro-cards, chips, or dense borders. High-end should feel calm, spacious, and intentional.
- Treat the HTML as a design prototype. Ask for style direction after sending, then iterate the HTML before any PDF export.

### Diagram-first report design
- If the user says the report is too text-heavy, stop adding prose and convert the idea into diagrams.
- Prefer flowcharts, system maps, state machines, timelines, dashboards, iconography, and interactive hover/click states over long paragraphs or bullet lists.
- Use text only as labels, captions, and short reveal panels. A diagram page should usually be understandable from its shapes, arrows, grouping, and motion.
- Interactive HTML previews may use inline SVG, CSS animation, and small local JavaScript for node selection, reveal panels, or motion. Keep it self-contained.

### Optional Three.js visual layer
- Use Three.js only when a 3D relationship map, orbit, spatial hierarchy, or direct manipulation improves the user's understanding or the perceived quality of a web preview.
- Keep 3D as the visual anchor, not the information container. The core loop must remain understandable through concise 2D labels, flow, and accessible fallback content.
- Use only one focused 3D scene per page. Support click selection and, where useful, restrained drag rotation; avoid game-like controls, novelty-only motion, or excessive particle effects.
- Load Three.js from a stable CDN only for HTML preview, provide a visible fallback if WebGL or the CDN fails, and respect reduced-motion preferences.

### Motion package selection
- For strategy reports and explainers, prefer GSAP plus inline SVG when the goal is an elegant animated flow, progressive reveal, moving relationships, or icon choreography.
- Use React Flow only when users need to manipulate a real graph, inspect many nodes, or edit connections. It often feels too much like an engineering tool for a concise executive report.
- Use Rive or Lottie only when a purpose-built animation asset is available; do not add generic character animation merely to make a report move.
- Every motion package must have a static, readable state and must respect reduced-motion preferences.

### Boundaries
- This skill covers both new report creation and iterative repair of a previously delivered report when the user reports visual quality, layout, density, readability, or content-structure issues.
- If a previous report exists, load the source HTML if available; otherwise inspect the delivered PDF/page images and rebuild the smallest safe source needed to fix it.
- Only apply when the user's request clearly involves an HTML/PDF-style report document, not a plain text summary or a non-HTML format.

### Iterative repair protocol
1. Reopen the last delivered source and final output before editing.
2. Rasterize every page at readable resolution.
3. Read every page visually and write down concrete defects before changing layout.
4. Fix source-level causes, not only symptoms. Prefer simpler grids, larger type, fewer competing boxes, and more whitespace over dense decoration.
5. Re-render the full report and re-check all pages affected by the edit plus adjacent pages.
6. Continue until the report passes a final all-page visual read. Only then send the new final file.

### Evidence
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-5:user-intent`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-5:delivery:write_file`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-5:delivery:send_file`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:5:3d2d59a7:settlement-2026-07-22T09:40:05.733Z`
