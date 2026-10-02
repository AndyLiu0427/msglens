# MsgLens — a .msg / .eml / winmail.dat viewer that never uploads your files

A browser-based viewer for Outlook `.msg`, standard `.eml` and `winmail.dat`
(TNEF) email files.
Everything — container parsing, RTF decompression, HTML sanitisation, ZIP
creation, PDF export — runs client-side. There is no backend, which is what
makes "your file is never uploaded" a structural fact rather than a promise.

## Why this exists

Checked against the three tools that rank for this query, 30 September 2026,
by reading their pages and upload code (no file was uploaded):

| | Uploads your file | Scope |
| --- | --- | --- |
| coolutils.com | Yes — to `service5.coolutils.org`; says uploads are deleted within 24 hours; 50 MB | converter (PDF, DOC, HTML, JPG, TXT) |
| encryptomatic.com | Yes — `multipart/form-data`, 75 MB cap | viewer: .msg, .eml, winmail.dat, attachments |
| msg-viewer.pages.dev | **No** — in-browser, open source | .msg, with attachment handling |

So the "they all upload it" line is not true, and this README used to say it
was. One of the three is genuinely local. The same comparison, kept current,
is on the site at `/msg-viewer-comparison/`.

What is left is a real split. Against the two hosted converters, the argument
is that business email should not be posted to an unknown server to be read.
Against the local one, it is the other formats: .eml and winmail.dat.

The technical claim underneath all of it: Outlook usually stores the body only
as *compressed RTF* with the original HTML encapsulated inside it
([MS-OXRTFEX]). Against a corpus of 20 real business `.msg` files, **17 were
RTF-only** — a viewer that reads `PidTagHtml` and gives up renders nothing for
85% of them. That number is measured. Whether any particular competitor
handles that case is **not** tested here, and saying otherwise would need
uploading a message to them to find out.

`winmail.dat` used to be the one thing encryptomatic did that this did not.
It now reads those too — see below.

## What it does

- **Reads `.msg`, `.eml` and `winmail.dat`**, detected by magic bytes rather
  than extension, so a renamed file still opens.
- **Unpacks `winmail.dat` (TNEF)** — the file people receive when Outlook sent
  in Rich Text and the receiving server could not unpack it. The formatted body
  and *every real attachment* are trapped inside it; this pulls them back out.
  Note that TNEF carries the sender but not the recipient list — those stayed
  in the carrying message's own headers, which the file does not contain, so
  To/Cc show as empty rather than guessed.
- **Recovers the body through the full fallback chain** — `PidTagHtml` →
  `PidTagBodyHtml` → de-encapsulated `PidTagRtfCompressed` → `PidTagBody`.
- **Resolves `cid:` inline images** against the message's own attachments.
- **Keeps the message's own stylesheets.** Outlook writes formatting into
  `<head><style>`, not inline attributes; a viewer that keeps only the body
  fragment silently drops table borders, fonts and colours from most real mail.
- **Blocks remote images by default** so opening a message cannot fire a
  tracking pixel, with a per-message opt-in.
- **Decodes non-Latin bodies** using the code page declared in
  `PidTagInternetCodepage` instead of assuming UTF-8.
- **Extracts attachments** individually or as a ZIP; opens embedded `.msg`
  attachments in place.
- **Exports** to `.eml`, `.txt` and PDF. Printing opens a dedicated print document
  rather than printing the app, because iframe content cannot paginate across
  printed pages — printing the page directly clips anything over one sheet.
- **Shows raw internet headers** — for IT, deliverability and discovery work.
- Multi-file, keyboard-navigable, dark mode, English + Traditional Chinese.

## Architecture

```
src/lib/email/
  parse.ts        format detection + unified entry point
  parseMsg.ts     MS-OXMSG → ParsedEmail
  parseEml.ts     RFC 822 / MIME → ParsedEmail
  tnef.ts         MS-OXTNEF (winmail.dat) → ParsedEmail (dependency-free)
  rtf.ts          MS-OXRTFEX de-encapsulation (dependency-free, from spec)
  sanitize.ts     DOMPurify + cid: resolution + remote-image deferral
  export.ts       .eml / .txt / ZIP builders
  print.ts        standalone print document (pagination + theme isolation)
  headers.ts      RFC 2047 decoding, address parsing
  useMessages.ts  intake, sequential parsing, selection, errors
```

The parsing libraries are all behind dynamic `import()`, so none of them land
in the initial bundle — the landing page stays light for the search traffic
that never opens a file.

### npm package and CLI

`cli/` builds the `msglens-cli` npm package from the same `src/lib/email` parsers,
so the site and the package cannot drift apart:

```bash
pnpm cli:build
node cli/dist/cli.js read public/sample-message.msg
```

Node is not a browser, and the package fills the gaps: Node decodes
windows-1252 bytes 0x80-0x9F as control characters (RTF quotes and dashes
vanish), so the bundle injects a WHATWG-correct `TextDecoder`; and there is no
`DOMParser`, so `cli/src/text.ts` derives the plain-text body. See
[cli/README.md](cli/README.md) for usage.

### Security model for message bodies

Message HTML is fully untrusted and gets three independent layers:

