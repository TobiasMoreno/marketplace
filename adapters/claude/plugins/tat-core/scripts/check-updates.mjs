#!/usr/bin/env node
// SessionStart hook for tat-marketplace.
//
// Detects pending updates by comparing installed plugin versions against
// the catalog's `plugin.json` files for each plugin published by
// `tat-marketplace`. Best-effort and non-blocking: ANY failure path
// (network, missing CLI, malformed JSON, timeout) results in a silent
// exit 0. The user must never see an error from this hook and must
// never be blocked from starting work.
//
// Disable: set TAT_AUTO_UPDATE_DISABLE=1 in your environment, or remove
// the SessionStart entry from `hooks.json` in your local install.

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const MARKETPLACE_NAME = "tat-marketplace";
const SUFFIX = `@${MARKETPLACE_NAME}`;

if (process.env.TAT_AUTO_UPDATE_DISABLE === "1") process.exit(0);

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    let stdout = "";
    let settled = false;
    const finish = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    let child;
    try {
      child = spawn(cmd, args, {
        stdio: ["ignore", "pipe", "ignore"],
        shell: process.platform === "win32",
      });
    } catch {
      return finish(null);
    }
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      finish(null);
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.on("error", () => {
      clearTimeout(timer);
      finish(null);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      finish(code === 0 ? stdout : null);
    });
  });
}

function parseJsonOrNull(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function main() {
  await run("claude", ["plugin", "marketplace", "update", MARKETPLACE_NAME], 3000);

  const installedRaw = await run("claude", ["plugin", "list", "--json"], 2500);
  const marketplacesRaw = await run(
    "claude",
    ["plugin", "marketplace", "list", "--json"],
    2500,
  );

  const installed = parseJsonOrNull(installedRaw);
  const marketplaces = parseJsonOrNull(marketplacesRaw);
  if (!installed || !marketplaces) return;

  const mkt = marketplaces.find((m) => m && m.name === MARKETPLACE_NAME);
  if (!mkt) return;

  const loc = mkt.installLocation || mkt.path;
  if (!loc) return;

  const catalogPath = path.join(loc, ".claude-plugin", "marketplace.json");
  const catalog = parseJsonOrNull(await readFile(catalogPath, "utf8").catch(() => null));
  if (!catalog) return;

  const latest = new Map();
  for (const entry of catalog.plugins || []) {
    if (!entry?.name || !entry?.source) continue;
    const pluginJsonPath = path.join(loc, entry.source, ".claude-plugin", "plugin.json");
    const data = parseJsonOrNull(await readFile(pluginJsonPath, "utf8").catch(() => null));
    if (data?.version) latest.set(entry.name, data.version);
  }

  let count = 0;
  for (const inst of installed) {
    const id = inst?.id ?? "";
    if (!id.endsWith(SUFFIX)) continue;
    const name = id.slice(0, -SUFFIX.length);
    const installedVersion = inst.version;
    const latestVersion = latest.get(name);
    if (!installedVersion || !latestVersion) continue;
    if (installedVersion !== latestVersion) count += 1;
  }

  if (count > 0) {
    const msg = `[tat] ${count} plugin update(s) available. Run /tat-update to apply.`;
    process.stdout.write(`${JSON.stringify({ systemMessage: msg })}\n`);
  }
}

main().catch(() => {});
