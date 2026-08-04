---
name: "build-net-comparison"
description: "When a user asks to add a NET comparison component to an existing report (e.g., '还有NET呢'), write a Python script that builds the NET comparison and deliver the result via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_86b6a0e85fc74d0d8614691945be0eef"
x-xiaoba-transition-id: "transition-414c9f4b-3a73-4eff-af05-a382fa357f96"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#turn-7:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#turn-7:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#turn-7:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_904.jsonl#episode-episode:7:c4f38b2c:settlement-2026-07-22T12:00:37.873Z"
---

## Skill: Build NET Comparison

### Applicability
When a user asks about adding or including a NET (net difference) comparison component to an existing analysis report, e.g., "还有NET呢" ("what about NET?").

### Guidance
1. Write a Python script at the report's output directory (e.g., `build_net_comparison.py`) that:
   - Imports `runpy`, `json`, `math`, and `statistics`.
   - Invokes a pre-existing `build_comparison.py` script from the same directory via `runpy.run_path` to load prior comparison data.
   - Sets an output directory variable (`OUT`) pointing to the report directory.
   - Loads existing TSMG JSON data from a file path beginning with `/tmp/tsmg_`.
   - (Further script logic is not fully observable from the available evidence — adapt the computation to the report's data format as needed.)
2. After the script is written and executed, deliver the resulting report or output file via `send_file`.

### Boundaries
- Only apply when the user explicitly requests inclusion of NET comparison in an existing report context (e.g., "还有NET呢").
- This skill is derived from a single completed delivery; the full script body was not fully captured in evidence — do not assume specific computation steps or output file names beyond what is directly observed (imports, invocation of `build_comparison.py`, output directory, TSMG data loading).
- Do not generalize to unrelated comparison types or report components.
- File paths in guidance are illustrative of the observed pattern; adapt the directory to match the actual report context.

### Risks
- Single-sample uncertainty: the observed pattern may not cover variations in report structure, file paths, or data formats.
- The evidence for the script's full logic and the exact file sent via `send_file` is truncated — guidance above only asserts what is directly observable from the available evidence.
