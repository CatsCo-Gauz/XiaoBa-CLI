#!/usr/bin/env node
import crypto, { X509Certificate } from "node:crypto";
import dns from "node:dns/promises";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  DIRECT_HOST_CONTRACT_VERSION,
  DIRECT_HOST_PORT,
  inspectDirectHost,
  resolveRuntimeAgentUid
} from "./direct-host-runtime.mjs";
import { canonicalizeManagedArtifactUrls } from "./artifact-management-lib.mjs";
import { createVolcengineDnsClient } from "./volcengine-dns.mjs";

export const DIRECT_HTTPS_CONTRACT_VERSION =
  "cloud-html-artifact.direct-https.v1";
export const DIRECT_HTTPS_IDENTITY_VERSION =
  "cloud-html-artifact.host-identity.v1";
export const DIRECT_HTTPS_SERVICE_NAME = "catsco-cloud-html-artifact";
export const DIRECT_HTTPS_PORT = 19991;
export const DEFAULT_ARTIFACT_HOST_SUFFIX = "artifacts.catsco.fun";
export const DEFAULT_ARTIFACT_DNS_ZONE = "catsco.fun";
export const DEFAULT_RUNTIME_ENV_FILE = "/etc/catsco/cloud-html-artifact.env";
export const DEFAULT_RUNTIME_DIR = "/usr/local/lib/catsco-cloud-html-artifact";
export const DEFAULT_STATE_DIR = "/var/lib/catsco-cloud-html-artifact";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const HEALTH_PATH = "/__artifact_health";
const RUNTIME_FILES = [
  "artifact-index-lib.mjs",
  "artifact-management-lib.mjs",
  "direct-host-runtime.mjs",
  "direct-https-runtime.mjs",
  "volcengine-dns.mjs",
  "dns01-certbot-hook.mjs"
];

export class DirectHttpsRuntimeError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "DirectHttpsRuntimeError";
    this.code = cleanText(options.code) || "direct_https_runtime_failed";
    this.step = cleanText(options.step);
  }
}

export async function resolveDirectHttpsContract(options = {}) {
  const env = options.env || process.env;
  const agentUid = resolveRuntimeAgentUid(env);
  if (!agentUid) {
    throw new DirectHttpsRuntimeError(
      "CATSCO_BOT_UID or CATSCOMPANY_BOT_UID is required for direct HTTPS hosting",
      { code: "agent_uid_unavailable", step: "identity" }
    );
  }
  const suffix = validateHostname(
    cleanText(env.CATSCO_ARTIFACT_HOST_SUFFIX)
      || DEFAULT_ARTIFACT_HOST_SUFFIX,
    "Artifact host suffix"
  );
  const hostname = `agent-${agentUid}.${suffix}`;
  const configuredHost = cleanText(env.CATSCO_ARTIFACT_HOST);
  const legacyHosts = unique([
    ...splitList(env.CATSCO_ARTIFACT_LEGACY_HOSTS),
    configuredHost && configuredHost !== hostname ? configuredHost : ""
  ]).map(value => validateHostname(value, "legacy Artifact hostname"))
    .filter(value => value !== hostname);
  const dnsZone = validateHostname(
    cleanText(env.CATSCO_ARTIFACT_DNS_ZONE)
      || DEFAULT_ARTIFACT_DNS_ZONE,
    "Artifact DNS zone"
  );
  for (const host of [hostname, ...legacyHosts]) {
    if (host !== dnsZone && !host.endsWith(`.${dnsZone}`)) {
      throw new DirectHttpsRuntimeError(
        `Artifact hostname ${host} is outside DNS zone ${dnsZone}`,
        { code: "artifact_hostname_outside_zone", step: "identity" }
      );
    }
  }

  const directHost = options.directHost || await inspectDirectHost({
    env,
    allowUnsupportedPlatform: options.allowUnsupportedPlatform,
    publicIpEndpoints: options.publicIpEndpoints,
    fetchImpl: options.fetchImpl
  });
  const httpsPort = portNumber(
    options.httpsPort || env.CATSCO_ARTIFACT_HTTPS_PORT,
    DIRECT_HTTPS_PORT,
    "Artifact HTTPS port"
  );
  const runtimeDir = absolutePath(
    options.runtimeDir
      || env.CATSCO_ARTIFACT_RUNTIME_DIR
      || DEFAULT_RUNTIME_DIR,
    "Artifact runtime directory"
  );
  const stateDir = absolutePath(
    options.stateDir
      || env.CATSCO_ARTIFACT_STATE_DIR
      || DEFAULT_STATE_DIR,
    "Artifact state directory"
  );
  const envFile = absolutePath(
    options.envFile
      || env.CATSCO_ARTIFACT_ENV_FILE
      || DEFAULT_RUNTIME_ENV_FILE,
    "Artifact environment file"
  );
  const certificateName = hostname;
  const certificateDir = path.posix.join(
    cleanText(options.letsencryptLiveDir) || "/etc/letsencrypt/live",
    certificateName
  );
  const paths = {
    runtime_dir: runtimeDir,
    state_dir: stateDir,
    identity_file: path.posix.join(stateDir, "host-identity.json"),
    dns_state_dir: path.posix.join(stateDir, "dns01-state"),
    environment_file: envFile,
    nginx_config: cleanText(options.nginxConfig)
      || "/etc/nginx/conf.d/catsco-cloud-html-artifact-https.conf",
    systemd_unit: cleanText(options.systemdUnit)
      || "/etc/systemd/system/catsco-cloud-html-artifact.service",
    auth_hook: path.posix.join(runtimeDir, "certbot-dns-auth-hook"),
    cleanup_hook: path.posix.join(runtimeDir, "certbot-dns-cleanup-hook"),
    deploy_hook: cleanText(options.deployHook)
      || "/etc/letsencrypt/renewal-hooks/deploy/catsco-cloud-html-artifact-nginx",
    fullchain: path.posix.join(certificateDir, "fullchain.pem"),
    private_key: path.posix.join(certificateDir, "privkey.pem")
  };
  const publicOrigin = `https://${hostname}:${httpsPort}`;
  return {
    ok: true,
    contract_version: DIRECT_HTTPS_CONTRACT_VERSION,
    provider: "direct-https",
    agent_uid: agentUid,
    hostname,
    host_suffix: suffix,
    legacy_hostnames: legacyHosts,
    certificate_hostnames: [hostname, ...legacyHosts],
    dns_zone: dnsZone,
    public_ip: directHost.public_ip,
    https_port: httpsPort,
    static_port: directHost.port,
    static_root: directHost.static_root,
    artifact_management_root: directHost.artifact_management_root,
    artifact_trash_root: directHost.artifact_trash_root,
    public_origin: publicOrigin,
    public_base_url: `${publicOrigin}/artifacts`,
    public_health_url: `${publicOrigin}${HEALTH_PATH}`,
    local_qa_base_url: directHost.local_qa_base_url,
    local_health_url: directHost.health_url,
    certificate_name: certificateName,
    service_name: DIRECT_HTTPS_SERVICE_NAME,
    direct_host_contract_version: DIRECT_HOST_CONTRACT_VERSION,
    runtime_user: cleanText(options.runtimeUser)
      || cleanText(env.USER)
      || cleanText(os.userInfo().username)
      || "root",
    runtime_group: cleanText(options.runtimeGroup)
      || cleanText(env.CATSCO_ARTIFACT_RUNTIME_GROUP),
    node_path: absolutePath(options.nodePath || process.execPath, "Node executable"),
    paths
  };
}

