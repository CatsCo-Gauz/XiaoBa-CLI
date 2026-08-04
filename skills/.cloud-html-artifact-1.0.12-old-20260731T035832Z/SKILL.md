---
name: cloud-html-artifact
description: Publish an already-built browser-runnable HTML/CSS/JavaScript directory from the current virtual employee server as a versioned public URL, verify it, and register it in the server-local artifact index. Use when another skill or agent has finished a webpage, HTML game, dashboard, visualization, or static web app and the user wants it placed online. This skill deploys existing static output; it does not design the page, perform upstream domain work, or run an application backend.
skillhub_author: "atridaisuki"
skillhub_version: "1.0.12"
skillhub_uploaded_at: "2026-07-29T05:59:32.489Z"
---

# Cloud HTML Artifact

Publish an existing static web directory from the current virtual employee server and return a real public URL.

## Boundary

Do:

1. Accept an already-built directory whose entry point is `index.html`.
2. Check the page in desktop and mobile browser viewports.
3. Discover the current server's public IPv4 address.
4. Start or reuse the node's shared static service on port `19990`.
5. Create an independent `vN`, verify it, promote `latest`, and update the server-local index.
6. Return the published title, version, and URL.

Do not:

- Design or rewrite the upstream page.
- Turn a request into a dashboard, game, report, or CRUD app.
- Add a dedicated Artifact Tool; run the bundled scripts through the existing shell capability.
- Invent a backend, database, authentication service, private API, or server-side session.
- Build arbitrary source projects. Upstream must provide browser-runnable output.
- Ask the user or deployer for an Artifact Profile, static root, public base URL, or server directory.
- Upload to the old central Artifact host as a fallback.
- Return a placeholder, `file://` address, or failed URL as a cloud result.

## Accepted Output

The input can be:

```text
dist/
  index.html
  styles.css
  app.js
  assets/
```

Built React, Vue, Svelte, Canvas, WebGL, or WASM output is accepted when it runs from a static HTTP host. Browser state such as `localStorage` and `IndexedDB` is allowed.

A required Node/Python application process, database, secret, writable server endpoint, or shared server state is outside this skill. The node does run one shared static file service, but an individual Artifact never receives its own process or port.

## Default Publish

Run:

```bash
node <skill_dir>/scripts/publish-html-directory.mjs <html-dir> \
  --id <stable-id> \
  --title <title> \
  --expect-text <stable-visible-text> \
  --out <work-dir>/publish-result.json
```

Use `--expect-text` or `--expect-selector` for one stable acceptance marker. Use a stable lowercase ID such as `fraction-practice-game`; reuse it to publish the next version.

Do not pass a profile on a managed virtual employee. The publisher automatically:

- Uses `CATSCO_ARTIFACT_PUBLIC_IP` when explicitly present; otherwise queries public-IP services.
- Uses the stable port `19990`, the first port in the reserved `19990-20000` range.
- Stores files below `$HOME/.local/share/catsco/cloud-html-artifact`.
- Verifies that the current user can write every runtime directory before starting.
- Starts or reuses one `0.0.0.0:19990` static service for the server.

The public URL shape is:

```text
http://<public-ip>:19990/artifacts/<artifact-id>/vN/
http://<public-ip>:19990/artifacts/<artifact-id>/latest/
```

Production publishing verifies the version and `latest` through their public-IP URLs. If either public URL is unreachable, the result remains `published: false`. Test mode may use the equivalent loopback URL.

Browser QA uses Playwright when available. If the runtime has no resolvable Playwright package, `qa-html-page.mjs` automatically uses the installed Chrome/Chromium/Edge through the Chrome DevTools Protocol. Do not ask the deployer to install Playwright when this fallback succeeds.

Never switch to central upload when direct hosting fails. A server restart stops the detached host; the next publish starts it again from the persistent user directory.

## Version Semantics

Each publish creates a new immutable `vN` directory. Existing version URLs remain intact. `latest` changes only after the new version passes browser QA and metadata registration.

Every full Artifact ID is independent. Do not infer a delete, replace, or ownership relationship from a shared title, ID prefix, or neighboring version number.

## Success Gate

Read `publish-result.json`; do not infer success from terminal prose.

Return a URL only when:

```text
ok == true
published == true
qa.local.ok == true
qa.version.ok == true
qa.latest.ok == true
latest_url is an HTTP(S) URL
```

If a gate fails, report its concrete error. A failed attempt must leave the previous `latest`, version directories, registry, and index unchanged.

Hard failures include:

- Public IPv4 discovery failure.
- Required directories cannot be created.
- Port `19990` is occupied by another service.
- The shared static service cannot start.
- Local HTML or resource QA failure.
- The public version or `latest` URL cannot be reached.
- Version, `latest`, registry, or index transaction failure.

Do not turn these failures into a request for a profile or central host configuration.

## Public Index

The server-local public root contains one `artifacts-index.json`. Its items contain only public metadata:

```json
{
  "id": "fraction-practice-game",
  "title": "Fraction Practice",
  "kind": "html",
  "url": "<latest_url>",
  "updated_at": "2026-07-29T10:00:00.000Z"
}
```

Do not add local paths, credentials, logs, or internal Agent state to the public index.

## Final Reply

Keep the handoff short:

```text
已发布：<title>
打开：<latest_url>
版本：vN
```

Mention a warning only when it affects use. Do not describe roots, QA files, runtime probes, or profile internals unless the user asks for debugging details.
