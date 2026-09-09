/**
 * Generates the sample .msg served by the "Try a sample message" button.
 *
 * Run: npx tsx scripts/make-sample-msg.mts
 * Output: public/sample-message.msg
 *
 * Written as a real Compound File in MS-OXMSG layout rather than shipping an
 * .eml, so the demo exercises the actual .msg code path — recipients and
 * attachments as sub-storages, a cid: inline image, and a body the viewer has
 * to pull out of a MAPI property stream. It doubles as a fixture with no
 * personal data in it.
 *
 * Layout reference: [MS-OXMSG] §2.1 (storage/stream naming) and §2.4 (the
 * property stream: a 32-byte header on the message, 8 bytes on sub-storages,
 * then 16 bytes per property).
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import CFB from "cfb";
import { renderMark } from "./lib/png.mts";

// ---------------------------------------------------------------- property types

const PT_INT32 = 0x0003;
const PT_BOOLEAN = 0x000b;
const PT_TIME = 0x0040;
const PT_STRING = 0x001f; // PtypString — UTF-16LE
const PT_BINARY = 0x0102;

type PropValue =
  | { type: typeof PT_STRING; value: string }
  | { type: typeof PT_BINARY; value: Buffer }
  | { type: typeof PT_INT32; value: number }
  | { type: typeof PT_BOOLEAN; value: boolean }
  | { type: typeof PT_TIME; value: Date };

const str = (value: string): PropValue => ({ type: PT_STRING, value });
const bin = (value: Buffer): PropValue => ({ type: PT_BINARY, value });
const i32 = (value: number): PropValue => ({ type: PT_INT32, value });
const bool = (value: boolean): PropValue => ({ type: PT_BOOLEAN, value });
const time = (value: Date): PropValue => ({ type: PT_TIME, value });

/** Windows FILETIME: 100ns ticks since 1601-01-01. */
function toFileTime(date: Date): Buffer {
  const ticks = (BigInt(date.getTime()) + 11644473600000n) * 10000n;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(ticks);
  return buf;
}