1. **DOMPurify** sanitises it before it reaches the DOM.
2. It renders inside an **iframe whose `sandbox` deliberately omits
   `allow-scripts`**, so no JavaScript can execute inside it at all. The frame
   also gives the message its own CSS scope — real email ships `<style>` blocks
   with global selectors that would otherwise restyle the app shell.
   `allow-same-origin` is present only so the parent can measure content height
   and so `blob:` inline images resolve; it is not an escape hatch without
   `allow-scripts`.
3. A **CSP meta tag inside the frame** enforces the remote-content policy even
   if an `src` slipped past the attribute rewrite.

## Development

```bash
pnpm install
pnpm dev
```

Verify the parser against real files. It reports structure only — which body
property won, byte counts, attachment counts — and never message contents, so
it is safe to point at a real mail archive:

```bash
pnpm verify:parse /path/to/msg-files
```

It accepts `.msg`, `.eml` and `.dat`.

### Tests

```bash
pnpm test
```

96 tests over the parsing and sanitising layers, run under jsdom. Fixtures are
built in memory by `test/helpers/buildMsg.ts` and `test/helpers/buildTnef.ts`
rather than checked in as binaries, so each test shows the exact properties it exercises and a new case
does not mean regenerating a blob.

Two environment notes worth knowing before chasing a failure:

- **jsdom, not happy-dom.** `sanitizeBody` runs DOMPurify with
  `WHOLE_DOCUMENT` + `RETURN_DOM` so `<head><style>` survives, and happy-dom
  rejects a document with more than one root element.
- **Node's `windows-1252` is not the browser's.** Node uses ICU's IANA
  flavour, which leaves the C1 range alone; browsers implement the WHATWG
  Encoding Standard, where 0x92 is a right single quote. Production runs in a
  browser and is correct. `test/rtf.test.ts` documents the divergence rather
  than asserting either side.

Uncovered by design: `print.ts` and `useMessages.ts` are a print window and a
React hook, both verified against the live site instead.

### Generated assets

`public/sample-message.msg` and `src/app/apple-icon.png` are generated, not
hand-made. Regenerate both after changing the sample content or the mark:

```bash
pnpm assets
```

The sample is written as a real Compound File in MS-OXMSG layout rather than
being an `.eml`, so the "try it with a sample message" demo goes through the
same parser a user's file does — recipients and attachments as sub-storages, a
`cid:` inline image, a body in a MAPI property stream. It doubles as a fixture
with no personal data in it. Its contents are entirely fictional.

## Deploying to Cloudflare Pages

For local builds, copy the environment file first:

```bash
cp .env.example .env.local
```

Pushing to `main` builds and deploys automatically through the Pages project's
Git integration.

The build environment does **not** inherit `.env.local` — it is gitignored, and
deliberately so. These have to be set under the Pages project's
**Settings → Variables and secrets** (Production):

| Variable | Why it matters |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Missing, canonical URLs, hreflang, the sitemap and robots.txt all silently fall back to the placeholder domain. Nothing errors. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Optional. The publisher id is committed as the default, because it is public and an unset variable silently removed the verification snippet from the live site twice. Set it only to override. |
| `NODE_VERSION` | Next 16 needs Node 20.9+. Pinning it avoids a confusing failure if the default image moves. |

Framework preset is **None**. The Next.js preset targets `@cloudflare/next-on-pages`
for SSR on Workers, which is the wrong build entirely for a static export.

A manual deploy still works and bypasses Git, which is useful for testing a
build without committing:

```bash
pnpm build && npx wrangler pages deploy out
```

`public/_headers` applies the CSP, HSTS and cache rules on deploy.

## Enabling ads

`NEXT_PUBLIC_ADSENSE_CLIENT` is empty by default, and while it is empty no ad
script loads and no placeholder boxes render — so the site is presentable
during the AdSense review.

Once approved, set the publisher id and replace the placeholder `slot` values
in the `<AdSlot>` usages (`HomePage.tsx`, `ArticlePage.tsx`, `LegalPages.tsx`,
`Viewer.tsx`) with the real ad unit ids.

Slots reserve their final height before the network fills them, so ads do not
contribute to cumulative layout shift.

**Before submitting for review**, the site already provides what AdSense checks
for: substantial original content (four long-form guides plus an FAQ), a
privacy policy that discloses advertising cookies and links to Google's opt-out
controls, terms of use, and working navigation in both locales.

## Adding a locale

1. Copy `src/lib/i18n/en.ts` to `<code>.ts` and translate. The `Dictionary`
   type will flag anything missing.
2. Copy `src/content/en.tsx` and translate the long-form pages.
3. Add the code to `LOCALES` in `src/lib/site.ts`.
4. Add a root layout and page tree under `src/app/(<code>)/<code>/`, mirroring
   `src/app/(zh)/zh/`. A separate root layout per locale is what lets each tree
   emit its own `<html lang>`.

## Licence and trademarks

MIT — see [LICENSE](LICENSE). That covers the code, including the parsers.
The MsgLens name and logo are not part of the grant; a licence to copyright is
not a licence to a trade mark, so fork it under your own name.

Microsoft, Outlook and Exchange are trademarks of Microsoft Corporation. This
project is not affiliated with, endorsed by or sponsored by Microsoft.
