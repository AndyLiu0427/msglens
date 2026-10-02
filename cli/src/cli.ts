#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { basename, extname } from "node:path";
import { parseArgs } from "node:util";
import { parseFile, toEml, toText, type ParsedEmail } from "./index";
import { safeName, writeUnique } from "./files";
import { terminalSafe } from "./text";

const USAGE = `msglens: read Outlook .msg, .eml and winmail.dat files

Usage:
  msglens read <file...> [--json]            print headers and the plain-text body
  msglens attachments <file...> [-o <dir>]   save every attachment
  msglens convert <file...> --to eml|txt [-o <dir>]

Files are parsed on this machine; nothing is uploaded.
Viewer in the browser: https://msglens.app`;

/** Attachment bytes would bury the JSON; the size stays, the content goes. */
function toJson(email: ParsedEmail) {
  return {
    ...email,
    sourceFile: undefined,
    attachments: email.attachments.map((a) => ({ ...a, content: undefined })),
  };
}

async function main(): Promise<number> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      out: { type: "string", short: "o", default: "." },
      to: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  const [command, ...files] = positionals;

  if (values.help || !command || files.length === 0) {
    console.log(USAGE);
    return values.help ? 0 : 1;
  }
  if (!["read", "attachments", "convert"].includes(command)) {
    console.error(`msglens: unknown command "${command}"\n\n${USAGE}`);
    return 1;
  }
  if (command === "convert" && values.to !== "eml" && values.to !== "txt") {
    console.error("msglens: convert needs --to eml or --to txt");
    return 1;
  }
  if (command !== "read") await mkdir(values.out, { recursive: true });

  // One bad file in a batch of hundreds should not stop the rest.
  let failed = 0;
  const parsed: ParsedEmail[] = [];
  for (const file of files) {
    try {
      const email = await parseFile(file);
      if (command === "read") {
        if (values.json) parsed.push(email);
        else {
          if (files.length > 1) console.log(`==> ${terminalSafe(file)} <==`);
          console.log(terminalSafe(await toText(email)));
        }
      } else if (command === "attachments") {
        for (const [i, att] of email.attachments.entries()) {
          console.log(await writeUnique(values.out, safeName(att.fileName, `attachment-${i + 1}`), att.content));
        }
      } else {
        const stem = safeName(basename(file, extname(file)), "message");
        const data = values.to === "eml" ? await toEml(email) : await toText(email);
        console.log(await writeUnique(values.out, `${stem}.${values.to}`, data));
      }
    } catch (err) {
      failed++;
      console.error(`msglens: ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (values.json) {
    const out = files.length === 1 ? parsed.map(toJson)[0] : parsed.map(toJson);
    if (out) console.log(JSON.stringify(out, null, 2));
  }
  return failed ? 1 : 0;
}

// exitCode, not exit(): exit() can cut off a large JSON write to a pipe.
main().then(
  (code) => (process.exitCode = code),
  (err) => {
    console.error(`msglens: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  },
);