export async function inspectDirectHttpsHost(options = {}) {
  const runner = options.runner || createCommandRunner(options);
  const env = await loadRuntimeEnvironment({ ...options, runner });
  const contract = await resolveDirectHttpsContract({ ...options, env });
  const identity = readJsonPrivileged(contract.paths.identity_file, runner);
  const identityStatus = inspectHostIdentity(contract, identity);
  const credentialsAvailable = Boolean(
    cleanText(env.VOLC_ACCESSKEY) && cleanText(env.VOLC_SECRETKEY)
  );
  const service = inspectSystemdService(contract, runner);
  const ports = {
    static: await probeUrl(contract.local_health_url, {
      fetchImpl: options.fetchImpl,
      timeoutMs: 2_000
    }),
    https: await probeUrl(contract.public_health_url, {
      fetchImpl: options.fetchImpl,
      timeoutMs: 5_000
    })
  };
  const certificate = inspectCertificate(contract, runner);
  const nginx = inspectNginx(contract, runner);
  let dnsState = {
    ok: false,
    status: credentialsAvailable ? "unchecked" : "credentials-unavailable",
    addresses: []
  };
  if (credentialsAvailable && options.skipDnsApi !== true) {
    try {
      const client = options.dnsClient || createVolcengineDnsClient({
        env,
        fetchImpl: options.fetchImpl,
        now: options.now
      });
      const zone = await client.findZone(contract.dns_zone);
      const host = relativeRecordHost(contract.hostname, contract.dns_zone);
      const records = await client.listRecords(zone.ZID, { host, type: "A" });
      dnsState = {
        ok: records.length === 1
          && cleanText(records[0]?.Value) === contract.public_ip,
        status: records.length ? "present" : "absent",
        addresses: records.map(record => cleanText(record?.Value)).filter(Boolean)
      };
    } catch (error) {
      dnsState = {
        ok: false,
        status: "error",
        addresses: [],
        error: messageOf(error)
      };
    }
  }
  return {
    ok: identityStatus.ok
      && service.active
      && ports.static.ok
      && certificate.valid
      && nginx.valid
      && dnsState.ok
      && ports.https.ok,
    contract_version: DIRECT_HTTPS_CONTRACT_VERSION,
    action: "inspect",
    runtime: contract,
    identity: identityStatus,
    dns: {
      credentials_available: credentialsAvailable,
      ...dnsState
    },
    certificate,
    nginx,
    service,
    health: ports
  };
}

export async function ensureDirectHttpsHost(options = {}) {
  assertSupportedHost(options);
  const runner = options.runner || createCommandRunner(options);
  const env = await loadRuntimeEnvironment({ ...options, runner });
  const contract = await resolveDirectHttpsContract({ ...options, env });
  assertPrivilegeAvailable(runner);
  const steps = [];

  const existingIdentity = readJsonPrivileged(contract.paths.identity_file, runner);
  const identityStatus = inspectHostIdentity(contract, existingIdentity);
  if (!identityStatus.ok && identityStatus.status !== "absent") {
    throw new DirectHttpsRuntimeError(identityStatus.error, {
      code: "host_identity_conflict",
      step: "identity"
    });
  }

  ensureRequiredDnsEnvironment(env);
  const runtimeGroup = contract.runtime_group || resolvePrimaryGroup(runner);
  contract.runtime_group = runtimeGroup;

  const packages = ensureHostPackages(runner);
  steps.push({ step: "packages", ...packages });

  const installed = installStableRuntime({ contract, env, runner });
  steps.push({ step: "runtime", ...installed });

  const identity = existingIdentity || createHostIdentity(contract);
  installTextFile({
    runner,
    target: contract.paths.identity_file,
    content: `${JSON.stringify(identity, null, 2)}\n`,
    mode: "0600"
  });
  steps.push({
    step: "identity",
    changed: !existingIdentity,
    status: existingIdentity ? "reused" : "created"
  });

  const staticService = await ensureStaticService({
    contract,
    runner,
    fetchImpl: options.fetchImpl,
    runtimeChanged: installed.changed
  });
  steps.push({ step: "static-service", ...staticService });

  const metadata = canonicalizeManagedArtifactUrls({
    staticRoot: contract.static_root,
    indexPath: path.join(contract.static_root, "artifacts-index.json"),
    registryPath: path.join(contract.artifact_management_root, "registry.json"),
    trashRoot: contract.artifact_trash_root,
    publicBaseUrl: contract.public_base_url
  });
  steps.push({ step: "artifact-metadata", ...metadata });

  const dnsClient = options.dnsClient || createVolcengineDnsClient({
    env,
    fetchImpl: options.fetchImpl,
    now: options.now
  });
  const dnsResults = [];
  for (const hostname of contract.certificate_hostnames) {
    dnsResults.push(await dnsClient.ensureARecord({
      zoneName: contract.dns_zone,
      fqdn: hostname,
      value: contract.public_ip,
      ttl: positiveInteger(env.CATSCO_ARTIFACT_DNS_TTL, 600, "DNS TTL")
    }));
  }
  steps.push({
    step: "dns",
    changed: dnsResults.some(result => result.action !== "reused"),
    records: dnsResults
  });

  await waitForPublicA(contract.hostname, contract.public_ip, {
    resolver: options.resolve4,
    sleep: options.sleep,
    nowMs: options.nowMs,
    minimumMatches: 2,
    timeoutMs: positiveInteger(
      env.CATSCO_ARTIFACT_A_TIMEOUT_MS,
      300_000,
      "A record propagation timeout"
    ),
    pollMs: positiveInteger(
      env.CATSCO_ARTIFACT_A_POLL_MS,
      5_000,
      "A record propagation poll interval"
    )
  });

  const staging = options.staging === true
    || env.CATSCO_ARTIFACT_ACME_STAGING === "1";
  let certificate = inspectCertificate(contract, runner);
  const reusable = certificateSatisfiesContract(certificate, contract, {
    staging,
    minimumDays: positiveInteger(
      env.CATSCO_ARTIFACT_CERT_MIN_DAYS,
      30,
      "minimum certificate lifetime"
    )
  });
  if (!reusable || options.forceCertificate === true) {
    issueCertificate({
      contract,
      env,
      runner,
      certbotCommand: packages.certbot_command,
      staging,
      certificate,
      force: options.forceCertificate === true
    });
    certificate = inspectCertificate(contract, runner);
    if (!certificateSatisfiesContract(certificate, contract, {
      staging,
      minimumDays: 1
    })) {
      throw new DirectHttpsRuntimeError(
        "Certbot completed but the installed certificate does not satisfy the Artifact hostname contract",
        { code: "certificate_contract_mismatch", step: "certificate" }
      );
    }
  }
  steps.push({
    step: "certificate",
    changed: !reusable || options.forceCertificate === true,
    staging,
    expires_at: certificate.expires_at,
    sans: certificate.sans
  });

  const nginx = installNginxConfiguration({ contract, runner });
  steps.push({ step: "nginx", ...nginx });

  const verification = await verifyDirectHttpsHost({
    ...options,
    env,
    contract,
    runner,
    allowStaging: staging
  });
  if (!verification.ok) {
    throw new DirectHttpsRuntimeError(
      `direct HTTPS verification failed: ${verification.errors.join("; ")}`,
      { code: "direct_https_verification_failed", step: "verify" }
    );
  }
  return {
    ok: true,
    contract_version: DIRECT_HTTPS_CONTRACT_VERSION,
    action: "ensure",
    runtime: contract,
    steps,
    verification
  };
}

