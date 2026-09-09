/**
 * Builds `.msg` files in memory for tests.
 *
 * Tests construct exactly the message they need rather than depending on
 * checked-in binaries: a fixture file cannot show you which property it is
 * testing, and adding a new case would mean regenerating and re-committing a
 * blob. Everything here is fictional by construction.
 *
 * Layout per [MS-OXMSG]: property streams named `__substg1.0_<ID><TYPE>`, a
 * `__properties_version1.0` stream of 16-byte entries, and sub-storages for
 * recipients and attachments.
 */

import CFB from "cfb";

export const PT_INT32 = 0x0003;
export const PT_BOOLEAN = 0x000b;
export const PT_TIME = 0x0040;
export const PT_STRING = 0x001f;
export const PT_BINARY = 0x0102;

export type PropValue =
  | { type: typeof PT_STRING; value: string }
  | { type: typeof PT_BINARY; value: Uint8Array }
  | { type: typeof PT_INT32; value: number }
  | { type: typeof PT_BOOLEAN; value: boolean }
  | { type: typeof PT_TIME; value: Date };

export const str = (value: string): PropValue => ({ type: PT_STRING, value });
export const bin = (value: Uint8Array): PropValue => ({ type: PT_BINARY, value });
export const i32 = (value: number): PropValue => ({ type: PT_INT32, value });
export const bool = (value: boolean): PropValue => ({ type: PT_BOOLEAN, value });
export const time = (value: Date): PropValue => ({ type: PT_TIME, value });

/** Common property tags, so tests read as intent rather than hex. */
export const TAG = {
  messageClass: 0x001a,
  subject: 0x0037,
  clientSubmitTime: 0x0039,
  transportHeaders: 0x007d,
  senderName: 0x0c1a,
  senderAddressType: 0x0c1e,
  senderEmail: 0x0c1f,
  recipientType: 0x0c15,
  body: 0x1000,
  html: 0x1013,
  compressedRtf: 0x1009,
  displayName: 0x3001,
  addressType: 0x3002,
  emailAddress: 0x3003,
  creationTime: 0x3007,
  deliveryTime: 0x0e06,
  attachFilename: 0x3704,
  attachLongFilename: 0x3707,
  attachExtension: 0x3703,
  attachMimeTag: 0x370e,
  attachData: 0x3701,
  attachContentId: 0x3712,
  attachmentHidden: 0x7ffe,
  internetCodepage: 0x3fde,
  smtpAddress: 0x39fe,
  // Contact
  givenName: 0x3a06,
  surname: 0x3a11,
  companyName: 0x3a16,
  title: 0x3a17,
  departmentName: 0x3a18,
  businessPhone: 0x3a08,
  mobilePhone: 0x3a1c,
  businessHomePage: 0x3a51,
} as const;

function toFileTime(date: Date): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE((BigInt(date.getTime()) + 11644473600000n) * 10000n);
  return buf;
}

function streamName(id: number, type: number): string {
  return `__substg1.0_${id.toString(16).toUpperCase().padStart(4, "0")}${type
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;
}

function encode(props: Map<number, PropValue>) {
  const streams: Array<[string, Buffer]> = [];
  const entries: Buffer[] = [];

  for (const [id, prop] of props) {
    const entry = Buffer.alloc(16);
    entry.writeUInt16LE(prop.type, 0);
    entry.writeUInt16LE(id, 2);
    entry.writeUInt32LE(0x00000007, 4);

    switch (prop.type) {
      case PT_STRING: {
        const payload = Buffer.from(prop.value, "utf16le");
        streams.push([streamName(id, prop.type), payload]);
        // The size counts a terminating null that is not in the stream.
        entry.writeUInt32LE(payload.length + 2, 8);
        break;
      }
      case PT_BINARY: {
        const payload = Buffer.from(prop.value);
        streams.push([streamName(id, prop.type), payload]);
        entry.writeUInt32LE(payload.length, 8);
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

export interface MsgSpec {
  props: Map<number, PropValue>;
  recipients?: Array<Map<number, PropValue>>;
  attachments?: Array<Map<number, PropValue>>;
}

export function buildMsg(spec: MsgSpec): ArrayBuffer {
  const container = CFB.utils.cfb_new({ root: "Root Entry" });
  const recipients = spec.recipients ?? [];
  const attachments = spec.attachments ?? [];

  const root = encode(spec.props);
  // The message-level header carries next-id and count fields; sub-storages
  // have only the 8 reserved bytes.
  const header = Buffer.alloc(24);
  header.writeUInt32LE(recipients.length, 0);
  header.writeUInt32LE(attachments.length, 4);
  header.writeUInt32LE(recipients.length, 8);
  header.writeUInt32LE(attachments.length, 12);

  CFB.utils.cfb_add(
    container,
    "/__properties_version1.0",
    Buffer.concat([Buffer.alloc(8), header, ...root.entries]),
  );
  for (const [name, data] of root.streams) {
    CFB.utils.cfb_add(container, `/${name}`, data);
  }

  const addSub = (prefix: string, list: Array<Map<number, PropValue>>) => {
    list.forEach((props, index) => {
      const dir = `/${prefix}_#${index.toString(16).toUpperCase().padStart(8, "0")}`;
      const built = encode(props);
      CFB.utils.cfb_add(
        container,
        `${dir}/__properties_version1.0`,
        Buffer.concat([Buffer.alloc(8), ...built.entries]),
      );
      for (const [name, data] of built.streams) {
        CFB.utils.cfb_add(container, `${dir}/${name}`, data);
      }
    });
  };
  addSub("__recip_version1.0", recipients);
  addSub("__attach_version1.0", attachments);

  const out = CFB.write(container, { type: "buffer" }) as Buffer;
  // Allocate through the test realm's own ArrayBuffer. A Buffer's underlying
  // ArrayBuffer comes from Node's realm, and msgreader's `instanceof
  // ArrayBuffer` check fails across realms under jsdom — which surfaces as an
  // opaque "Unknown arrayBuffer" rather than anything pointing at the cause.
  const copy = new ArrayBuffer(out.byteLength);
  new Uint8Array(copy).set(out);
  return copy;
}

/** A minimal readable message, for tests that only care about one property. */
export function simpleMsg(extra: Array<[number, PropValue]> = []): ArrayBuffer {
  return buildMsg({
    props: new Map<number, PropValue>([
      [TAG.messageClass, str("IPM.Note")],
      [TAG.subject, str("Test subject")],
      [TAG.body, str("Test body")],
      ...extra,
    ]),
  });
}
