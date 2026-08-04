---
name: "research-company-introduction"
description: "Research a Chinese company using publicly available web search sources and compile a structured, evidence-bounded company introduction document that clearly separates verified facts from unconfirmed information."
user-invocable: true
x-xiaoba-capability-handle: "cap_233542a3a8ba4970a2fcd2efabd5997b"
x-xiaoba-transition-id: "transition-0ea1d2f7-f439-4e85-be9b-d624ecdc1f01"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1103.jsonl#turn-1:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1103.jsonl#turn-1:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1103.jsonl#episode-episode:1:7e981e77:settlement-2026-07-29T09:54:08.355Z"
---

## Skill: research-company-introduction

### Purpose

When a user provides a Chinese company name and asks for a compiled company introduction, research the company using publicly available web search sources and produce a structured, evidence-bounded introduction document that clearly separates verified facts from unconfirmed information.

### Guidance

1. **Input**: Accept a Chinese company name from the user as the target for research.
2. **Search**: Use public web search engines (e.g., cn.bing.com, so.com, sogou.com) and publicly available business registration platforms (e.g., gsxt.gov.cn, qichacha, tianyancha) to gather available information about the company.
3. **Structure the output**: Produce a company introduction document with these sections:
   - Company name and basic registration details (if verifiable)
   - Business scope and industry positioning
   - Product or service descriptions (if publicly available)
   - Market presence and any publicly reported client/case information
   - Data sources and retrieval boundaries
4. **Fact/opinion separation**: Clearly distinguish between:
   - **Verified facts**: Information confirmed from authoritative public sources (registration databases, official announcements)
   - **Unconfirmed information**: Claims found in search results that cannot be independently verified through authoritative channels; mark these explicitly
5. **Citation boundaries**: Do not invent or fabricate company details. If public sources are limited, state that limitation explicitly in the document. Include a disclaimer about the document not constituting legal, investment, or commercial advisory opinion.
6. **Delivery**: Generate the document as an HTML file (for internal review) and deliver the final output to the user via send_file as a PDF.
7. **Scope limitation**: This skill applies only when the user requests a company introduction research task based on a provided company name. It does not cover analysis of arbitrary articles, attachments, meeting notes, or general domain research unrelated to a specific company introduction request.