export async function verifyDirectHttpsHost(options = {}) {
  const runner = options.runner || createCommandRunner(options);
  const env = options.env || await loadRuntimeEnvironment({ ...options, runner });
  const contract = options.contract || await resolveDirectHttpsContract({ ...options, env });
  const verificationTimeoutMs = positiveInteger(
    options.verificationTimeoutMs || env.CATSCO_ARTIFACT_VERIFY_TIMEOUT_MS,
    60_000,
    "verification timeout"
  );
  const verificationPollMs = positiveInteger(
    options.verificationPollMs || env.CATSCO_ARTIFACT_VERIFY_POLL_MS,
    2_000,
    "verification poll interval"
  );
  const errors = [];
  const identity = inspectHostIdentity(
    contract,
    readJsonPrivileged(contract.paths.identity_file, runner)
  );
  if (!identity.ok) errors.push(identity.error || "host identity is unavailable");

  const local = await probeUrl(contract.local_health_url, {
    fetchImpl: options.fetchImpl,
    timeoutMs: 3_000
  });
  if (!local.ok) errors.push(`local static host is unhealthy: ${local.error || local.status}`);

  let addresses = [];
  try {
    addresses = await waitForPublicA(contract.hostname, contract.public_ip, {
      resolver: options.resolve4,
      sleep: options.sleep,
      nowMs: options.nowMs,
      minimumMatches: 2,
      timeoutMs: verificationTimeoutMs,
      pollMs: verificationPollMs
    });
  } catch (error) {
    errors.push(`DNS lookup failed: ${messageOf(error)}`);
  }

  const certificate = inspectCertificate(contract, runner);
  if (!certificateSatisfiesContract(certificate, contract, {
    staging: options.allowStaging === true,
    minimumDays: 1
  })) {
    errors.push("certificate SAN, validity, or ACME environment does not match");
  }

  const nginx = inspectNginx(contract, runner);
  if (!nginx.valid) errors.push(nginx.error || "Nginx configuration is invalid");

  const service = inspectSystemdService(contract, runner);
  if (!service.active || !service.enabled) {
    errors.push("Artifact static host systemd service is not active and enabled");
  }

  let publicHealth;
  if (options.allowStaging === true) {
    publicHealth = await probeUrl(contract.public_health_url, {
      fetchImpl: options.fetchImpl,
      timeoutMs: 10_000
    });
  } else {
    try {
      publicHealth = await waitForHealthyUrl(contract.public_health_url, {
        fetchImpl: options.fetchImpl,
        sleep: options.sleep,
        nowMs: options.nowMs,
        timeoutMs: verificationTimeoutMs,
        pollMs: verificationPollMs,
        probeTimeoutMs: 10_000
      });
    } catch {
      publicHealth = await probeUrl(contract.public_health_url, {
        fetchImpl: options.fetchImpl,
        timeoutMs: 10_000
      });
    }
  }
  if (!publicHealth.ok && options.allowStaging !== true) {
    errors.push(
      `public HTTPS health check failed: ${publicHealth.error || publicHealth.status}`
    );
  }
  if (publicHealth.headers) {
    const xFrameOptions = cleanText(publicHealth.headers["x-frame-options"]);
    const csp = cleanText(publicHealth.headers["content-security-policy"]);
    if (xFrameOptions) errors.push("public host sends X-Frame-Options");
    if (/\bframe-ancestors\s+'none'/i.test(csp)) {
      errors.push("public host CSP forbids iframe embedding");
    }
  }

  const renewal = inspectRenewalHooks(contract, runner);
  if (!renewal.valid) errors.push(renewal.error);

  return {
    ok: errors.length === 0,
    contract_version: DIRECT_HTTPS_CONTRACT_VERSION,
    action: "verify",
    runtime: contract,
    identity,
    dns: { addresses, expected: contract.public_ip },
    certificate,
    nginx,
    service,
    renewal,
    health: { local, public: publicHealth },
    errors
  };
}

export function createHostIdentity(contract, now = new Date()) {
  return {
    contract_version: DIRECT_HTTPS_IDENTITY_VERSION,
    agent_uid: contract.agent_uid,
    hostname: contract.hostname,
    dns_zone: contract.dns_zone,
    bound_at: now.toISOString()
  };
}

export function inspectHostIdentity(contract, identity) {
  if (!identity) {
    return {
      ok: false,
      status: "absent",
      error: "Artifact host identity has not been created"
    };
  }
  const expected = createHostIdentity(contract, new Date(0));
  const mismatches = [];
  for (const field of ["contract_version", "agent_uid", "hostname", "dns_zone"]) {
    if (cleanText(String(identity[field] || "")) !== cleanText(String(expected[field] || ""))) {
      mismatches.push(field);
    }
  }
  return mismatches.length
    ? {
        ok: false,
        status: "conflict",
        mismatches,
        error: `Artifact host identity conflicts on: ${mismatches.join(", ")}`
      }
    : {
        ok: true,
        status: "bound",
        agent_uid: identity.agent_uid,
        hostname: identity.hostname,
        bound_at: cleanText(identity.bound_at)
      };
}

export function renderNginxConfig(contract) {
  const names = contract.certificate_hostnames.map(validateHostname);
  return [
    "server {",
    `    listen ${contract.https_port} ssl;`,
    `    listen [::]:${contract.https_port} ssl;`,
    `    server_name ${names.join(" ")};`,
    "",
    `    ssl_certificate ${nginxPath(contract.paths.fullchain)};`,
    `    ssl_certificate_key ${nginxPath(contract.paths.private_key)};`,
    "    ssl_protocols TLSv1.2 TLSv1.3;",
    "",
    "    location / {",
    `        proxy_pass http://127.0.0.1:${contract.static_port};`,
    "        proxy_http_version 1.1;",
    "        proxy_set_header Host $host;",
    "        proxy_set_header X-Forwarded-Host $host;",
    "        proxy_set_header X-Forwarded-Proto https;",
    "    }",
    "}",
    ""
  ].join("\n");
}

