import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checkMode = process.argv.includes("--check");

const author = { name: "Tobias Moreno" };

const PLUGINS = {
  opsx: {
    id: "tat-opsx-openspec",
    version: "0.2.0",
    description: "OpenSpec workflow skills generated from tobias-agent-toolkit core.",
    codexName: "TAT OPSX OpenSpec",
    keywords: ["tat", "opsx", "openspec", "claude-code", "codex", "workflow"],
    compatibility: "Requires openspec CLI.",
  },
  review: {
    id: "tat-review-tools",
    version: "0.1.0",
    description:
      "Review, governance, cleanup skills, security agent and update command for the tat marketplace.",
    codexName: "TAT Review Tools",
    keywords: ["tat", "review", "security", "cleanup", "openspec", "claude-code"],
    compatibility: null,
  },
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

async function readSkillFolder(dir) {
  const relSource = posixPath(path.relative(root, dir));
  const metaPath = path.join(dir, "meta.yaml");
  const bodyPath = path.join(dir, "body.md");
  const meta = parseMeta(await readFile(metaPath, "utf8"), metaPath);
  const body = (await readFile(bodyPath, "utf8")).trimEnd();
  const rules = await readRules(meta.rules);
  return { relSource, meta, body, rules };
}

async function readWorkflows() {
  const base = path.join(root, "core", "workflows", "opsx");
  const entries = await readdir(base, { withFileTypes: true });
  const workflows = [];
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const skill = await readSkillFolder(path.join(base, entry.name));
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
    const skill = await readSkillFolder(path.join(base, entry.name));
    skills.push(skill);
  }
  return skills.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

async function readPassthroughs(subdir) {
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
    const content = await readFile(filePath, "utf8");
    items.push({ name: entry.name, relSource, content });
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

function renderClaudePlugin(plugin, skills) {
  void skills;
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

function renderAdapterReadme(adapter) {
  return [
    `# ${adapter === "claude" ? "Claude" : "Codex"} Adapter`,
    "",
    "This adapter is generated from `core/`.",
    "Do not edit generated plugin files by hand.",
    "",
  ].join("\n");
}

async function expectedFiles() {
  const workflows = await readWorkflows();
  const standalone = await readStandaloneSkills();
  const agents = await readPassthroughs("agents");
  const commands = await readPassthroughs("commands");
  const files = new Map();

  const opsx = PLUGINS.opsx;
  for (const adapter of ["claude", "codex"]) {
    for (const wf of workflows) {
      files.set(
        path.join(
          root,
          "adapters",
          adapter,
          "plugins",
          opsx.id,
          "skills",
          wf.meta.name,
          "SKILL.md",
        ),
        renderSkill(wf, adapter, { compatibility: opsx.compatibility }),
      );
    }
  }
  files.set(
    path.join(root, "adapters", "claude", "plugins", opsx.id, ".claude-plugin", "plugin.json"),
    renderClaudePlugin(opsx, workflows),
  );
  files.set(
    path.join(root, "adapters", "codex", "plugins", opsx.id, "plugin.json"),
    renderCodexPlugin(opsx, workflows),
  );
  files.set(
    path.join(root, "adapters", "claude", "plugins", opsx.id, "hooks", "hooks.json"),
    await readFile(path.join(root, "core", "hooks", "session-start.json"), "utf8"),
  );
  files.set(
    path.join(root, "adapters", "claude", "plugins", opsx.id, "scripts", "check-updates.mjs"),
    await readFile(path.join(root, "core", "scripts", "check-updates.mjs"), "utf8"),
  );

  const review = PLUGINS.review;
  for (const adapter of ["claude", "codex"]) {
    for (const skill of standalone) {
      files.set(
        path.join(
          root,
          "adapters",
          adapter,
          "plugins",
          review.id,
          "skills",
          skill.meta.name,
          "SKILL.md",
        ),
        renderSkill(skill, adapter, { compatibility: review.compatibility }),
      );
    }
  }
  files.set(
    path.join(root, "adapters", "claude", "plugins", review.id, ".claude-plugin", "plugin.json"),
    renderClaudePlugin(review, standalone),
  );
  files.set(
    path.join(root, "adapters", "codex", "plugins", review.id, "plugin.json"),
    renderCodexPlugin(review, standalone),
  );
  for (const agent of agents) {
    files.set(
      path.join(root, "adapters", "claude", "plugins", review.id, "agents", agent.name),
      renderPassthrough(agent),
    );
  }
  for (const cmd of commands) {
    files.set(
      path.join(root, "adapters", "claude", "plugins", review.id, "commands", cmd.name),
      renderPassthrough(cmd),
    );
  }

  files.set(
    path.join(root, "adapters", "claude", "CLAUDE.md"),
    renderAdapterReadme("claude"),
  );
  files.set(
    path.join(root, "adapters", "codex", "AGENTS.md"),
    renderAdapterReadme("codex"),
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
