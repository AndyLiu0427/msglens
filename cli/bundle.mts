/**
 * Release prep for the MCP listings, after `pnpm cli:build`:
 * - syncs cli/server.json (official MCP Registry) to package.json's version
 * - packs cli/msglens-<version>.mcpb, the bundle Smithery and Claude Desktop
 *   install for a local server
 *
 * Run: pnpm cli:bundle
 */

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { TOOLS } from "./src/mcp.ts";

const dir = new URL(".", import.meta.url).pathname;
const read = (file: string) => JSON.parse(readFileSync(`${dir}${file}`, "utf8"));
const pkg = read("package.json");

const server = read("server.json");
server.version = pkg.version;
server.packages[0].version = pkg.version;
writeFileSync(`${dir}server.json`, `${JSON.stringify(server, null, 2)}\n`);

const stage = `${dir}.mcpb/`;
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage);
for (const file of ["dist", "package.json", "LICENSE", "README.md"]) cpSync(`${dir}${file}`, `${stage}${file}`, { recursive: true });
cpSync(`${dir}../src/app/apple-icon.png`, `${stage}icon.png`);
writeFileSync(
  `${stage}manifest.json`,
  JSON.stringify(
    {
      manifest_version: "0.3",
      name: "msglens",
      display_name: "MsgLens",
      version: pkg.version,
      description: "Read Outlook .msg, .eml and winmail.dat files locally: headers, body and attachments.",
      long_description:
        "Lets the assistant open email files on your computer. Recovers message bodies Outlook stored only as compressed RTF, unpacks winmail.dat, reads saved appointments and contacts, saves attachments and converts to .eml or .txt. Files are parsed locally; nothing is uploaded.",
      author: { name: pkg.author, url: pkg.homepage },
      repository: { type: "git", url: "https://github.com/AndyLiu0427/msglens.git" },
      homepage: pkg.homepage,
      support: pkg.bugs,
      icon: "icon.png",
      license: pkg.license,
      keywords: ["outlook", "msg", "eml", "winmail.dat", "email", "attachments"],
      server: {
        type: "node",
        entry_point: "dist/cli.js",
        mcp_config: { command: "node", args: ["${__dirname}/dist/cli.js", "mcp"] },
      },
      tools: TOOLS.map(({ name, description }) => ({ name, description })),
      compatibility: { platforms: ["darwin", "win32", "linux"], runtimes: { node: pkg.engines.node } },
    },
    null,
    2,
  ),
);

execFileSync("npm", ["install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"], {
  cwd: stage,
  stdio: "inherit",
});
execFileSync("npx", ["-y", "@anthropic-ai/mcpb@2", "pack", stage, `${dir}msglens-${pkg.version}.mcpb`], {
  stdio: "inherit",
});
