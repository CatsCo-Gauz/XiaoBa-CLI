---
name: cloud-html-artifact
description: Publish an HTML/CSS/JS directory or an already-generated supported mini app to the configured cloud host, verify its public URL, and add it to the shared cloud artifact index. Use when another skill has finished a webpage, HTML game, dashboard, or small app and the user wants a cloud URL. This skill deploys existing output; it does not design the page or perform the upstream domain work.
skillhub_author: "ddl"
skillhub_version: "1.0.3"
skillhub_uploaded_at: "2026-07-22T05:19:19.635Z"
---

# Cloud HTML Artifact

Publish an existing web output and return a real cloud URL.

## Boundary

This skill does five things:

1. Accept an existing HTML directory or a mini app already supported by the bundled publisher.
2. Run the matching publish script with the configured cloud profile.
3. Verify the version URL and stable `latest` URL.
4. Update the shared `artifacts-index.json` after all publish checks pass.
5. Return the published title, type, version, and URL.

This skill does not:

- Write or redesign the upstream page.
- Turn a user request into a dashboard, game, report, or CRUD app.
- Add a dedicated Artifact Tool. Run the bundled scripts through the existing shell capability.
- Create a database, identity model, registry service, editor, permission system, or collaboration platform.
- Publish secrets, private records, credentials, or sensitive personal data to a public host.
- Return a placeholder, `file://` address, or unverified URL as a cloud result.

## Choose The Publisher

Use `publish-html-directory.mjs` when the input directory contains `index.html` and can run as ordinary HTML/CSS/JavaScript files.

Use `publish-mini-app.mjs` only when the input is already in the bundled mini-app format and the configured dynamic host supports it. Do not convert arbitrary applications into that format inside this skill.

If neither format matches, stop and explain what the upstream output must provide.

## Publish HTML

The input can be as small as:

```text
<html-dir>/
  index.html
  styles.css
  app.js
  assets/
```

Run:

```bash
node <skill_dir>/scripts/publish-html-directory.mjs <html-dir> \
  --profile <static-dir-profile.json> \
  --id <stable-id> \
  --title <title> \
  --expect-text <stable-visible-text> \
  --out <work-dir>/publish-result.json
```

`--expect-text` or `--expect-selector` should name one stable acceptance marker from the page. The publisher preserves the source directory, runs desktop and mobile browser checks, creates a new `vN` directory, verifies the public version and `latest` URLs, and then updates the shared index.

Use a stable lowercase ID such as `fraction-practice-game`. Reuse that ID when publishing a replacement so the index entry is updated instead of duplicated.

## Publish A Supported Mini App

Only use this path for an already-generated mini app that contains the required app spec, public files, seed data, and a passing local QA result.

Run:

```bash
node <skill_dir>/scripts/publish-mini-app.mjs \
  --app-dir <mini-app-dir> \
  --profile <dynamic-profile.json> \
  --out <work-dir>/publish-result.json
```

The dynamic profile must include the same `artifactIndex` used by static HTML publishing. A mini app is public in the current deployment, so reject sensitive data and authentication-dependent use cases.

## Success Gate

Read `publish-result.json`; do not infer success from command output alone.

For HTML, return a URL only when:

```text
ok == true
published == true
qa.local.ok == true
qa.version.ok == true
qa.latest.ok == true
latest_url is an HTTP(S) URL
```

For a mini app, also require passing provider, state compatibility, version remote QA, and latest remote QA gates.

If a gate fails, report the concrete error and do not claim the page was deployed. A failed attempt must leave the previous `latest` page and index entry unchanged.

## Shared Index

Both publishers update one `cloud-artifacts.index.v1` JSON file. Each item contains only:

```json
{
  "id": "fraction-practice-game",
  "title": "分数练习小游戏",
  "kind": "html",
  "url": "https://example.com/artifacts/fraction-practice-game/latest/",
  "updated_at": "2026-07-22T10:00:00.000Z"
}
```

Do not write local paths, server paths, credentials, logs, or internal Agent state into the public index.

## Final Reply

Keep the handoff short:

```text
已发布：<title>
打开：<latest_url>
版本：vN
```

Mention a warning only when it affects use. Do not describe internal profiles, server paths, test files, or intermediate JSON unless the user asks for debugging details.
