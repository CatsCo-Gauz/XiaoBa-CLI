---
name: "create-kraft-paper-style-html"
description: "When a user asks to improve Chinese font rendering or requests a kraft paper (牛皮纸) style HTML document, write an HTML file with proper Chinese font loading (NotoSansCJK) and kraft paper aesthetic, then deliver it via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_09c62bd681b6418cb8a2a31cbba1aebc"
x-xiaoba-transition-id: "transition-3f2099eb-af81-45a6-92c2-61c230b5ac86"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-6:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-6:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:6:9adfdb10:settlement-2026-07-22T09:56:29.287Z"
---

# Skill: create-kraft-paper-style-html

## Applicability

Apply when a user requests improving Chinese text rendering with a kraft paper (牛皮纸) visual style, or asks for an HTML document with kraft paper aesthetic and proper Chinese font support.

## Guidance

1. Write a self-contained HTML file with:
   - `<html lang="zh-CN">` declaration
   - Embedded CSS that references Chinese font assets (NotoSansCJK Regular and Bold) via `@font-face`
   - Kraft paper style visual treatment (牛皮纸风格) for backgrounds, textures, or color palette
   - Chinese content rendered with the loaded CJK font family
2. Deliver the resulting file by calling `send_file` with the file name.

## Boundaries

- Do not apply while the user is actively correcting or iterating on the same delivery.
- Limited to one completed attempt; the specific styling choices and font paths may need adjustment for different environments.
- This skill covers HTML document creation with kraft paper styling and Chinese font loading; it does not cover generic image generation or unrelated document formats.
