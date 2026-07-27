---
name: "generate-stock-kline-pdf-report"
description: "When a user asks in Chinese to use sina (新浪) to check historical stock/market data, review monthly performance trends, and generate a PDF report collecting all gathered information, build and execute a Python script that reads pre-existing local kline JSON data, computes monthly statistics, generates a PDF report, and delivers it via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_d7bfc3a6793342d1811bee34a4f923f7"
x-xiaoba-transition-id: "transition-f0bc71a6-bc29-405a-9dc0-14c60730b747"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#turn-5:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#turn-5:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#episode-episode:5:9cad086b:settlement-2026-07-22T11:43:18.650Z"
---

# Skill: generate-stock-kline-pdf-report

## Guidance

When a user asks in Chinese to use "sina" (新浪) to check historical stock/market data, review monthly performance (e.g., "这个月行情怎么样"), and request a PDF report collecting all the gathered information:

1. **Locate or ensure available kline data** – Confirm the existence of a pre-populated JSON file containing daily kline data for the stock/asset (e.g., `/tmp/tsmg_kline.json`).
2. **Build a Python report generator script** – Write a Python script (e.g., `/tmp/.../build_report.py`) that reads the kline JSON data, computes monthly statistics (open, high, low, close, volume, change percentages), and generates a self-contained PDF report with formatted tables and summary.
3. **Execute the script** to produce the PDF.
4. **Deliver the PDF** to the user via `send_file`.

### Boundaries
- Only apply when the user explicitly mentions using "sina" (新浪) as the intended data source for stock/market information and requests a PDF compilation of historical data.
- The skill assumes kline data is already available at a local file path; it does not cover fetching data from external APIs.
- Do not apply for non-financial data sources, non-PDF output formats, or requests that do not involve historical market data collection.
- The skill is evidenced from a single completed delivery and may not generalize to different assets, data formats, or report styles without additional evidence.
- Do not reuse this pattern while the user is actively correcting or iterating on the delivery.
