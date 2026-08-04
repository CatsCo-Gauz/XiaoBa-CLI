---
name: "read-weixin-article"
description: "When a user asks in Chinese to read (读一下) or download a WeChat public account article (微信公众号文章) via opencli weixin and summarize its content, download the article using opencli weixin download in YAML format without images, then present the downloaded content as a summary."
user-invocable: true
x-xiaoba-capability-handle: "cap_af44c9e7a23345a5bb5d1cecb199fc1b"
x-xiaoba-transition-id: "transition-c3a481a3-a813-45b9-850b-7cde6bbc539c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_914.jsonl#turn-1:workflow:execute_shell, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_914.jsonl#episode-episode:2:68a3d787:settlement-2026-07-23T05:19:45.026Z"
---

# read-weixin-article

## Description

When a user asks in Chinese to read (读一下) or download a WeChat public account article (微信公众号文章) via `opencli weixin` and summarize its content, download the article using `opencli weixin download` in YAML format without images, then present the downloaded content as a summary.

## Guidance

1. When the user provides a WeChat article URL (mp.weixin.qq.com/...) and asks to read it or summarize it using `opencli weixin`, construct a shell command to download the article.
2. Use a temporary directory (e.g., `/tmp/weixin-article`) as the output target.
3. Run: `opencli weixin download --url '<URL>' --output /tmp/weixin-article --download-images=false -f yaml`
4. After download, list the files in the output directory to confirm what was retrieved.
5. Read the downloaded YAML content and present a concise summary to the user in Chinese.

## Boundaries

- Only apply when the user explicitly references using `opencli weixin` to read a WeChat article URL (mp.weixin.qq.com domain).
- Do not apply for general web page reading, non-WeChat URLs, or non-`opencli` workflows.
- Do not attempt to download images from the article (--download-images=false).
- This skill is based on a single successful delivery and may not generalize to all WeChat article formats or opencli configurations.