export function renderSystemdUnit(contract) {
  const user = systemdName(contract.runtime_user, "runtime user");
  const group = systemdName(contract.runtime_group, "runtime group");
  const runtimeScript = path.posix.join(contract.paths.runtime_dir, "direct-host-runtime.mjs");
  const workingDirectory = path.posix.dirname(contract.static_root);
  return [
    "[Unit]",
    "Description=CatsCo Cloud HTML Artifact static host",
    "After=network-online.target",
    "Wants=network-online.target",
    "",
    "[Service]",
    "Type=simple",
    `User=${user}`,
    `Group=${group}`,
    `ExecStart=${systemdQuote(contract.node_path)} ${systemdQuote(runtimeScript)} serve --root ${systemdQuote(contract.static_root)} --port ${contract.static_port}`,
    "Restart=always",
    "RestartSec=3",
    `WorkingDirectory=${systemdSettingPath(workingDirectory, "working directory")}`,
    "",
    "[Install]",
    "WantedBy=multi-user.target",
    ""
  ].join("\n");
}

export function renderCertbotHookWrapper(contract, action) {
  if (!["auth", "cleanup"].includes(action)) throw new Error("invalid Certbot hook action");
  const hook = path.posix.join(contract.paths.runtime_dir, "dns01-certbot-hook.mjs");
  return [
    "#!/bin/sh",
    "set -eu",
    `if [ -r ${shellQuote(contract.paths.environment_file)} ]; then`,
    "  set -a",
    `  . ${shellQuote(contract.paths.environment_file)}`,
    "  set +a",
    "fi",
    `export CATSCO_ARTIFACT_DNS_STATE_DIR=${shellQuote(contract.paths.dns_state_dir)}`,
    `exec ${shellQuote(contract.node_path)} ${shellQuote(hook)} ${action}`,
    ""
  ].join("\n");
}

export function renderDeployHook() {
  return [
    "#!/bin/sh",
    "set -eu",
    "nginx -t",
    "systemctl reload nginx",
    ""
  ].join("\n");
}

export function renderRuntimeEnvironment(env, contract) {
  const values = {
    VOLC_ACCESSKEY: requiredSecret(env.VOLC_ACCESSKEY, "VOLC_ACCESSKEY"),
    VOLC_SECRETKEY: requiredSecret(env.VOLC_SECRETKEY, "VOLC_SECRETKEY"),
    CATSCO_ARTIFACT_DNS_ZONE: contract.dns_zone,
    CATSCO_ARTIFACT_HOST_SUFFIX: contract.host_suffix,
    CATSCO_ARTIFACT_HTTPS_PORT: String(contract.https_port)
  };
  if (contract.legacy_hostnames.length) {
    values.CATSCO_ARTIFACT_LEGACY_HOSTS = contract.legacy_hostnames.join(",");
  }
  for (const name of [
    "CATSCO_ARTIFACT_DNS_TTL",
    "CATSCO_ARTIFACT_DNS_TIMEOUT_MS",
    "CATSCO_ARTIFACT_DNS_POLL_MS"
  ]) {
    if (cleanText(env[name])) values[name] = cleanText(env[name]);
  }
  return Object.entries(values)
    .map(([name, value]) => `${name}=${shellQuote(value)}`)
    .join("\n") + "\n";
}

export async function waitForPublicA(hostname, expectedIp, options = {}) {
  const resolver = options.resolver || dns.resolve4;
  const sleep = options.sleep || delay;
  const nowMs = options.nowMs || Date.now;
  const timeoutMs = positiveInteger(options.timeoutMs, 300_000, "A record timeout");
  const pollMs = positiveInteger(options.pollMs, 5_000, "A record poll interval");
  const minimumMatches = positiveInteger(
    options.minimumMatches,
    1,
    "A record minimum matches"
  );
  const deadline = nowMs() + timeoutMs;
  let lastAddresses = [];
  let consecutiveMatches = 0;
  while (nowMs() < deadline) {
    try {
      lastAddresses = await resolver(hostname);
      if (lastAddresses.includes(expectedIp)) {
        consecutiveMatches += 1;
        if (consecutiveMatches >= minimumMatches) return lastAddresses;
      } else {
        consecutiveMatches = 0;
      }
    } catch (error) {
      consecutiveMatches = 0;
      if (!["ENODATA", "ENOTFOUND", "ESERVFAIL", "ETIMEOUT"].includes(error?.code)) {
        throw error;
      }
    }
    await sleep(pollMs);
  }
  throw new DirectHttpsRuntimeError(
    `A record propagation timed out for ${hostname}; expected ${expectedIp}, observed ${lastAddresses.join(",") || "none"}`,
    { code: "dns_a_propagation_timeout", step: "dns" }
  );
}

export function createCommandRunner(options = {}) {
  const env = options.env || process.env;
  const isRoot = options.isRoot !== undefined
    ? options.isRoot
    : typeof process.getuid === "function" && process.getuid() === 0;
  return {
    isRoot,
    run(command, args = [], runOptions = {}) {
      const privileged = runOptions.privileged === true;
      const executable = privileged && !isRoot ? "sudo" : command;
      const finalArgs = privileged && !isRoot
        ? ["-n", command, ...args]
        : args;
      const completed = spawnSync(executable, finalArgs, {
        encoding: "utf8",
        cwd: runOptions.cwd || process.cwd(),
        env: { ...env, ...(runOptions.env || {}) },
        input: runOptions.input,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: runOptions.timeoutMs || 120_000,
        windowsHide: true
      });
      const result = {
        ok: !completed.error && completed.status === 0,
        status: completed.status,
        stdout: String(completed.stdout || ""),
        stderr: String(completed.stderr || ""),
        error: completed.error?.message || ""
      };
      if (!result.ok && runOptions.allowFailure !== true) {
        throw new DirectHttpsRuntimeError(
          `${command} failed: ${cleanText(result.error || result.stderr) || `exit ${result.status}`}`,
          {
            code: cleanText(runOptions.errorCode) || "host_command_failed",
            step: cleanText(runOptions.step)
          }
        );
      }
      return result;
    }
  };
}

async function loadRuntimeEnvironment(options) {
  const inherited = options.env || process.env;
  const runner = options.runner || createCommandRunner({ env: inherited });
  const envFile = cleanText(options.envFile)
    || cleanText(inherited.CATSCO_ARTIFACT_ENV_FILE)
    || DEFAULT_RUNTIME_ENV_FILE;
  let fileValues = {};
  if (fs.existsSync(envFile)) {
    try {
      fileValues = parseEnvironmentFile(fs.readFileSync(envFile, "utf8"));
    } catch {
      const read = runner.run("cat", [envFile], {
        privileged: true,
        allowFailure: true
      });
      if (read.ok) fileValues = parseEnvironmentFile(read.stdout);
    }
  } else {
    const read = runner.run("cat", [envFile], {
      privileged: true,
      allowFailure: true
    });
    if (read.ok) fileValues = parseEnvironmentFile(read.stdout);
  }
  return { ...fileValues, ...inherited };
}

