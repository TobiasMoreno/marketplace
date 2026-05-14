import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checkMode = process.argv.includes("--check");

const author = { name: "Tobias Moreno" };

const PLUGINS = {
  core: {
    id: "tat-core",
    version: "0.1.0",
    description:
      "Foundational infrastructure for tat-marketplace: /tat-update command, SessionStart auto-update hook and personal rules-fallback (tat-rules.md).",
    codexName: "TAT Core",
    keywords: ["tat", "core", "auto-update", "hooks", "marketplace", "claude-code", "codex"],
    compatibility: null,
    codexCapabilities: ["Read"],
    extraFiles: {
      claude: [
        {
          from: "core/hooks/session-start.json",
          to: "hooks/hooks.json",
        },
        {
          from: "core/scripts/check-updates.mjs",
          to: "scripts/check-updates.mjs",
        },
        {
          from: "core/rules/tat-rules.md",
          to: "rules/tat-rules.md",
        },
      ],
      codex: [
        {
          from: "core/rules/tat-rules.md",
          to: "rules/tat-rules.md",
        },
      ],
    },
  },
  explain: {
    id: "tat-explain-tools",
    version: "0.2.0",
    description:
      "Read-direction skills (tat-*) to understand existing systems: architecture, domains, integrations. No new design or code generation.",
    codexName: "TAT Explain Tools",
    keywords: ["tat", "explain", "architecture", "diagrams", "documentation", "marketplace", "claude-code", "codex"],
    compatibility: null,
    codexCapabilities: ["Read"],
  },
  opsx: {
    id: "tat-opsx-openspec",
    version: "0.3.0",
    description: "OpenSpec workflow skills generated from tobias-agent-toolkit core.",
    codexName: "TAT OPSX OpenSpec",
    keywords: ["tat", "opsx", "openspec", "claude-code", "codex", "workflow"],
    compatibility: "Requires openspec CLI.",
    codexCapabilities: ["Write"],
  },
  review: {
    id: "tat-review-tools",
    version: "0.1.0",
    description:
      "Review, governance, cleanup skills and security agent for the tat marketplace.",
    codexName: "TAT Review Tools",
    keywords: ["tat", "review", "security", "cleanup", "openspec", "claude-code"],
    compatibility: null,
    codexCapabilities: ["Write"],
  },
};

const DEFAULT_PLUGIN = {
  workflow: "opsx",
  skill: "review",
  agent: "review",
  command: "review",
};

function posixPath(value) {
  return value.split(path.sep).join("/");
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

async function readSkillFolder(dir, defaultPlugin) {
  const relSource = posixPath(path.relative(root, dir));
  const metaPath = path.join(dir, "meta.yaml");
  const bodyPath = path.join(dir, "body.md");
  const meta = parseMeta(await readFile(metaPath, "utf8"), metaPath);
  const body = (await readFile(bodyPath, "utf8")).trimEnd();
  const rules = await readRules(meta.rules);
  const pluginKey = meta.plugin || defaultPlugin;
  if (!PLUGINS[pluginKey]) {
    throw new Error(`Unknown plugin '${pluginKey}' referenced from ${metaPath}`);
  }
  return { relSource, meta, body, rules, pluginKey };
}

async function readWorkflows() {
  const base = path.join(root, "core", "workflows", "opsx");
  const entries = await readdir(base, { withFileTypes: true });
  const workflows = [];
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const skill = await readSkillFolder(path.join(base, entry.name), DEFAULT_PLUGIN.workflow);
    workflows.push(skill);
  }
  return workflows.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

async function readStandaloneSkills() {
  const base = path.join(root, "core", "skills");
  let entries = [];
  try {
    entries = await readdir(base, { withFileTypes: true });
  } catch {
    return [];
  }
  const skills = [];
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const skill = await readSkillFolder(path.join(base, entry.name), DEFAULT_PLUGIN.skill);
    skills.push(skill);
  }
  return skills.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

function parseFrontmatterPluginField(content, filePath) {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error(`Expected frontmatter at line 1 of ${filePath}`);
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") break;
    const m = lines[i].match(/^plugin:\s*(.+)$/);
    if (m) return unquote(m[1].trim());
  }
  return null;
}

