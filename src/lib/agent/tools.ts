import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq } from 'drizzle-orm';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');
fs.mkdirSync(PROJECTS_ROOT, { recursive: true });

const resolveSafePath = (projectId: string, filePath: string) => {
  const base = path.join(PROJECTS_ROOT, projectId, '.openclaw');
  const resolved = path.resolve(base, filePath);
  if (!resolved.startsWith(base)) throw new Error('Path traversal not allowed');
  return resolved;
};

export const agentTools = {
  write_file: tool({
    description: 'Write a file inside the project .openclaw directory.',
    inputSchema: z.object({
      project_id: z.string().describe('The project ID'),
      file_path: z.string().describe('Relative path inside .openclaw/'),
      content: z.string().describe('Full file content to write'),
    }),
    execute: async ({ project_id, file_path, content }) => {
      const fullPath = resolveSafePath(project_id, file_path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf-8');
      return { success: true, path: fullPath };
    },
  }),

  read_file: tool({
    description: 'Read a file from the project .openclaw directory.',
    inputSchema: z.object({
      project_id: z.string(),
      file_path: z.string(),
    }),
    execute: async ({ project_id, file_path }) => {
      const fullPath = resolveSafePath(project_id, file_path);
      if (!fs.existsSync(fullPath)) return { error: 'File not found' };
      return { content: fs.readFileSync(fullPath, 'utf-8') };
    },
  }),

  list_files: tool({
    description: 'List all files currently created inside the project .openclaw directory.',
    inputSchema: z.object({
      project_id: z.string(),
    }),
    execute: async ({ project_id }) => {
      const base = path.join(PROJECTS_ROOT, project_id, '.openclaw');
      if (!fs.existsSync(base)) return { files: [] };
      const walk = (dir: string): string[] =>
        fs.readdirSync(dir).flatMap(f => {
          const full = path.join(dir, f);
          return fs.statSync(full).isDirectory() ? walk(full) : [path.relative(base, full)];
        });
      return { files: walk(base) };
    },
  }),

  zip_export: tool({
    description: 'Zip the entire .openclaw project folder so the user can download it.',
    inputSchema: z.object({
      project_id: z.string(),
    }),
    execute: async ({ project_id }) => {
      const base = path.join(PROJECTS_ROOT, project_id);
      const zipPath = path.join(PROJECTS_ROOT, `${project_id}.zip`);
      execSync(`zip -r "${zipPath}" ".openclaw"`, { cwd: base });
      return { success: true, zipPath: `/generated-projects/${project_id}.zip` };
    },
  }),

  update_architecture: tool({
    description: 'Update the React Flow architecture diagram. Call after creating agents, skills, crons.',
    inputSchema: z.object({
      project_id: z.string(),
      nodes: z.array(z.object({
        id: z.string(),
        type: z.string().optional(),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({ label: z.string() }),
      })),
      edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        label: z.string().optional(),
      })),
    }),
    execute: async ({ project_id, nodes, edges }) => {
      const cleanId = project_id.trim();
      console.log(`[AGENT TOOL] Attempting update for project: "${cleanId}"`);
      console.log(`[AGENT TOOL] Data: ${nodes.length} nodes, ${edges.length} edges`);

      try {
        const architectureData = JSON.stringify({ nodes, edges });
        const result = await db.update(projects)
          .set({ architecture: architectureData })
          .where(eq(projects.id, cleanId));

        console.log(`[AGENT TOOL] Drizzle update result:`, result);

        // Re-verify if it was actually saved
        const check = await db.query.projects.findFirst({
          where: eq(projects.id, cleanId),
          columns: { id: true, architecture: true }
        });

        if (!check) {
          console.error(`[AGENT TOOL] FAIL: Project not found with ID: "${cleanId}"`);
          return { error: `Project not found: ${cleanId}` };
        }

        console.log(`[AGENT TOOL] SUCCESS: Architecture updated for ${cleanId}`);
        return { success: true };
      } catch (error: any) {
        console.error(`[AGENT TOOL] DB Error:`, error);
        return { error: error.message };
      }
    },
  }),
  ask_user: tool({
    description: 'Ask the user a clarifying question with multiple choice options. Use this when you need human input to proceed — e.g. tech stack choice, feature preference, ambiguous requirement.',
    inputSchema: z.object({
      question: z.string().describe('The question to ask the user'),
      options: z.array(z.string()).min(2).max(8).describe('List of answer choices'),
    }),
    // No execute — this is a human-in-the-loop tool, frontend handles it
  }),
  web_search: tool({
    description: 'Search the internet for APIs, OpenClaw docs, ClawHub skills, or any service the user wants to integrate. Use this first before writing any custom skill.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }) => {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          max_results: 5,
          include_answer: true,
        }),
      });
      const data = await res.json();
      return {
        answer: data.answer ?? null,
        results: data.results?.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 300),
        })) ?? [],
      };
    },
  }),

  web_extract: tool({
    description: 'Extract full content from a specific URL. Use this after web_search when you need complete API documentation, endpoint details, or full page content from a URL.',
    inputSchema: z.object({
      url: z.string().describe('The URL to extract content from'),
    }),
    execute: async ({ url }) => {
      const res = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          urls: [url],
        }),
      });
      const data = await res.json();
      const result = data.results?.[0];
      if (!result) return { error: 'Could not extract content' };
      return {
        url: result.url,
        content: result.raw_content?.slice(0, 3000), // cap to avoid token overflow
      };
    },
  }),
  clawhub_search: tool({
    description: 'Search ClawHub skill registry to find existing skills. Use this before writing any custom skill. Returns skill slugs and names.',
    inputSchema: z.object({
      query: z.string().describe('Skill to search for e.g. "telegram", "weather", "gmail"'),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ query, limit }) => {
      try {
        const { execSync } = await import('child_process');
        const output = execSync(
          `clawhub search "${query}" --limit ${limit} --no-input`,
          { timeout: 15000, encoding: 'utf-8' }
        );
        // parse output: "slug v1.0.0  Display Name  (score)"
        const results = output.trim().split('\n').map(line => {
          const match = line.match(/^(\S+)\s+v[\d.]+\s+(.+?)\s+\([\d.]+\)/);
          return match ? { slug: match[1], name: match[2].trim() } : null;
        }).filter(Boolean);
        return { results };
      } catch (err: any) {
        return { results: [], error: err.message };
      }
    },
  }),

  clawhub_read_skill: tool({
    description: 'Download and read a ClawHub skill contents including all reference files. Use after clawhub_search to study a skill before writing your own version.',
    inputSchema: z.object({
      slug: z.string().describe('The ClawHub skill slug to read'),
    }),
    execute: async ({ slug }) => {
      try {
        const { execSync } = await import('child_process');
        const os = await import('os');

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawhub-preview-'));
        const skillsDir = path.join(tmpDir, 'skills');

        // 👇 --force skips the VirusTotal interactive prompt
        execSync(
          `clawhub install ${slug} --workdir "${tmpDir}" --force --no-input`,
          { timeout: 30000, encoding: 'utf-8' }
        );

        // find the installed skill folder (may have version suffix)
        if (!fs.existsSync(skillsDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          return { error: `Skills directory not created for ${slug}` };
        }

        const installedDirs = fs.readdirSync(skillsDir).filter(d => d.startsWith(slug));
        if (!installedDirs.length) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          return { error: `Skill ${slug} not found after install` };
        }

        const skillDir = path.join(skillsDir, installedDirs[0]);
        const result: Record<string, string> = {};

        // Read SKILL.md
        const skillMdPath = path.join(skillDir, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
          result['SKILL.md'] = fs.readFileSync(skillMdPath, 'utf-8').slice(0, 1500);
        }

        // Read all files in references/ folder
        const refsDir = path.join(skillDir, 'references');
        if (fs.existsSync(refsDir)) {
          const refFiles = fs.readdirSync(refsDir).filter(f => f.endsWith('.md'));
          let refTokenBudget = 3000; // total chars for all refs combined

          for (const refFile of refFiles) {
            if (refTokenBudget <= 0) break;
            const content = fs.readFileSync(path.join(refsDir, refFile), 'utf-8');
            const chunk = content.slice(0, Math.min(refTokenBudget, 1000));
            result[`references/${refFile}`] = chunk;
            refTokenBudget -= chunk.length;
          }
        }

        fs.rmSync(tmpDir, { recursive: true, force: true });

        return {
          slug,
          files: result,
          fileList: Object.keys(result),
        };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  delete_file: tool({
    description: 'Delete a file or empty directory from the project. Use to clean up wrong files or restructure the project.',
    inputSchema: z.object({
      project_id: z.string(),
      file_path: z.string().describe('Path relative to .openclaw/ e.g. "skills/old-skill/SKILL.md"'),
    }),
    execute: async ({ project_id, file_path }) => {
      const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');
      const fullPath = path.join(PROJECTS_ROOT, project_id, '.openclaw', file_path);
      // safety: must stay inside project dir
      if (!fullPath.startsWith(path.join(PROJECTS_ROOT, project_id))) {
        return { success: false, error: 'Path traversal rejected' };
      }
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return { success: true, deleted: file_path };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  }),

  move_file: tool({
    description: 'Move or rename a file/folder inside the project. Use to restructure skills or rename agents.',
    inputSchema: z.object({
      project_id: z.string(),
      from: z.string().describe('Source path relative to .openclaw/'),
      to: z.string().describe('Destination path relative to .openclaw/'),
    }),
    execute: async ({ project_id, from, to }) => {
      const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');
      const base = path.join(PROJECTS_ROOT, project_id, '.openclaw');
      const fromPath = path.join(base, from);
      const toPath = path.join(base, to);
      if (!fromPath.startsWith(base) || !toPath.startsWith(base)) {
        return { success: false, error: 'Path traversal rejected' };
      }
      try {
        fs.mkdirSync(path.dirname(toPath), { recursive: true });
        fs.renameSync(fromPath, toPath);
        return { success: true, moved: `${from} → ${to}` };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  }),
  create_directory: tool({
    description: 'Create a directory (and any parent directories) inside the project. Use before write_file if the parent folder does not exist yet.',
    inputSchema: z.object({
      project_id: z.string(),
      dir_path: z.string().describe('Path relative to .openclaw/ e.g. "wakebot/skills/telegram"'),
    }),
    execute: async ({ project_id, dir_path }) => {
      const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');
      const fullPath = path.join(PROJECTS_ROOT, project_id, '.openclaw', dir_path);
      if (!fullPath.startsWith(path.join(PROJECTS_ROOT, project_id))) {
        return { success: false, error: 'Path traversal rejected' };
      }
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        return { success: true, created: dir_path };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  }),

  delete_directory: tool({
    description: 'Delete an entire directory and all its contents from the project. Use to remove a wrong workspace, skill folder, or restructure the project.',
    inputSchema: z.object({
      project_id: z.string(),
      dir_path: z.string().describe('Path relative to .openclaw/ e.g. "old-agent/skills"'),
    }),
    execute: async ({ project_id, dir_path }) => {
      const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');
      const base = path.join(PROJECTS_ROOT, project_id, '.openclaw');
      const fullPath = path.join(base, dir_path);
      // safety: never allow deleting the root .openclaw dir itself
      if (!fullPath.startsWith(base) || fullPath === base) {
        return { success: false, error: 'Cannot delete project root or path traversal rejected' };
      }
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return { success: true, deleted: dir_path };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  }),

  run_bash: tool({
    description: 'Run a bash command inside the project .openclaw/ directory. Use for: validating JSON, running scripts, checking if binaries exist, testing file contents, installing npm packages, or any shell operation needed during project setup.',
    inputSchema: z.object({
      project_id: z.string(),
      command: z.string().describe('The bash command to run'),
      cwd: z.string().optional().describe('Subdirectory relative to .openclaw/ to run from. Defaults to .openclaw/ root.'),
    }),
    execute: async ({ project_id, command, cwd }) => {
      const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');
      const base = path.join(PROJECTS_ROOT, project_id, '.openclaw');
      const runDir = cwd ? path.join(base, cwd) : base;

      // safety: must stay inside project
      if (!runDir.startsWith(path.join(PROJECTS_ROOT, project_id))) {
        return { success: false, error: 'Path traversal rejected' };
      }

      // block destructive system commands
      const BLOCKED = ['rm -rf /', 'mkfs', 'dd if=', 'shutdown', 'reboot', ':(){:|:&};:'];
      if (BLOCKED.some(b => command.includes(b))) {
        return { success: false, error: 'Blocked dangerous command' };
      }

      try {
        fs.mkdirSync(runDir, { recursive: true });
        const { stdout, stderr } = await execAsync(command, {
          cwd: runDir,
          timeout: 30000,       // 30s max
          maxBuffer: 1024 * 64, // 64kb output cap
          env: { ...process.env, HOME: runDir }, // isolate HOME
        });
        return {
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim() || undefined,
        };
      } catch (err: any) {
        return {
          success: false,
          stdout: err.stdout?.trim() || '',
          stderr: err.stderr?.trim() || err.message,
        };
      }
    },
  }),

  validate_json: tool({
    description: 'Validate that a JSON file is syntactically correct. Always use this after writing openclaw.json to catch errors before the user runs the project.',
    inputSchema: z.object({
      project_id: z.string(),
      file_path: z.string().describe('Path relative to .openclaw/ e.g. "openclaw.json"'),
    }),
    execute: async ({ project_id, file_path }) => {
      const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');
      const fullPath = path.join(PROJECTS_ROOT, project_id, '.openclaw', file_path);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        JSON.parse(content);
        return { valid: true, message: 'JSON is valid ✅' };
      } catch (err: any) {
        return { valid: false, error: err.message };
      }
    },
  }),

  check_binary: tool({
    description: 'Check if a required binary/CLI tool exists on the system PATH. Use before writing skills that require bins like curl, node, ffmpeg, python3, clawhub, etc.',
    inputSchema: z.object({
      binary: z.string().describe('Binary name to check e.g. "curl", "node", "ffmpeg"'),
    }),
    execute: async ({ binary }) => {
      try {
        const { stdout } = await execAsync(`which ${binary}`);
        const version = await execAsync(`${binary} --version 2>&1`).catch(() => ({ stdout: 'unknown' }));
        return {
          found: true,
          path: stdout.trim(),
          version: version.stdout.split('\n')[0].trim(),
        };
      } catch {
        return { found: false, message: `${binary} not found on PATH` };
      }
    },
  }),

};