function parseEnvironmentFile(text) {
  const result = {};
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith("'") && value.endsWith("'"))
      || (value.startsWith("\"") && value.endsWith("\""))
    ) {
      value = value.slice(1, -1);
    }
    result[match[1]] = value.replace(/'\\''/g, "'");
  }
  return result;
}

function assertSupportedHost(options) {
  if (
    process.platform !== "linux"
    && options.allowUnsupportedPlatform !== true
    && process.env.NODE_ENV !== "test"
  ) {
    throw new DirectHttpsRuntimeError(
      `direct HTTPS hosting requires Linux; current platform is ${process.platform}`,
      { code: "unsupported_host_platform", step: "platform" }
    );
  }
}

export function assertPrivilegeAvailable(runner) {
  if (runner.isRoot) return;
  const result = runner.run("true", [], {
    privileged: true,
    allowFailure: true
  });
  if (!result.ok) {
    throw new DirectHttpsRuntimeError(
      "direct HTTPS hosting requires root or passwordless sudo",
      { code: "host_privilege_unavailable", step: "privilege" }
    );
  }
}

function ensureRequiredDnsEnvironment(env) {
  const missing = ["VOLC_ACCESSKEY", "VOLC_SECRETKEY"]
    .filter(name => !cleanText(env[name]));
  if (missing.length) {
    throw new DirectHttpsRuntimeError(
      `DNS credentials are unavailable (${missing.join(", ")})`,
      { code: "dns_credentials_unavailable", step: "dns" }
    );
  }
}

export function ensureHostPackages(runner) {
  if (!commandAvailable(runner, "systemctl")) {
    throw new DirectHttpsRuntimeError(
      "systemd is required for direct HTTPS hosting",
      { code: "systemd_unavailable", step: "packages" }
    );
  }

  const installed = [];
  const repairs = [];
  let changed = false;
  const nginxAvailable = commandAvailable(runner, "nginx");
  let certbot = probeCertbotRuntime(runner);

  if (!nginxAvailable) {
    requireApt(runner);
    aptUpdate(runner, { allowFailure: false });
    runner.run("apt-get", ["install", "-y", "nginx"], {
      privileged: true,
      env: { DEBIAN_FRONTEND: "noninteractive" },
      timeoutMs: 600_000,
      errorCode: "package_install_failed",
      step: "packages"
    });
    installed.push("nginx");
    changed = true;
  }

  if (!certbot.ok) {
    const aptRepair = repairCertbotWithApt(runner);
    repairs.push(aptRepair);
    if (aptRepair.changed) {
      changed = true;
      installed.push(...aptRepair.installed);
    }
    certbot = probeCertbotRuntime(runner);
  }

  if (!certbot.ok) {
    const snapRepair = repairCertbotWithSnap(runner);
    repairs.push(snapRepair);
    if (snapRepair.changed) {
      changed = true;
      installed.push(...snapRepair.installed);
    }
    certbot = probeCertbotRuntime(runner);
  }

  if (!certbot.ok) {
    throw new DirectHttpsRuntimeError(
      "Certbot is unavailable or unhealthy, and automatic APT/Snap repair did not produce a working runtime",
      { code: "certbot_runtime_unavailable", step: "packages" }
    );
  }

  return {
    changed,
    installed: unique(installed),
    certbot_command: certbot.command,
    certbot_version: certbot.version,
    repair_method: repairs.findLast(result => result.ok)?.method || "existing"
  };
}

export function probeCertbotRuntime(runner) {
  for (const command of [
    "/usr/local/bin/certbot",
    "/snap/bin/certbot",
    "certbot"
  ]) {
    const result = runner.run(command, ["--version"], {
      allowFailure: true,
      timeoutMs: 30_000
    });
    if (!result.ok) continue;
    const version = cleanText(`${result.stdout}\n${result.stderr}`)
      .split(/\r?\n/, 1)[0];
    return {
      ok: true,
      command,
      version: version || "certbot"
    };
  }
  return {
    ok: false,
    command: "",
    version: ""
  };
}

function repairCertbotWithApt(runner) {
  if (!commandAvailable(runner, "apt-get")) {
    return {
      ok: false,
      changed: false,
      installed: [],
      method: "apt-unavailable"
    };
  }
  const existed = commandAvailable(runner, "certbot");
  const update = aptUpdate(runner, { allowFailure: true });
  if (!update.ok) {
    return {
      ok: false,
      changed: false,
      installed: [],
      method: "apt-update-failed"
    };
  }
  const packages = existed
    ? ["certbot", "python3-certbot", "python3-openssl", "python3-cryptography"]
    : ["certbot"];
  const args = existed
    ? ["install", "-y", "--reinstall", ...packages]
    : ["install", "-y", ...packages];
  const install = runner.run("apt-get", args, {
    privileged: true,
    env: { DEBIAN_FRONTEND: "noninteractive" },
    allowFailure: true,
    timeoutMs: 600_000
  });
  return {
    ok: install.ok,
    changed: install.ok,
    installed: install.ok ? packages : [],
    method: existed ? "apt-repair" : "apt-install"
  };
}

function repairCertbotWithSnap(runner) {
  const installed = [];
  let changed = false;
  if (!commandAvailable(runner, "snap")) {
    if (!commandAvailable(runner, "apt-get")) {
      return {
        ok: false,
        changed: false,
        installed,
        method: "snap-unavailable"
      };
    }
    const update = aptUpdate(runner, { allowFailure: true });
    if (!update.ok) {
      return {
        ok: false,
        changed: false,
        installed,
        method: "snap-bootstrap-failed"
      };
    }
    const snapd = runner.run("apt-get", ["install", "-y", "snapd"], {
      privileged: true,
      env: { DEBIAN_FRONTEND: "noninteractive" },
      allowFailure: true,
      timeoutMs: 600_000
    });
    if (!snapd.ok) {
      return {
        ok: false,
        changed: false,
        installed,
        method: "snap-bootstrap-failed"
      };
    }
    installed.push("snapd");
    changed = true;
  }

  runner.run("systemctl", ["enable", "--now", "snapd.socket"], {
    privileged: true,
    allowFailure: true,
    timeoutMs: 120_000
  });
  runner.run("snap", ["wait", "system", "seed.loaded"], {
    privileged: true,
    allowFailure: true,
    timeoutMs: 180_000
  });

  let snapCertbot = probeCertbotCommand(runner, "/snap/bin/certbot");
  if (!snapCertbot.ok) {
    const listed = runner.run("snap", ["list", "certbot"], {
      privileged: true,
      allowFailure: true,
      timeoutMs: 60_000
    });
    const install = runner.run(
      "snap",
      listed.ok
        ? ["refresh", "certbot"]
        : ["install", "--classic", "certbot"],
      {
        privileged: true,
        allowFailure: true,
        timeoutMs: 600_000
      }
    );
    if (!install.ok) {
      return {
        ok: false,
        changed,
        installed,
        method: "snap-install-failed"
      };
    }
    installed.push("certbot-snap");
    changed = true;
    snapCertbot = probeCertbotCommand(runner, "/snap/bin/certbot");
  }
  if (!snapCertbot.ok) {
    return {
      ok: false,
      changed,
      installed,
      method: "snap-certbot-unhealthy"
    };
  }

  runner.run("ln", [
    "-sfn",
    "/snap/bin/certbot",
    "/usr/local/bin/certbot"
  ], {
    privileged: true,
    allowFailure: true,
    timeoutMs: 30_000
  });
  return {
    ok: true,
    changed,
    installed,
    method: "snap"
  };
}

