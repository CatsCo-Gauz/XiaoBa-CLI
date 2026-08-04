---
name: cloud-html-artifact
description: Publish an already-built browser-runnable HTML/CSS/JavaScript directory from the current virtual employee server as a versioned, browser-trusted HTTPS URL, verify it, and register it in the server-local artifact index. Use when another skill or agent has finished a webpage, HTML game, dashboard, visualization, or static web app and the user wants it placed online. This skill deploys existing static output; it does not design the page, perform upstream domain work, or run an application backend.
---

# Cloud HTML Artifact

Publish an existing static web directory from the current virtual employee server and return a real HTTPS URL.

## Boundary

Do:

1. Accept an already-built directory whose entry point is `index.html`.
2. Check the page in desktop and mobile browser viewports.
3. Bind the current Agent UID to its canonical hostname.
4. Ensure the server-local static host, DNS, trusted certificate, Nginx, and systemd service.
5. Create an independent `vN`, verify it through public HTTPS, promote `latest`, and update the server-local index.
6. Return the published title, version, and URL.

Do not:

- Design or rewrite the upstream page.
- Turn a request into a dashboard, game, report, or CRUD app.
- Add a dedicated Artifact Tool; run the bundled scripts through the existing shell capability.
- Invent an Artifact backend, database, authentication service, private API, or server-side session.
- Build arbitrary source projects. Upstream must provide browser-runnable output.
- Ask the user for an Artifact Profile, static root, hostname, public base URL, Nginx config, or certificate command.
- Upload to the old central Artifact host or return HTTP as a fallback.
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

A required Node/Python application process, database, secret-bearing endpoint, writable server API, or shared server state is outside this skill. The server runs one shared static file service, but an individual Artifact never receives its own process or port.

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

Do not pass a profile on a managed virtual employee. Before changing Artifact files, the publisher calls the bundled HTTPS runtime. It:

- Reads `CATSCO_BOT_UID` or `CATSCOMPANY_BOT_UID`.
- Derives `agent-<numeric-uid>.artifacts.catsco.fun`.
- Discovers the current server's public IPv4 address.
- Binds the UID and hostname in a persistent host identity file.
- Creates or updates that hostname's A record through the configured DNS API.
- Installs or reuses a DNS-01 certificate, Nginx `19991`, and a systemd-owned Node static service on `19990`.
- Stores files below `$HOME/.local/share/catsco/cloud-html-artifact`.
- Reuses valid DNS, certificate, service, and Nginx state on later publishes.

The deployment environment, not the end user, must provide:

```text
CATSCO_BOT_UID
VOLC_ACCESSKEY
VOLC_SECRETKEY
CATSCO_ARTIFACT_DNS_ZONE
root or passwordless sudo
public TCP 19990 and 19991
```

The HTTPS runtime persists only the DNS settings needed by unattended Certbot renewal in root-only `/etc/catsco/cloud-html-artifact.env`. Never print, publish, or copy its secret values into results.

The public URL shape is:

```text
https://agent-<uid>.artifacts.catsco.fun:19991/artifacts/<artifact-id>/vN/
https://agent-<uid>.artifacts.catsco.fun:19991/artifacts/<artifact-id>/latest/
```

Production publishing verifies the exact version and `latest` HTTPS URLs returned to the user. If either is unreachable or untrusted, the result remains `published: false`. Test mode may use the equivalent loopback URL.

Browser QA uses Playwright when available. If the runtime has no resolvable Playwright package, `qa-html-page.mjs` uses installed Chrome, Chromium, or Edge through the Chrome DevTools Protocol.

Never switch to central upload or HTTP when direct HTTPS hosting fails. Report the structured error from the runtime.

## Host Commands

For diagnostics or host repair, run:

```bash
node <skill_dir>/scripts/direct-https-runtime.mjs inspect
node <skill_dir>/scripts/direct-https-runtime.mjs ensure
node <skill_dir>/scripts/direct-https-runtime.mjs verify
```

`inspect` is read-only. `ensure` fills missing or expired host state and is idempotent. It probes Certbot by actually running `--version`; if the host's Python packages have broken the distro command, it repairs the distro packages first and then falls back to an isolated Snap Certbot when needed. It also rewrites legacy HTTP/IP entries in the server-local Artifact registry to this Agent's canonical HTTPS `latest` URLs without moving version directories. `verify` checks identity, DNS, certificate, Nginx, systemd, renewal hooks, local health, and public HTTPS health.

Do not use `--staging` for a user-facing publish. It exists only for ACME integration testing and does not produce a browser-trusted result.

## Version Semantics

Each publish creates a new immutable `vN` directory. Existing version URLs remain intact. `latest` changes only after the new version passes browser QA and metadata registration.

Every full Artifact ID is independent. Do not infer a delete, replace, or ownership relationship from a shared title, ID prefix, or neighboring version number.

## Success Gate

Read `publish-result.json`; do not infer success from terminal prose.

Return a URL only when:

```text
ok == true
published == true
profile.provider == "direct-https"
qa.local.ok == true
qa.version.ok == true
qa.latest.ok == true
latest_url starts with "https://"
```

If a gate fails, report its concrete error. A failed attempt must leave the previous `latest`, version directories, registry, and index unchanged.

Hard failures include:

- Agent UID or DNS credentials are unavailable.
- Host identity belongs to a different UID or hostname.
- Public IPv4 discovery or A-record propagation fails.
- Root/passwordless sudo is unavailable.
- Required directories cannot be created.
- Port `19990` or `19991` is occupied by another service.
- Certificate issuance, Nginx validation, systemd, or renewal-hook setup fails.
- Local HTML or resource QA fails.
- The public HTTPS version or `latest` URL cannot be reached.
- Version, `latest`, registry, or index transaction fails.

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

Mention a warning only when it affects use. Do not describe roots, QA files, runtime probes, or host internals unless the user asks for debugging details.

## Regression Checks

After changing HTTPS hosting:

```bash
node <skill_dir>/scripts/smoke-direct-https-runtime.mjs
node <skill_dir>/scripts/smoke-direct-https-publish.mjs \
  --out-dir <temporary-https-publish-work-dir> \
  --node-modules <node-modules>
```

After changing static serving or explicit HTTP migration compatibility:

```bash
node <skill_dir>/scripts/smoke-direct-ip-publish.mjs \
  --out-dir <temporary-direct-host-work-dir> \
  --node-modules <node-modules>
```

After changing the common publisher or management:

```bash
node <skill_dir>/scripts/smoke-publish-html-directory.mjs --out-dir <temporary-work-dir>
node <skill_dir>/scripts/smoke-agent-namespaced-publish.mjs --out-dir <temporary-agent-work-dir>
node <skill_dir>/scripts/smoke-artifact-management.mjs --out-dir <temporary-management-work-dir>
node <skill_dir>/scripts/smoke-agent-namespaced-management.mjs --out-dir <temporary-agent-management-work-dir>
```

Keep smoke output outside the skill directory. Do not include logs, generated sites, screenshots, credentials, or intermediate artifacts in the SkillHub package.
