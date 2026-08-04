---
name: "add-aapl-comparison-to-report"
description: "When a user asks in Chinese to compare with AAPL (Apple) stock and add that comparison to an existing report, write a Python comparison script that builds upon the existing report assets, executes the comparison, and delivers the updated report."
user-invocable: true
x-xiaoba-capability-handle: "cap_1e9aee4b05fe4eb5b4f7c9d2d5ced6da"
x-xiaoba-transition-id: "transition-dbd23015-89f3-46c0-b7f9-bd123d94c3e7"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#turn-6:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#turn-6:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#episode-episode:6:a5f01d9c:settlement-2026-07-22T11:49:09.328Z"
---

# Skill: Add AAPL Comparison to Report

## When to Apply
Apply when a user asks in Chinese (e.g., "那相比AAPL呢，情况如何，补充到这份报告里边") to compare something with AAPL (Apple Inc. stock) and add that comparison analysis to an existing report. The user references an existing report that has already been worked on and wants AAPL comparison data added.

## Guidance

1.  **Understand the request**: The user wants a comparative analysis between a previously discussed stock/asset and AAPL (Apple Inc.), to be appended or integrated into their existing report.

2.  **Write a comparison script**: Create a Python script (e.g., `build_comparison.py`) in the existing report output directory that:
    - Imports and runs the existing report-building script (e.g., `build_report.py`) to ensure the base context is loaded.
    - Loads available market/K-line data (e.g., from a JSON file like `tsmg_kline.json`) covering AAPL and the other asset.
    - Computes comparative metrics (e.g., price changes, volatility, statistics using `math` and `statistics`).
    - Outputs the comparison results, integrating them into the report structure.

3.  **Execute and deliver**: 
    - Run the Python script to generate the updated report.
    - Deliver the resulting file to the user via `send_file`.

## Boundaries

- Only apply when the user explicitly asks to compare with AAPL (Apple Inc.) and add that to an existing report.
- Do not apply for comparisons with other stocks or assets not involving AAPL.
- Do not apply when there is no existing report context or pre-built report assets to extend.
- Do not reuse this pattern while the user is iterating or correcting the delivery.