function probeCertbotCommand(runner, command) {
  const result = runner.run(command, ["--version"], {
    allowFailure: true,
    timeoutMs: 30_000
  });
  return {
    ok: result.ok,
    command
  };
}

function commandAvailable(runner, command) {
  return runner.run(
    "sh",
    ["-c", `command -v ${shellQuote(command)} >/dev/null 2>&1`],
    { allowFailure: true, timeoutMs: 30_000 }
  ).ok;
}

function requireApt(runner) {
  if (commandAvailable(runner, "apt-get")) return;
  throw new DirectHttpsRuntimeError(
    "APT is required to install missing host packages",
    { code: "package_manager_unavailable", step: "packages" }
  );
}

function aptUpdate(runner, options = {}) {
  return runner.run("apt-get", ["update"], {
    privileged: true,
    env: { DEBIAN_FRONTEND: "noninteractive" },
    allowFailure: options.allowFailure === true,
    timeoutMs: 300_000,
    errorCode: "package_install_failed",
    step: "packages"
  });
}

function installStableRuntime({ contract, env, runner }) {
  const changes = [];
  ensureDirectory(runner, contract.paths.runtime_dir, "0755");
  ensureDirectory(runner, contract.paths.state_dir, "0700");
  ensureDirectory(runner, contract.paths.dns_state_dir, "0700");
  ensureDirectory(
    runner,
    path.posix.dirname(contract.paths.environment_file),
    "0755"
  );
  for (const filename of RUNTIME_FILES) {
    const source = path.join(scriptDir, filename);
    if (!fs.existsSync(source)) {
      throw new DirectHttpsRuntimeError(`runtime source is missing: ${filename}`, {
        code: "runtime_source_missing",
        step: "runtime"
      });
    }
    const target = path.posix.join(contract.paths.runtime_dir, filename);
    const content = fs.readFileSync(source, "utf8");
    if (installTextFile({ runner, target, content, mode: "0755" })) {
      changes.push(target);
    }
  }
  if (installTextFile({
    runner,
    target: contract.paths.auth_hook,
    content: renderCertbotHookWrapper(contract, "auth"),
    mode: "0755"
  })) changes.push(contract.paths.auth_hook);
  if (installTextFile({
    runner,
    target: contract.paths.cleanup_hook,
    content: renderCertbotHookWrapper(contract, "cleanup"),
    mode: "0755"
  })) changes.push(contract.paths.cleanup_hook);
  if (installTextFile({
    runner,
    target: contract.paths.deploy_hook,
    content: renderDeployHook(),
    mode: "0755"
  })) changes.push(contract.paths.deploy_hook);
  if (installTextFile({
    runner,
    target: contract.paths.environment_file,
    content: renderRuntimeEnvironment(env, contract),
    mode: "0600"
  })) changes.push(contract.paths.environment_file);
  return { changed: changes.length > 0, files_changed: changes };
}

async function ensureStaticService({
  contract,
  runner,
  fetchImpl,
  runtimeChanged
}) {
  ensureDirectory(
    runner,
    path.posix.dirname(contract.static_root),
    "0755",
    contract.runtime_user,
    contract.runtime_group
  );
  ensureDirectory(
    runner,
    contract.static_root,
    "0755",
    contract.runtime_user,
    contract.runtime_group
  );
  const unitChanged = installTextFile({
    runner,
    target: contract.paths.systemd_unit,
    content: renderSystemdUnit(contract),
    mode: "0644"
  });
  if (unitChanged) {
    runner.run("systemctl", ["daemon-reload"], {
      privileged: true,
      step: "static-service"
    });
  }
  let active = runner.run("systemctl", ["is-active", "--quiet", contract.service_name], {
    privileged: true,
    allowFailure: true
  }).ok;
  if (!active) {
    const health = await probeUrl(contract.local_health_url, {
      fetchImpl,
      timeoutMs: 1_500
    });
    const pid = Number(health.body?.pid || 0);
    const portState = classifyStaticPortProbe(health);
    if (portState === "compatible" && Number.isInteger(pid) && pid > 1) {
      runner.run("kill", ["-TERM", String(pid)], {
        privileged: true,
        allowFailure: true
      });
      await waitForLocalHostToStop(contract, fetchImpl);
    } else if (portState === "conflict") {
      throw new DirectHttpsRuntimeError(
        `port ${contract.static_port} is occupied by an incompatible service`,
        { code: "static_port_conflict", step: "static-service" }
      );
    }
  }
  runner.run("systemctl", ["enable", contract.service_name], {
    privileged: true,
    step: "static-service",
    errorCode: "static_service_start_failed"
  });
  const action = active && (runtimeChanged || unitChanged)
    ? ["restart", contract.service_name]
    : ["start", contract.service_name];
  runner.run("systemctl", action, {
    privileged: true,
    step: "static-service",
    errorCode: "static_service_start_failed"
  });
  active = true;
  const health = await waitForHealthyUrl(contract.local_health_url, {
    fetchImpl,
    timeoutMs: 15_000
  });
  if (
    health.body?.contract_version !== DIRECT_HOST_CONTRACT_VERSION
    || Number(health.body?.port) !== Number(contract.static_port)
  ) {
    throw new DirectHttpsRuntimeError(
      "static host health contract does not match the installed runtime",
      { code: "static_service_contract_mismatch", step: "static-service" }
    );
  }
  return {
    changed: unitChanged || runtimeChanged,
    active,
    enabled: true,
    pid: Number(health.body?.pid || 0)
  };
}

function issueCertificate({
  contract,
  env,
  runner,
  certbotCommand,
  staging,
  certificate,
  force
}) {
  const args = buildCertbotArguments({
    contract,
    staging,
    certificate,
    force
  });
  runner.run(certbotCommand || "certbot", args, {
    privileged: true,
    env,
    timeoutMs: 900_000,
    errorCode: "certificate_issuance_failed",
    step: "certificate"
  });
}

