import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checkMode = process.argv.includes("--check");
const pluginId = "tat-opsx-openspec";
const pluginVersion = "0.2.0";
const pluginAuthor = { name: "Tobias Moreno" };
const pluginKeywords = ["tat", "opsx", "openspec", "claude-code", "codex", "workflow"];

function posixPath(value) {
  return value.split(path.sep).join("/");
}

function parseMeta(source, filePath) {
  const meta = {};
  let currentList = null;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (keyMatch) {
      const [, key, rawValue = ""] = keyMatch;
      const value = rawValue.trim();
      if (value === "") {
        meta[key] = [];
        currentList = key;
      } else {
        meta[key] = unquote(value);
        currentList = null;
      }
      continue;
    }

    const itemMatch = line.match(/^\s*-\s*(.*)$/);
    if (itemMatch && currentList) {
      meta[currentList].push(unquote(itemMatch[1].trim()));
      continue;
    }

    throw new Error(`Unsupported YAML syntax in ${filePath}: ${rawLine}`);
  }

  for (const key of ["name", "description"]) {
    if (!meta[key]) throw new Error(`Missing ${key} in ${filePath}`);
  }

  meta.triggers ??= [];
  meta.rules ??= [];
  return meta;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function readWorkflows() {
  const base = path.join(root, "core", "workflows", "opsx");
  const entries = await readdir(base, { withFileTypes: true });
  const workflows = [];

  for (const entry of entries.filter((item) => item.isDirectory())) {
    const workflowDir = path.join(base, entry.name);
    const relSource = posixPath(path.relative(root, workflowDir));
    const metaPath = path.join(workflowDir, "meta.yaml");
    const bodyPath = path.join(workflowDir, "body.md");
    const meta = parseMeta(await readFile(metaPath, "utf8"), metaPath);
    const body = (await readFile(bodyPath, "utf8")).trimEnd();
    const rules = await readRules(meta.rules);
    workflows.push({ stage: entry.name, relSource, meta, body, rules });
  }

  return workflows.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

async function readRules(ruleIds) {
  const chunks = [];
  for (const id of ruleIds) {
    const fileName = id.endsWith("-rules") ? `${id}.md` : `${id}-rules.md`;
    const rulePath = path.join(root, "core", "rules", fileName);
    chunks.push((await readFile(rulePath, "utf8")).trimEnd());
  }
  return chunks;
}

function generatedBanner(workflow) {
  return `<!-- GENERATED FROM ${workflow.relSource} - do not edit by hand -->`;
}

function renderSkill(workflow, adapter) {
  const { meta, body, rules } = workflow;
  const frontmatter = [
    "---",
    `name: ${meta.name}`,
    `description: ${meta.description}`,
    "license: MIT",
    "compatibility: Requires openspec CLI.",
    "metadata:",
    `  adapter: ${adapter}`,
    "  generatedBy: tobias-agent-toolkit",
    "---",
  ].join("\n");

  const ruleBlock = rules.length
    ? ["## Included Rules", ...rules].join("\n\n")
    : "";

  return [generatedBanner(workflow), frontmatter, body, ruleBlock]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}

function renderClaudePlugin(workflows) {
  return `${JSON.stringify(
    {
      name: pluginId,
      version: pluginVersion,
      description: "OpenSpec workflow skills generated from tobias-agent-toolkit core.",
      author: pluginAuthor,
      keywords: pluginKeywords,
      skills: workflows.map((workflow) => workflow.meta.name),
    },
    null,
    2,
  )}\n`;
}

function renderCodexPlugin(workflows) {
  return `${JSON.stringify(
    {
      id: pluginId,
      name: "TAT OPSX OpenSpec",
      version: pluginVersion,
      description: "OpenSpec workflow skills generated from tobias-agent-toolkit core.",
      author: pluginAuthor,
      skills: workflows.map((workflow) => ({
        name: workflow.meta.name,
        description: workflow.meta.description,
        path: `skills/${workflow.meta.name}/SKILL.md`,
      })),
    },
    null,
    2,
  )}\n`;
}

function renderAgentFile(adapter) {
  return [
    `# ${adapter === "claude" ? "Claude" : "Codex"} Adapter`,
    "",
    "This adapter is generated from `core/`.",
    "Do not edit generated plugin skill files by hand.",
    "",
  ].join("\n");
}

async function expectedFiles() {
  const workflows = await readWorkflows();
  const files = new Map();

  for (const adapter of ["claude", "codex"]) {
    for (const workflow of workflows) {
      files.set(
        path.join(
          root,
          "adapters",
          adapter,
          "plugins",
          pluginId,
          "skills",
          workflow.meta.name,
          "SKILL.md",
        ),
        renderSkill(workflow, adapter),
      );
    }
  }

  files.set(
    path.join(root, "adapters", "claude", "CLAUDE.md"),
    renderAgentFile("claude"),
  );
  files.set(
    path.join(root, "adapters", "claude", "plugins", pluginId, ".claude-plugin", "plugin.json"),
    renderClaudePlugin(workflows),
  );
  files.set(
    path.join(root, "adapters", "codex", "AGENTS.md"),
    renderAgentFile("codex"),
  );
  files.set(
    path.join(root, "adapters", "codex", "plugins", pluginId, "plugin.json"),
    renderCodexPlugin(workflows),
  );

  const hookSrc = path.join(root, "core", "hooks", "session-start.json");
  files.set(
    path.join(root, "adapters", "claude", "plugins", pluginId, "hooks", "hooks.json"),
    await readFile(hookSrc, "utf8"),
  );

  const updateScriptSrc = path.join(root, "core", "scripts", "check-updates.mjs");
  files.set(
    path.join(root, "adapters", "claude", "plugins", pluginId, "scripts", "check-updates.mjs"),
    await readFile(updateScriptSrc, "utf8"),
  );

  return files;
}

async function build() {
  const files = await expectedFiles();

  await rm(path.join(root, "adapters", "claude"), { recursive: true, force: true });
  await rm(path.join(root, "adapters", "codex"), { recursive: true, force: true });

  for (const [filePath, content] of files) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }

  console.log(`Generated ${files.size} adapter files.`);
}

async function check() {
  const files = await expectedFiles();
  const drift = [];

  for (const [filePath, expected] of files) {
    let actual = null;
    try {
      actual = await readFile(filePath, "utf8");
    } catch {
      drift.push(posixPath(path.relative(root, filePath)));
      continue;
    }

    if (actual !== expected) {
      drift.push(posixPath(path.relative(root, filePath)));
    }
  }

  if (drift.length) {
    console.error("Generated adapter drift detected:");
    for (const filePath of drift) console.error(`- ${filePath}`);
    process.exitCode = 1;
    return;
  }

  console.log(`No generated adapter drift detected (${files.size} files checked).`);
}

if (checkMode) {
  await check();
} else {
  await build();
}
