/**
 * Builds `winmail.dat` streams in memory for tests.
 *
 * TNEF is a flat sequence of length-prefixed attributes, some carrying a
 * serialised MAPI property blob — writing one is the only way to assert the
 * reader against a known input without a real file to hand.
 *
 * Layout per [MS-OXTNEF] §2.1.
 */

const SIGNATURE = 0x223e9f78;
const LVL_MESSAGE = 0x01;
const LVL_ATTACHMENT = 0x02;

export const ATT = {
  from: 0x00008000,
  subject: 0x00018004,
  dateSent: 0x00038005,
  messageClass: 0x00078008,
  body: 0x0000800c,
  msgProps: 0x00069003,
  attachRenddata: 0x00069002,
  attachTitle: 0x00018010,
  attachData: 0x0006800f,
  attachment: 0x00069005,
} as const;

const PT_LONG = 0x0003;
const PT_BOOLEAN = 0x000b;
const PT_UNICODE = 0x001f;
const PT_BINARY = 0x0102;

export type TnefProp =
  | { type: typeof PT_UNICODE; value: string }
  | { type: typeof PT_BINARY; value: Uint8Array }
  | { type: typeof PT_LONG; value: number }
  | { type: typeof PT_BOOLEAN; value: boolean };

export const uni = (value: string): TnefProp => ({ type: PT_UNICODE, value });
export const binary = (value: Uint8Array): TnefProp => ({ type: PT_BINARY, value });
export const long = (value: number): TnefProp => ({ type: PT_LONG, value });
export const boolean = (value: boolean): TnefProp => ({ type: PT_BOOLEAN, value });

const pad4 = (n: number) => (4 - (n % 4)) % 4;

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

const u16 = (v: number) => new Uint8Array(Uint16Array.of(v).buffer);
const u32 = (v: number) => new Uint8Array(Uint32Array.of(v).buffer);

/** Serialise a MAPI property blob as attMsgProps / attAttachment carries it. */
export function buildProps(props: Map<number, TnefProp>): Uint8Array {
  const parts: Uint8Array[] = [u32(props.size)];

  for (const [id, prop] of props) {
    parts.push(u16(prop.type), u16(id));

    if (prop.type === PT_UNICODE || prop.type === PT_BINARY) {
      const bytes =
        prop.type === PT_UNICODE
          ? concat([new Uint8Array(new TextEncoder().encode("")), encodeUtf16(prop.value)])
          : prop.value;
      // Variable-length values carry a value count even when single-valued.
      parts.push(u32(1), u32(bytes.byteLength), bytes, new Uint8Array(pad4(bytes.byteLength)));
    } else if (prop.type === PT_BOOLEAN) {
      parts.push(u32(prop.value ? 1 : 0));
    } else {
      parts.push(u32(prop.value));
    }
  }
  return concat(parts);
}

function encodeUtf16(value: string): Uint8Array {
  // Strings are stored NUL-terminated; the reader trims it back off.
  const out = new Uint8Array((value.length + 1) * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < value.length; i++) view.setUint16(i * 2, value.charCodeAt(i), true);
  return out;
}

interface Attr {
  level: number;
  id: number;
  data: Uint8Array;
}

function encodeAttr(attr: Attr): Uint8Array {
  return concat([
    Uint8Array.of(attr.level),
    u32(attr.id),
    u32(attr.data.byteLength),
    attr.data,
    // Checksum: the reader skips it, so a placeholder is enough.
    u16(0),
  ]);
}

export interface TnefSpec {
  subject?: string;
  body?: string;
  messageClass?: string;
  senderName?: string;
  dateSent?: Date;
  msgProps?: Map<number, TnefProp>;
  attachments?: Array<{
    title?: string;
    data?: Uint8Array;
    props?: Map<number, TnefProp>;
  }>;
}

export function buildTnef(spec: TnefSpec): ArrayBuffer {
  const attrs: Attr[] = [];
  const ascii = (s: string) => new TextEncoder().encode(s + "\0");

  if (spec.subject !== undefined) {
    attrs.push({ level: LVL_MESSAGE, id: ATT.subject, data: ascii(spec.subject) });
  }
  if (spec.messageClass !== undefined) {
    attrs.push({ level: LVL_MESSAGE, id: ATT.messageClass, data: ascii(spec.messageClass) });
  }
  if (spec.body !== undefined) {
    attrs.push({ level: LVL_MESSAGE, id: ATT.body, data: ascii(spec.body) });
  }
  if (spec.senderName !== undefined) {
    // TRIPLE: 2-byte component count, 2-byte length, then the display name.
    attrs.push({
      level: LVL_MESSAGE,
      id: ATT.from,
      data: concat([u16(2), u16(spec.senderName.length), ascii(spec.senderName)]),
    });
  }
  if (spec.dateSent) {
    const d = spec.dateSent;
    attrs.push({
      level: LVL_MESSAGE,
      id: ATT.dateSent,
      data: concat([
        u16(d.getUTCFullYear()), u16(d.getUTCMonth() + 1), u16(d.getUTCDate()),
        u16(d.getUTCHours()), u16(d.getUTCMinutes()), u16(d.getUTCSeconds()),
        u16(d.getUTCDay()),
      ]),
    });
  }
  if (spec.msgProps) {
    attrs.push({ level: LVL_MESSAGE, id: ATT.msgProps, data: buildProps(spec.msgProps) });
  }

  for (const att of spec.attachments ?? []) {
    // Every attachment opens with attAttachRenddata.
    attrs.push({ level: LVL_ATTACHMENT, id: ATT.attachRenddata, data: new Uint8Array(14) });
    if (att.title !== undefined) {
      attrs.push({ level: LVL_ATTACHMENT, id: ATT.attachTitle, data: ascii(att.title) });
    }
    if (att.props) {
      attrs.push({ level: LVL_ATTACHMENT, id: ATT.attachment, data: buildProps(att.props) });
    }
    if (att.data) {
      attrs.push({ level: LVL_ATTACHMENT, id: ATT.attachData, data: att.data });
    }
  }

  const body = concat([u32(SIGNATURE), u16(0x0001), ...attrs.map(encodeAttr)]);
  const out = new ArrayBuffer(body.byteLength);
  new Uint8Array(out).set(body);
  return out;
}