/** `__substg1.0_` stream name: property id then type, uppercase hex. */
function substgName(id: number, type: number): string {
  return `__substg1.0_${id.toString(16).toUpperCase().padStart(4, "0")}${type
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;
}

interface BuiltProps {
  /** Stream name -> payload, for the variable-length properties. */
  streams: Map<string, Buffer>;
  /** 16-byte entries for __properties_version1.0. */
  entries: Buffer[];
}

function buildProps(props: Map<number, PropValue>): BuiltProps {
  const streams = new Map<string, Buffer>();
  const entries: Buffer[] = [];

  for (const [id, prop] of props) {
    const entry = Buffer.alloc(16);
    entry.writeUInt16LE(prop.type, 0);
    entry.writeUInt16LE(id, 2);
    // Flags: PROPATTR_MANDATORY | PROPATTR_READABLE | PROPATTR_WRITABLE.
    entry.writeUInt32LE(0x00000007, 4);

    switch (prop.type) {
      case PT_STRING: {
        const payload = Buffer.from(prop.value, "utf16le");
        streams.set(substgName(id, prop.type), payload);
        // Size counts the terminating null that is not stored in the stream.
        entry.writeUInt32LE(payload.length + 2, 8);
        break;
      }
      case PT_BINARY: {
        streams.set(substgName(id, prop.type), prop.value);
        entry.writeUInt32LE(prop.value.length, 8);
        break;
      }
      case PT_INT32:
        entry.writeInt32LE(prop.value, 8);
        break;
      case PT_BOOLEAN:
        entry.writeUInt32LE(prop.value ? 1 : 0, 8);
        break;
      case PT_TIME:
        toFileTime(prop.value).copy(entry, 8);
        break;
    }
    entries.push(entry);
  }

  return { streams, entries };
}

/**
 * @param header extra bytes between the 8 reserved bytes and the entries.
 *        The message root carries recipient/attachment counts here; recipient
 *        and attachment storages carry nothing.
 */
function propertyStream(built: BuiltProps, header: Buffer): Buffer {
  return Buffer.concat([Buffer.alloc(8), header, ...built.entries]);
}

// ---------------------------------------------------------------- sample content

const SENT = new Date("2026-03-12T09:24:00Z");
const CID = "msglens-logo@sample";

const HTML_BODY = `<html><head><style type="text/css">
body { font-family: Aptos, Calibri, sans-serif; font-size: 11pt; color: #201f1e; }
table.rates { border-collapse: collapse; margin: 14px 0; font-size: 10.5pt; }
table.rates th, table.rates td { border: 1px solid #d0d0d6; padding: 6px 12px; text-align: left; }
table.rates th { background: #f3f2f1; }
.sig { color: #605e5c; font-size: 10pt; line-height: 1.5; }
</style></head><body>
<p>Hi Sam,</p>
<p>Thanks for pulling the Q3 numbers together. I have gone through the supplier
review and there are three things worth flagging before Thursday:</p>
<ol>
  <li><b>Lead times slipped on the Northwind line.</b> Average went from 12 to
      18 days in August. Their ops lead says it is a warehouse move and should
      settle by October — worth holding them to that in writing.</li>
  <li><b>The Contoso rate card expires 30 September.</b> Renewal at the current
      tier needs volume confirmation two weeks out, so we should decide by the
      15th.</li>
  <li><b>We are over-indexed on a single freight partner</b> — 71% of shipments.
      I would like to bring a second one in before peak season.</li>
</ol>
<p>Current rate comparison for reference:</p>
<table class="rates">
  <tr><th>Supplier</th><th>Unit rate</th><th>Lead time</th><th>Contract ends</th></tr>
  <tr><td>Northwind Traders</td><td>$14.20</td><td>18 days</td><td>31 Dec 2026</td></tr>
  <tr><td>Contoso Supply</td><td>$13.85</td><td>11 days</td><td>30 Sep 2026</td></tr>
  <tr><td>Fabrikam Logistics</td><td>$15.40</td><td>9 days</td><td>30 Jun 2027</td></tr>
</table>
<p>Full breakdown is in the attached CSV. Happy to walk through it before the
meeting if that is easier &mdash; I am free Wednesday afternoon.</p>
<p>Best,<br>Dana</p>
<p class="sig">
  <img src="cid:${CID}" width="44" height="44" alt="MsgLens" style="vertical-align:middle;margin-right:10px"><br>
  <b>Dana Whitfield</b><br>
  Procurement Lead &middot; Northwind Traders<br>
  dana.whitfield@northwind.example &middot; +1 555 0134
</p>
<p style="font-size:9pt;color:#a19f9d">
  This is a sample message created to demonstrate MsgLens. Every name, address
  and figure in it is fictional.
</p>
</body></html>`;

const TEXT_BODY = `Hi Sam,

Thanks for pulling the Q3 numbers together. I have gone through the supplier
review and there are three things worth flagging before Thursday:

1. Lead times slipped on the Northwind line. Average went from 12 to 18 days
   in August.
2. The Contoso rate card expires 30 September.
3. We are over-indexed on a single freight partner - 71% of shipments.

Full breakdown is in the attached CSV.

Best,
Dana

Dana Whitfield
Procurement Lead - Northwind Traders
dana.whitfield@northwind.example

This is a sample message created to demonstrate MsgLens. Every name, address
and figure in it is fictional.`;

const HEADERS = [
  "Received: from mail.northwind.example (mail.northwind.example [203.0.113.24])",
  "\tby mx.example.com with ESMTPS id 4Wq2pK1xyzL",
  "\tfor <sam.okafor@example.com>; Thu, 12 Mar 2026 09:24:07 +0000 (UTC)",
  "Authentication-Results: mx.example.com; dkim=pass header.d=northwind.example;",
  "\tspf=pass smtp.mailfrom=northwind.example; dmarc=pass",
  "From: Dana Whitfield <dana.whitfield@northwind.example>",
  "To: Sam Okafor <sam.okafor@example.com>",
  "Subject: Q3 supplier review - notes before Thursday",
  "Date: Thu, 12 Mar 2026 09:24:00 +0000",
  "Message-ID: <a41f9c02-7d3e-4b18-9f61-2c8ad5e77b10@northwind.example>",
  "MIME-Version: 1.0",
  'Content-Type: multipart/related; boundary="_004_sample_"',
  "X-Sample-Note: Generated by scripts/make-sample-msg.mts for demonstration",
  "",
].join("\r\n");

const CSV_ATTACHMENT = [
  "Supplier,Unit rate (USD),Lead time (days),Contract ends,Share of volume",
  "Northwind Traders,14.20,18,2026-12-31,38%",
  "Contoso Supply,13.85,11,2026-09-30,31%",
  "Fabrikam Logistics,15.40,9,2027-06-30,22%",
  "Adventure Works,16.05,14,2027-03-31,9%",
  "",
  "Note: sample data. Every supplier and figure here is fictional.",
].join("\r\n");

// ---------------------------------------------------------------- assemble

// Same mark as the app icon, sized for an email signature.
const logoPng = renderMark({ size: 88, cornerRatio: 0.22 });

const messageProps = new Map<number, PropValue>([
  [0x001a, str("IPM.Note")], // PidTagMessageClass
  [0x0037, str("Q3 supplier review - notes before Thursday")], // PidTagSubject
  [0x0e1d, str("Q3 supplier review - notes before Thursday")], // PidTagNormalizedSubject
  [0x0c1a, str("Dana Whitfield")], // PidTagSenderName
  [0x0c1e, str("SMTP")], // PidTagSenderAddressType
  [0x0c1f, str("dana.whitfield@northwind.example")], // PidTagSenderEmailAddress
  [0x5d01, str("dana.whitfield@northwind.example")], // PidTagSenderSmtpAddress
  [0x1000, str(TEXT_BODY)], // PidTagBody
  [0x1013, bin(Buffer.from(HTML_BODY, "utf8"))], // PidTagHtml
  [0x007d, str(HEADERS)], // PidTagTransportMessageHeaders
  [0x3fde, i32(65001)], // PidTagInternetCodepage — UTF-8
  [0x0039, time(SENT)], // PidTagClientSubmitTime
  [0x0e06, time(new Date(SENT.getTime() + 7000))], // PidTagMessageDeliveryTime
  [0x3007, time(SENT)], // PidTagCreationTime
  [0x0017, i32(1)], // PidTagImportance — normal
  [0x0e07, i32(1)], // PidTagMessageFlags — read
]);

const recipientProps = new Map<number, PropValue>([
  [0x3001, str("Sam Okafor")], // PidTagDisplayName
  [0x3002, str("SMTP")], // PidTagAddressType
  [0x3003, str("sam.okafor@example.com")], // PidTagEmailAddress
  [0x39fe, str("sam.okafor@example.com")], // PidTagSmtpAddress
  [0x0c15, i32(1)], // PidTagRecipientType — To
  [0x3000, i32(0)], // PidTagRowid
]);

interface AttachmentSpec {
  fileName: string;
  extension: string;
  mimeType: string;
  data: Buffer;
  contentId?: string;
  hidden?: boolean;
}

const attachments: AttachmentSpec[] = [
  {
    fileName: "msglens-logo.png",
    extension: ".png",
    mimeType: "image/png",
    data: logoPng,
    contentId: CID,
    hidden: true, // inline body image, not a user-facing attachment
  },
  {
    fileName: "q3-supplier-rates.csv",
    extension: ".csv",
    mimeType: "text/csv",
    data: Buffer.from(CSV_ATTACHMENT, "utf8"),
  },
];

const container = CFB.utils.cfb_new({ root: "Root Entry" });

const addStream = (path: string, data: Buffer) => {
  CFB.utils.cfb_add(container, path, data);
};

// Message-level properties. Header after the 8 reserved bytes carries the
// next-id and count fields the reader uses to enumerate sub-storages.
const messageBuilt = buildProps(messageProps);
const messageHeader = Buffer.alloc(24);
messageHeader.writeUInt32LE(1, 0); // NextRecipientId
messageHeader.writeUInt32LE(attachments.length, 4); // NextAttachmentId
messageHeader.writeUInt32LE(1, 8); // RecipientCount
messageHeader.writeUInt32LE(attachments.length, 12); // AttachmentCount

addStream("/__properties_version1.0", propertyStream(messageBuilt, messageHeader));
for (const [name, data] of messageBuilt.streams) addStream(`/${name}`, data);

// Recipient 0.
const recipBuilt = buildProps(recipientProps);
addStream(
  "/__recip_version1.0_#00000000/__properties_version1.0",
  propertyStream(recipBuilt, Buffer.alloc(0)),
);
for (const [name, data] of recipBuilt.streams) {
  addStream(`/__recip_version1.0_#00000000/${name}`, data);
}

// Attachments.
attachments.forEach((att, index) => {
  const dir = `/__attach_version1.0_#${index.toString(16).toUpperCase().padStart(8, "0")}`;
  const props = new Map<number, PropValue>([
    [0x3704, str(att.fileName)], // PidTagAttachFilename
    [0x3707, str(att.fileName)], // PidTagAttachLongFilename
    [0x3703, str(att.extension)], // PidTagAttachExtension
    [0x370e, str(att.mimeType)], // PidTagAttachMimeTag
    [0x3701, bin(att.data)], // PidTagAttachDataBinary
    [0x0e21, i32(index)], // PidTagAttachNumber
    [0x0e20, i32(att.data.length)], // PidTagAttachSize
    [0x3705, i32(0)], // PidTagAttachMethod — by value
  ]);
  if (att.contentId) props.set(0x3712, str(att.contentId)); // PidTagAttachContentId
  if (att.hidden) props.set(0x7ffe, bool(true)); // PidTagAttachmentHidden

  const built = buildProps(props);
  addStream(`${dir}/__properties_version1.0`, propertyStream(built, Buffer.alloc(0)));
  for (const [name, data] of built.streams) addStream(`${dir}/${name}`, data);
});

// An empty named-property directory keeps readers that walk it from erroring.
addStream("/__nameid_version1.0/__substg1.0_00020102", Buffer.alloc(0));
addStream("/__nameid_version1.0/__substg1.0_00030102", Buffer.alloc(0));
addStream("/__nameid_version1.0/__substg1.0_00040102", Buffer.alloc(0));

const out = CFB.write(container, { type: "buffer" }) as Buffer;
mkdirSync("public", { recursive: true });
const target = join("public", "sample-message.msg");
writeFileSync(target, out);
console.log(`wrote ${target} — ${(out.length / 1024).toFixed(1)} KB`);
