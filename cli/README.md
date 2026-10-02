# msglens

Read Outlook `.msg`, `.eml` and `winmail.dat` files from the command line or
from Node. Headers, the message body and attachments, with no Outlook and
nothing uploaded.

These are the same parsers that run in the browser at
[msglens.app](https://msglens.app).

```bash
npx msglens read message.msg
```

## Why another .msg parser

Most real Outlook mail does not store its body as HTML or plain text. In a
sample of 20 business `.msg` files, 17 kept the body only in
`PidTagRtfCompressed`: compressed RTF with the original HTML wrapped inside it
(MS-OXRTFCP and MS-OXRTFEX). A parser that reads `PidTagHtml` and
`PidTagBody` and stops returns an empty body for those messages. This one
decompresses the RTF and un-wraps the HTML, falling back through
`PidTagHtml`, `PidTagBodyHtml`, compressed RTF and `PidTagBody` in that order.

It also:

- detects the format from the bytes, so a renamed file still opens
- unpacks `winmail.dat` (TNEF), including the attachments trapped inside it
- decodes non-Latin bodies with the message's declared code page
- reads saved appointments and contacts, not only mail

## CLI

```text
msglens read <file...> [--json]            print headers and the plain-text body
msglens attachments <file...> [-o <dir>]   save every attachment
msglens convert <file...> --to eml|txt [-o <dir>]
```

- `read --json` prints the full parsed message (one object for one file, an
  array for several). Attachment bytes are left out; names, types and sizes
  stay.
- `attachments` and `convert` never overwrite: a second `invoice.pdf` is
  saved as `invoice (1).pdf`. Attachment names are reduced to a plain file
  name, so a message cannot write outside the output folder.
- Several files at once work, and a file that fails is reported without
  stopping the rest. The exit code is 1 if any file failed.

Convert a folder of `.msg` files to `.eml`:

```bash
npx msglens convert ./mail/*.msg --to eml -o ./eml
```

## Library

```ts
import { parseFile, parse, toEml, toText } from "msglens";

const email = await parseFile("message.msg");
email.subject;          // string
email.from;             // { name, address } | null
email.date;             // Date | null
email.bodyText;         // plain text, always filled
email.body;             // HTML when email.bodyKind === "html"
email.attachments;      // [{ fileName, mimeType, size, content: Uint8Array, isEmbeddedMessage, ... }]

const again = await parse(bytes, "message.msg"); // from a Uint8Array or ArrayBuffer
const eml = await toEml(email);                   // RFC 822 text
```

`email.body` is the message's HTML exactly as the sender wrote it. It is
untrusted: sanitise it (for example with DOMPurify) before rendering it
anywhere.

An attachment with `isEmbeddedMessage: true` is a message attached to a
message; pass its `content` to `parse()` to read it.

Requires Node 20 or later.

## Want to just look at a file?

[msglens.app](https://msglens.app) opens `.msg`, `.eml` and `winmail.dat`
in the browser, parsed on your device, with attachments and PDF export.

## Licence

MIT. Microsoft and Outlook are trademarks of Microsoft Corporation; this
project is not affiliated with Microsoft.