export function buildCertbotArguments({ contract, staging, certificate, force }) {
  const current = certificate || {
    exists: false,
    valid: false,
    staging: false,
    sans: []
  };
  const args = [
    "certonly",
    "--manual",
    "--preferred-challenges", "dns",
    "--manual-auth-hook", contract.paths.auth_hook,
    "--manual-cleanup-hook", contract.paths.cleanup_hook,
    "--non-interactive",
    "--agree-tos",
    "--register-unsafely-without-email",
    "--cert-name", contract.certificate_name
  ];
  if (staging) args.push("--test-cert");
  if (current.exists) {
    const currentSans = new Set(current.sans || []);
    if (contract.certificate_hostnames.some(host => !currentSans.has(host))) {
      args.push("--expand");
    }
    if (
      force
      || current.valid !== true
      || current.staging !== staging
    ) {
      args.push("--force-renewal");
    }
  }
  for (const hostname of contract.certificate_hostnames) {
    args.push("-d", hostname);
  }
  return args;
}

function installNginxConfiguration({ contract, runner }) {
  const content = renderNginxConfig(contract);
  const isolated = [
    "pid /tmp/catsco-cloud-html-artifact-nginx-test.pid;",
    "error_log stderr;",
    "events {}",
    "http {",
    "    access_log off;",
    ...content.split("\n").map(line => line ? `    ${line}` : ""),
    "}",
    ""
  ].join("\n");
  const temporary = temporaryFile(isolated, "nginx-test.conf", "0644");
  try {
    runner.run("nginx", ["-t", "-c", temporary], {
      privileged: true,
      errorCode: "nginx_config_invalid",
      step: "nginx"
    });
  } finally {
    fs.rmSync(temporary, { force: true });
  }

  const previous = readTextPrivileged(contract.paths.nginx_config, runner);
  const changed = previous !== content;
  if (changed) {
    installTextFile({
      runner,
      target: contract.paths.nginx_config,
      content,
      mode: "0644",
      force: true
    });
  }
  try {
    runner.run("nginx", ["-t"], {
      privileged: true,
      errorCode: "nginx_config_invalid",
      step: "nginx"
    });
  } catch (error) {
    if (changed) {
      if (previous === null) {
        runner.run("rm", ["-f", contract.paths.nginx_config], {
          privileged: true,
          allowFailure: true
        });
      } else {
        installTextFile({
          runner,
          target: contract.paths.nginx_config,
          content: previous,
          mode: "0644",
          force: true
        });
      }
    }
    throw error;
  }
  runner.run("systemctl", ["enable", "--now", "nginx"], {
    privileged: true,
    step: "nginx"
  });
  runner.run("systemctl", ["reload", "nginx"], {
    privileged: true,
    step: "nginx"
  });
  return { changed, valid: true, reloaded: true };
}

function inspectCertificate(contract, runner) {
  const pem = readTextPrivileged(contract.paths.fullchain, runner);
  if (!pem) {
    return {
      exists: false,
      valid: false,
      staging: false,
      sans: [],
      expires_at: "",
      days_remaining: 0,
      error: "certificate file is absent"
    };
  }
  try {
    const certificate = new X509Certificate(pem);
    const sans = Array.from(certificate.subjectAltName?.matchAll(/DNS:([^,\s]+)/g) || [])
      .map(match => match[1].toLowerCase());
    const expiresAt = new Date(certificate.validTo);
    const now = Date.now();
    const daysRemaining = Math.floor((expiresAt.getTime() - now) / 86_400_000);
    const issuer = certificate.issuer;
    const staging = /staging|fake le|happy hacker/i.test(issuer);
    const valid = new Date(certificate.validFrom).getTime() <= now
      && expiresAt.getTime() > now;
    return {
      exists: true,
      valid,
      staging,
      sans,
      issuer,
      expires_at: expiresAt.toISOString(),
      days_remaining: daysRemaining,
      fingerprint_sha256: certificate.fingerprint256
    };
  } catch (error) {
    return {
      exists: true,
      valid: false,
      staging: false,
      sans: [],
      expires_at: "",
      days_remaining: 0,
      error: `certificate parsing failed: ${messageOf(error)}`
    };
  }
}

function certificateSatisfiesContract(certificate, contract, options = {}) {
  if (!certificate?.exists || !certificate.valid) return false;
  if (certificate.days_remaining < Number(options.minimumDays || 1)) return false;
  if (options.staging === true && certificate.staging !== true) return false;
  if (options.staging !== true && certificate.staging === true) return false;
  const sans = new Set(certificate.sans || []);
  return contract.certificate_hostnames.every(host => sans.has(host));
}

function inspectNginx(contract, runner) {
  const text = readTextPrivileged(contract.paths.nginx_config, runner);
  if (!text) {
    return { exists: false, valid: false, error: "Nginx Artifact config is absent" };
  }
  const syntax = runner.run("nginx", ["-t"], {
    privileged: true,
    allowFailure: true
  });
  const expected = renderNginxConfig(contract);
  return {
    exists: true,
    valid: syntax.ok && text === expected,
    syntax_ok: syntax.ok,
    contract_match: text === expected,
    error: syntax.ok && text === expected
      ? ""
      : cleanText(syntax.stderr) || "Nginx Artifact config does not match"
  };
}

function inspectSystemdService(contract, runner) {
  const active = runner.run(
    "systemctl",
    ["is-active", "--quiet", contract.service_name],
    { privileged: true, allowFailure: true }
  ).ok;
  const enabled = runner.run(
    "systemctl",
    ["is-enabled", "--quiet", contract.service_name],
    { privileged: true, allowFailure: true }
  ).ok;
  return { active, enabled };
}

function inspectRenewalHooks(contract, runner) {
  const auth = readTextPrivileged(contract.paths.auth_hook, runner);
  const cleanup = readTextPrivileged(contract.paths.cleanup_hook, runner);
  const deploy = readTextPrivileged(contract.paths.deploy_hook, runner);
  const renewalPath = `/etc/letsencrypt/renewal/${contract.certificate_name}.conf`;
  const renewal = readTextPrivileged(renewalPath, runner);
  const valid = Boolean(
    auth && cleanup && deploy && renewal
    && renewal.includes(contract.paths.auth_hook)
    && renewal.includes(contract.paths.cleanup_hook)
  );
  return {
    valid,
    renewal_file: renewalPath,
    error: valid
      ? ""
      : "Certbot renewal configuration does not reference the stable DNS hooks"
  };
}

function ensureDirectory(runner, target, mode, owner = "", group = "") {
  const args = ["-d", "-m", mode];
  if (owner) args.push("-o", systemdName(owner, "directory owner"));
  if (group) args.push("-g", systemdName(group, "directory group"));
  args.push(target);
  runner.run("install", args, {
    privileged: true,
    step: "runtime"
  });
}

function installTextFile({ runner, target, content, mode, force = false }) {
  const current = readTextPrivileged(target, runner);
  if (!force && current === content) return false;
  const temporary = temporaryFile(content, path.basename(target), mode);
  try {
    runner.run("install", ["-D", "-m", mode, temporary, target], {
      privileged: true,
      step: "runtime"
    });
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  return true;
}

function temporaryFile(content, label, mode) {
  const target = path.join(
    os.tmpdir(),
    `catsco-artifact-${process.pid}-${crypto.randomBytes(6).toString("hex")}-${label}`
  );
  fs.writeFileSync(target, content, {
    encoding: "utf8",
    mode: Number.parseInt(mode, 8),
    flag: "wx"
  });
  return target;
}

function readJsonPrivileged(target, runner) {
  const text = readTextPrivileged(target, runner);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new DirectHttpsRuntimeError(
      `invalid JSON in ${target}: ${messageOf(error)}`,
      { code: "host_state_invalid", step: "identity" }
    );
  }
}

