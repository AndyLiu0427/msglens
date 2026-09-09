/**
 * Workspace metrics, read straight out of D1.
 *
 * Run: pnpm metrics  (add --local to read the miniflare database instead)
 *
 * There is no tracking behind any of this. Every number is a count of rows
 * that exist because a feature needed them — a user signed in, a file was
 * saved, an invite was accepted. Nothing here was collected for measurement,
 * which is why the anonymous viewer contributes nothing to it and why adding
 * this needed no change to the privacy policy.
 *
 * It deliberately prints no email addresses, names or subjects. Those are in
 * the database because the product needs them; a summary does not, and a
 * terminal is a bad place for them to end up.
 */

import { execFileSync } from "node:child_process";

const DB = "msglens";
const remote = !process.argv.includes("--local");

function query<T>(sql: string): T[] {
  const out = execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      DB,
      remote ? "--remote" : "--local",
      "--json",
      "--command",
      sql,
    ],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  // Wrangler prefixes the JSON with a banner on some versions; find the array.
  const start = out.indexOf("[");
  if (start < 0) throw new Error(`Unexpected wrangler output:\n${out}`);
  const parsed = JSON.parse(out.slice(start)) as Array<{ results: T[] }>;
  return parsed[0]?.results ?? [];
}

// The trailing comma is required: in a .mts file a bare `<T>` on an arrow
// function is ambiguous with JSX and TypeScript reserves the syntax.
const one = <T,>(sql: string): T => query<T>(sql)[0];

const DAY = 86400;
const now = Math.floor(Date.now() / 1000);

interface Row {
  [key: string]: number | string | null;
}

const totals = one<Row>(`
  SELECT
    (SELECT count(*) FROM users)                                        AS users,
    (SELECT count(*) FROM users WHERE created_at > ${now - 7 * DAY})     AS users_7d,
    (SELECT count(*) FROM users WHERE created_at > ${now - 30 * DAY})    AS users_30d,
    (SELECT count(*) FROM users WHERE last_seen_at > ${now - 7 * DAY})   AS returning_7d,
    (SELECT count(*) FROM sessions WHERE expires_at > ${now})            AS active_sessions,
    (SELECT count(*) FROM teams WHERE is_personal = 0)                   AS shared_teams,
    (SELECT count(*) FROM folders)                                       AS folders,
    (SELECT count(*) FROM files)                                         AS files,
    (SELECT count(*) FROM files WHERE uploaded_at > ${now - 7 * DAY})     AS files_7d,
    (SELECT coalesce(sum(size_bytes), 0) FROM files)                     AS bytes,
    (SELECT count(*) FROM invites)                                       AS invites,
    (SELECT count(*) FROM invites WHERE accepted_at IS NOT NULL)          AS invites_accepted,
    (SELECT coalesce(sum(open_count), 0) FROM files)                     AS opens,
    (SELECT count(*) FROM files WHERE open_count > 0)                    AS files_opened,
    (SELECT count(*) FROM files WHERE last_opened_at > ${now - 7 * DAY})  AS opened_7d
`);

const formats = query<Row>(`
  SELECT coalesce(source_format, '(unknown)') AS format, count(*) AS n
  FROM files GROUP BY 1 ORDER BY n DESC
`);

/**
 * Users who saved anything at all.
 *
 * The single most useful number here: signing in is easy and means nothing on
 * its own. Saving a file is the point at which someone decided the workspace
 * was worth using.
 */
const activated = one<Row>(`
  SELECT count(DISTINCT uploaded_by) AS n FROM files
`);

/**
 * Plans, read from the entitlements the webhook writes.
 *
 * `expires_at IS NULL` is lifetime and must be tested before any comparison —
 * the same NULL trap the entitlement check itself is built around, and the one
 * that would quietly report every lifetime customer as expired.
 */
const plans = query<Row>(`
  SELECT plan,
         sum(CASE WHEN status != 'expired'
                   AND (expires_at IS NULL OR expires_at > ${now})
                  THEN 1 ELSE 0 END) AS active,
         count(*) AS ever
  FROM entitlements GROUP BY plan ORDER BY ever DESC
`);

const teamSizes = query<Row>(`
  SELECT t.name, count(m.user_id) AS members,
         (SELECT count(*) FROM files WHERE team_id = t.id) AS files
  FROM teams t JOIN team_members m ON m.team_id = t.id
  WHERE t.is_personal = 0
  GROUP BY t.id ORDER BY members DESC, files DESC LIMIT 10
`);

const n = (v: unknown) => Number(v ?? 0);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const row = (label: string, value: string | number, note = "") =>
  console.log(`  ${label.padEnd(26)} ${String(value).padStart(8)}  ${note}`);

console.log(`\nMsgLens workspace — ${remote ? "production" : "local"}\n`);

console.log("People");
row("total accounts", n(totals.users));
row("new, last 7 days", n(totals.users_7d));
row("new, last 30 days", n(totals.users_30d));
row("seen in last 7 days", n(totals.returning_7d), pct(n(totals.returning_7d), n(totals.users)));
row("active sessions", n(totals.active_sessions));
row(
  "saved at least one file",
  n(activated.n),
  `${pct(n(activated.n), n(totals.users))} of accounts`,
);

console.log("\nContent");
row("files stored", n(totals.files));
row("saved, last 7 days", n(totals.files_7d));
row("total size", mb(n(totals.bytes)), `of 10 GB free tier`);
row("folders", n(totals.folders));
for (const f of formats) row(`  .${f.format}`, n(f.n), pct(n(f.n), n(totals.files)));

console.log("\nReading");
row("files opened, all time", n(totals.opens));
row(
  "files ever opened",
  n(totals.files_opened),
  `${pct(n(totals.files_opened), n(totals.files))} of stored — the rest were saved and never reread`,
);
row("opened in last 7 days", n(totals.opened_7d));

console.log("\nPlans");
if (!plans.length) {
  row("paying customers", 0, "nobody has bought yet");
} else {
  for (const p of plans) {
    row(`  ${p.plan}`, n(p.active), `${n(p.ever)} ever`);
  }
  row(
    "conversion",
    pct(
      plans.reduce((sum, p) => sum + n(p.active), 0),
      n(totals.users),
    ),
    "of accounts on a live plan",
  );
}

console.log("\nSharing");
row("shared teams", n(totals.shared_teams));
row("invites sent", n(totals.invites));
row(
  "invites accepted",
  n(totals.invites_accepted),
  pct(n(totals.invites_accepted), n(totals.invites)),
);
if (teamSizes.length) {
  console.log("\n  Largest shared teams");
  for (const t of teamSizes) {
    console.log(`    ${String(t.name).slice(0, 28).padEnd(30)} ${n(t.members)} members, ${n(t.files)} files`);
  }
}

console.log(
  "\nThe anonymous viewer contributes nothing here by design — it never talks\n" +
    "to the server, so there is nothing about it to count.\n",
);