function stripPluginFieldFromContent(content) {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") return content;
  const out = [lines[0]];
  let inFm = true;
  for (let i = 1; i < lines.length; i++) {
    if (inFm && lines[i] === "---") {
      inFm = false;
      out.push(lines[i]);
      continue;
    }
    if (inFm && /^plugin:\s*/.test(lines[i])) continue;
    out.push(lines[i]);
  }
  return out.join("\n");
}

async function readPassthroughs(subdir, defaultPlugin) {
  const base = path.join(root, "core", subdir);
  let entries = [];
  try {
    entries = await readdir(base, { withFileTypes: true });
  } catch {
    return [];
  }
  const items = [];
  for (const entry of entries.filter((item) => item.isFile() && item.name.endsWith(".md"))) {
    const filePath = path.join(base, entry.name);
    const relSource = posixPath(path.relative(root, filePath));
    const rawContent = await readFile(filePath, "utf8");
    const pluginKey = parseFrontmatterPluginField(rawContent, filePath) || defaultPlugin;
    if (!PLUGINS[pluginKey]) {
      throw new Error(`Unknown plugin '${pluginKey}' referenced from ${filePath}`);
    }
    const content = stripPluginFieldFromContent(rawContent);
    items.push({ name: entry.name, relSource, content, pluginKey });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
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

function generatedBannerLine(relSource) {
  return `# GENERATED FROM ${relSource} - do not edit by hand`;
}

function yamlString(value) {
  return JSON.stringify(value);
}

function renderSkill(skill, adapter, opts = {}) {
  const { meta, body, rules, relSource } = skill;
  const fm = ["---", generatedBannerLine(relSource)];
  fm.push(`name: ${meta.name}`);
  fm.push(`description: ${yamlString(meta.description)}`);
  fm.push("license: MIT");
  if (opts.compatibility) {
    fm.push(`compatibility: ${yamlString(opts.compatibility)}`);
  }
  if (meta["disable-model-invocation"] === "true") {
    fm.push("disable-model-invocation: true");
  }
  fm.push("metadata:");
  fm.push(`  adapter: ${adapter}`);
  fm.push("  generatedBy: tobias-agent-toolkit");
  fm.push("---");

  const frontmatter = fm.join("\n");
  const ruleBlock = rules.length ? ["## Included Rules", ...rules].join("\n\n") : "";
  return [frontmatter, body, ruleBlock].filter(Boolean).join("\n\n").concat("\n");
}

function renderPassthrough(item) {
  const lines = item.content.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error(`Expected frontmatter at line 1 of ${item.relSource}`);
  }
  const banner = generatedBannerLine(item.relSource);
  return [lines[0], banner, ...lines.slice(1)].join("\n");
}

function renderClaudePlugin(plugin) {
  return `${JSON.stringify(
    {
      name: plugin.id,
      version: plugin.version,
      description: plugin.description,
      author,
      keywords: plugin.keywords,
    },
    null,
    2,
  )}\n`;
}

function renderCodexPlugin(plugin, skills) {
  return `${JSON.stringify(
    {
      id: plugin.id,
      name: plugin.codexName,
      version: plugin.version,
      description: plugin.description,
      author,
      skills: skills.map((skill) => ({
        name: skill.meta.name,
        description: skill.meta.description,
        path: `skills/${skill.meta.name}/SKILL.md`,
      })),
    },
    null,
    2,
  )}\n`;
}

function renderCodexPluginManifest(plugin, { hasSkills }) {
  const manifest = {
    name: plugin.id,
    version: plugin.version,
    description: plugin.description,
    author,
    repository: "https://github.com/TobiasMoreno/marketplace",
    license: "MIT",
    keywords: plugin.keywords,
  };
  if (hasSkills) manifest.skills = "./skills/";
  manifest.interface = {
    displayName: plugin.codexName,
    shortDescription: plugin.description,
    developerName: author.name,
    category: "Productivity",
    capabilities: plugin.codexCapabilities,
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function renderCodexMarketplace() {
  return `${JSON.stringify(
    {
      name: "tat-marketplace",
      interface: {
        displayName: "TAT Marketplace",
      },
      plugins: Object.values(PLUGINS).map((plugin) => ({
        name: plugin.id,
        source: {
          source: "local",
          path: `./adapters/codex/plugins/${plugin.id}`,
        },
        policy: {
          installation: "AVAILABLE",
          authentication: "ON_INSTALL",
        },
        category: "Productivity",
      })),
    },
    null,
    2,
  )}\n`;
}

function renderAdapterReadme(adapter) {
  return [
    `# ${adapter === "claude" ? "Claude" : "Codex"} Adapter`,
    "",
    "This adapter is generated from `core/`.",
    "Do not edit generated plugin files by hand.",
    "",
  ].join("\n");
}

function renderClaudeMarketplace() {
  return `${JSON.stringify(
    {
      name: "tat-marketplace",
      owner: { name: author.name },
      plugins: Object.values(PLUGINS).map((plugin) => ({
        name: plugin.id,
        source: `./adapters/claude/plugins/${plugin.id}`,
        description: plugin.description,
      })),
    },
    null,
    2,
  )}\n`;
}

async function expectedFiles() {
  const workflows = await readWorkflows();
  const standalone = await readStandaloneSkills();
  const agents = await readPassthroughs("agents", DEFAULT_PLUGIN.agent);
  const commands = await readPassthroughs("commands", DEFAULT_PLUGIN.command);
  const files = new Map();

  // Group skills by target plugin
  const skillsByPlugin = new Map();
  const recordSkill = (skill) => {
    const list = skillsByPlugin.get(skill.pluginKey) ?? [];
    list.push(skill);
    skillsByPlugin.set(skill.pluginKey, list);
  };
  for (const wf of workflows) recordSkill(wf);
  for (const sk of standalone) recordSkill(sk);

  for (const [pluginKey, plugin] of Object.entries(PLUGINS)) {
    const skills = skillsByPlugin.get(pluginKey) ?? [];
    const pluginAgents = agents.filter((a) => a.pluginKey === pluginKey);
    const pluginCommands = commands.filter((c) => c.pluginKey === pluginKey);

    for (const adapter of ["claude", "codex"]) {
      for (const skill of skills) {
        files.set(
          path.join(
            root,
            "adapters",
            adapter,
            "plugins",
            plugin.id,
            "skills",
            skill.meta.name,
            "SKILL.md",
          ),
          renderSkill(skill, adapter, { compatibility: plugin.compatibility }),
        );
      }
    }

    // Always emit Claude plugin.json even for plugins with no skills (e.g. tat-core)
    files.set(
      path.join(root, "adapters", "claude", "plugins", plugin.id, ".claude-plugin", "plugin.json"),
      renderClaudePlugin(plugin),
    );
    files.set(
      path.join(root, "adapters", "codex", "plugins", plugin.id, "plugin.json"),
      renderCodexPlugin(plugin, skills),
    );
    files.set(
      path.join(root, "adapters", "codex", "plugins", plugin.id, ".codex-plugin", "plugin.json"),
      renderCodexPluginManifest(plugin, { hasSkills: skills.length > 0 }),
    );

    // Claude-only agents and commands
    for (const agent of pluginAgents) {
      files.set(
        path.join(root, "adapters", "claude", "plugins", plugin.id, "agents", agent.name),
        renderPassthrough(agent),
      );
    }
    for (const cmd of pluginCommands) {
      files.set(
        path.join(root, "adapters", "claude", "plugins", plugin.id, "commands", cmd.name),
        renderPassthrough(cmd),
      );
    }

    // Extra static files (hooks, scripts, rules) copied verbatim from core/.
    const extras = plugin.extraFiles ?? {};
    for (const adapter of ["claude", "codex"]) {
      for (const extra of extras[adapter] ?? []) {
        const sourcePath = path.join(root, extra.from);
        const content = await readFile(sourcePath, "utf8");
        files.set(
          path.join(root, "adapters", adapter, "plugins", plugin.id, extra.to),
          content,
        );
      }
    }
  }

  files.set(
    path.join(root, "adapters", "claude", "CLAUDE.md"),
    renderAdapterReadme("claude"),
  );
  files.set(
    path.join(root, "adapters", "codex", "AGENTS.md"),
    renderAdapterReadme("codex"),
  );
  files.set(
    path.join(root, ".agents", "plugins", "marketplace.json"),
    renderCodexMarketplace(),
  );
  files.set(
    path.join(root, ".claude-plugin", "marketplace.json"),
    renderClaudeMarketplace(),
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