function readTextPrivileged(target, runner) {
  try {
    if (fs.existsSync(target)) return fs.readFileSync(target, "utf8");
  } catch {
    // Fall through to privileged read.
  }
  const result = runner.run("cat", [target], {
    privileged: true,
    allowFailure: true
  });
  return result.ok ? result.stdout : null;
}

function resolvePrimaryGroup(runner) {
  const result = runner.run("id", ["-gn"], { allowFailure: true });
  const group = cleanText(result.stdout);
  if (!result.ok || !group) {
    throw new DirectHttpsRuntimeError("unable to determine the runtime user's primary group", {
      code: "runtime_group_unavailable",
      step: "identity"
    });
  }
  return systemdName(group, "runtime group");
}

async function waitForLocalHostToStop(contract, fetchImpl) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const health = await probeUrl(contract.local_health_url, {
      fetchImpl,
      timeoutMs: 500
    });
    if (!health.ok) return;
    await delay(100);
  }
  throw new DirectHttpsRuntimeError(
    `existing static host did not release port ${contract.static_port}`,
    { code: "static_service_stop_timeout", step: "static-service" }
  );
}

export async function waitForHealthyUrl(url, options = {}) {
  const nowMs = options.nowMs || Date.now;
  const sleep = options.sleep || delay;
  const timeoutMs = positiveInteger(options.timeoutMs, 15_000, "health timeout");
  const pollMs = positiveInteger(options.pollMs, 200, "health poll interval");
  const probeTimeoutMs = positiveInteger(
    options.probeTimeoutMs,
    1_000,
    "health probe timeout"
  );
  const deadline = nowMs() + timeoutMs;
  let last = null;
  while (nowMs() < deadline) {
    last = await probeUrl(url, {
      fetchImpl: options.fetchImpl,
      timeoutMs: probeTimeoutMs
    });
    if (last.ok) return last;
    await sleep(pollMs);
  }
  throw new DirectHttpsRuntimeError(
    `health endpoint did not become ready: ${url}: ${last?.error || last?.status || "timeout"}`,
    { code: "health_check_timeout", step: "verify" }
  );
}

async function probeUrl(url, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(Number(options.timeoutMs || 5_000))
    });
    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    const headers = {};
    for (const name of ["x-frame-options", "content-security-policy"]) {
      const value = response.headers?.get?.(name);
      if (value) headers[name] = value;
    }
    return {
      ok: response.ok && (body === null || body.ok !== false),
      status: response.status,
      url: response.url || url,
      body,
      headers
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      body: null,
      headers: {},
      error: messageOf(error)
    };
  }
}

function relativeRecordHost(hostname, zone) {
  if (hostname === zone) return "@";
  return hostname.slice(0, -(zone.length + 1));
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      result._.push(token);
      continue;
    }
    const key = token.slice(2);
    if (["staging", "force-certificate"].includes(key)) {
      result[key] = true;
      continue;
    }
    result[key] = argv[index + 1];
    index += 1;
  }
  return result;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const options = {
    staging: args.staging === true,
    forceCertificate: args["force-certificate"] === true
  };
  let result;
  if (command === "inspect") result = await inspectDirectHttpsHost(options);
  else if (command === "ensure") result = await ensureDirectHttpsHost(options);
  else if (command === "verify") result = await verifyDirectHttpsHost(options);
  else {
    throw new DirectHttpsRuntimeError(
      "usage: direct-https-runtime.mjs <inspect|ensure|verify> [--staging] [--force-certificate]",
      { code: "invalid_command" }
    );
  }
  console.log(JSON.stringify(result, null, 2));
}

function validateHostname(value, label = "Artifact hostname") {
  const text = requiredText(value, label).replace(/\.$/, "").toLowerCase();
  if (
    text.length > 253
    || !text.includes(".")
    || text.split(".").some(part =>
      !part
      || part.length > 63
      || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(part)
    )
  ) {
    throw new Error(`${label} is not a valid DNS hostname`);
  }
  return text;
}

function systemdName(value, label) {
  const text = requiredText(value, label);
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(text)) {
    throw new Error(`${label} contains unsupported characters`);
  }
  return text;
}

function nginxPath(value) {
  const text = absolutePath(value, "Nginx path");
  if (/[\s;{}]/.test(text)) throw new Error("Nginx path contains unsupported characters");
  return text;
}

function systemdQuote(value) {
  const text = requiredText(value, "systemd argument");
  return `"${text.replace(/([\\"])/g, "\\$1")}"`;
}

function systemdSettingPath(value, label) {
  const text = absolutePath(value, label);
  if (/[\s"'\\]/.test(text)) {
    throw new Error(`${label} contains characters unsupported by this systemd setting`);
  }
  return text;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function absolutePath(value, label) {
  const text = requiredText(value, label);
  if (!path.posix.isAbsolute(text) && !path.win32.isAbsolute(text)) {
    throw new Error(`${label} must be absolute`);
  }
  return text.replace(/\\/g, "/");
}

function requiredSecret(value, label) {
  const text = cleanText(value);
  if (!text) {
    throw new DirectHttpsRuntimeError(
      `missing required environment variable: ${label}`,
      { code: "dns_credentials_unavailable", step: "dns" }
    );
  }
  if (/[\r\n\0]/.test(text)) throw new Error(`${label} contains unsupported characters`);
  return text;
}

function requiredText(value, label) {
  const text = cleanText(value);
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function positiveInteger(value, fallback, label) {
  const number = Number(value || fallback);
  if (!Number.isInteger(number) || number < 1 || number > 65_535_000) {
    throw new Error(`${label || "value"} must be a positive integer`);
  }
  return number;
}

function portNumber(value, fallback, label) {
  const port = positiveInteger(value, fallback, label);
  if (port > 65_535) throw new Error(`${label || "port"} must be at most 65535`);
  return port;
}

export function classifyStaticPortProbe(health) {
  if (!health?.ok) return health?.status ? "conflict" : "available";
  return health.body?.contract_version === DIRECT_HOST_CONTRACT_VERSION
    ? "compatible"
    : "conflict";
}

function splitList(value) {
  return String(value || "").split(/[\s,]+/).map(cleanText).filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function isMainModule() {
  return process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isMainModule()) {
  runCli().catch(error => {
    console.error(JSON.stringify({
      ok: false,
      contract_version: DIRECT_HTTPS_CONTRACT_VERSION,
      command: process.argv[2] || "",
      code: cleanText(error?.code) || "direct_https_runtime_failed",
      step: cleanText(error?.step),
      error: messageOf(error)
    }));
    process.exitCode = 1;
  });
}
