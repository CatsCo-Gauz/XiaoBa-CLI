---
name: "deliver-comic-product-design-report"
description: "Deliver a previously prepared comic coloring book mini-program product mechanism and level design report PDF via send_file when the user requests continuation (继续)."
user-invocable: true
x-xiaoba-capability-handle: "cap_e2dfc7597a344d9fbf354a3d76f12c0f"
x-xiaoba-transition-id: "transition-92b4e4d2-a4de-489d-8357-8ecc5aaa0674"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1069.jsonl#turn-3:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1069.jsonl#episode-episode:7:85534977:settlement-2026-07-30T06:27:22.918Z"
---

## Skill: Deliver Prepared Comic Product Design Report

### Guidance

When the user issues a "continue" (继续) request in the context of a comic/漫画 coloring book mini-program (小程序) product design discussion:

1. **Confirm the report is ready** – The deliverable (a PDF product mechanism and level design report) should already be prepared and located at the expected output path.
2. **Send the file** – Use `send_file` with the correct file path and a descriptive file name matching the report content.
3. **Summarize key conclusions** – After sending, provide a brief summary of the core conclusions from the report to confirm delivery context.

### Boundaries

- This skill applies **only** when the user phrase includes "继续" (continue) in the context of a previously prepared comic/漫画 coloring book mini-program product design report.
- It does **not** cover generating, editing, or creating the report itself – only delivering an already-completed PDF.
- It does **not** apply to arbitrary file types, arbitrary contexts, or un-prepared content.
- Do **not** reuse this pattern while the user is correcting or iterating on the delivery.
- No credentials, OAuth, or external authorizations are required; the file must already exist on the local filesystem within the agent's accessible path scope.

### Evidence

- User utterance: `[发言人: ddl] 继续` (continue) – a request to proceed with delivery of the prepared report.
- Assistant action: `send_file` with path `/home/xiaoba/app/output/寻色漫画书_正式小程序产品机制与关卡设计报告.pdf` and file name `寻色漫画书_正式小程序产品机制与关卡设计报告.pdf`.
- Settlement: Episode completed without contradiction at 2026-07-30T06:27:22.918Z (eligible).
