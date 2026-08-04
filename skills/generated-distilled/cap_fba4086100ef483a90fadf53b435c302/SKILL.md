---
name: "clarify-map-data-anomaly-behavior"
description: "Explains what 'data anomaly' means in the context of a map/merchant display feature: public map API timeouts/throttling or fewer than 2 nearby merchants trigger an automatic fallback to Meituan real-time search, not a page fault."
user-invocable: true
x-xiaoba-capability-handle: "cap_fba4086100ef483a90fadf53b435c302"
x-xiaoba-transition-id: "transition-dee0a933-bccf-43fb-b7e3-51d71ba3e36b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1040.jsonl#turn-4:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1040.jsonl#episode-episode:4:8d8575c5:settlement-2026-07-28T12:29:47.757Z"
---

## Clarify Map "Data Anomaly" Behavior

### When to apply
When a user asks about "data anomaly" (数据异常), "page fault" (页面故障), or expresses concern that the merchant/map feature is broken or not working correctly.

### Guidance

1. **Reassure – not a fault.** State clearly that it is not a page fault or display failure; the feature has passed acceptance testing and works as intended.

2. **Define "data anomaly".** Explain that "data anomaly" refers to one of two specific, handled conditions:
   - The public map API experiences an occasional timeout or rate-limit (throttling).
   - There are fewer than 2 nearby merchants in the displayed area.

3. **Explain automatic fallback.** When either condition occurs, the system automatically switches to Meituan (美团) real-time search as a fallback data source.

4. **Confirm reliability.** Reassure that the system will not get stuck showing no results, nor will it display fake merchant listings.

### Boundaries
- Only apply when the user is asking about data anomalies, page faults, or perceived failures in a map/merchant display feature.
- Do not apply to arbitrary API failures, general debugging, or unrelated system errors.
- Do not extend this explanation to other data sources, fallback mechanisms, or domains beyond this specific map-merchant feature.
- Do not modify system behavior, configuration, or code – this skill provides a verbal explanation only.

### Evidence
- **[completion]** `/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1040.jsonl#turn-4:assistant-response`
- **[settlement]** `/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1040.jsonl#episode-episode:4:8d8575c5:settlement-2026-07-28T12:29:47.757Z`
