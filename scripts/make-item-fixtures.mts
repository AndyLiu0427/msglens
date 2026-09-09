/**
 * Synthetic appointment and contact .msg fixtures.
 *
 * Run: npx tsx scripts/make-item-fixtures.mts
 * Output: .fixtures/appointment.msg, .fixtures/contact.msg  (gitignored)
 *
 * Exercises the non-mail item paths, which no real-world corpus here covers.
 * Entirely fictional, so it is safe to keep and to share in a bug report.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import CFB from "cfb";

const PT_INT32 = 0x0003, PT_TIME = 0x0040, PT_STRING = 0x001f;
type P = { t: number; v: string | number | Date };
const str = (v: string): P => ({ t: PT_STRING, v });
const i32 = (v: number): P => ({ t: PT_INT32, v });
const time = (v: Date): P => ({ t: PT_TIME, v });

const fileTime = (d: Date) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE((BigInt(d.getTime()) + 11644473600000n) * 10000n);
  return b;
};
const name = (id: number, t: number) =>
  `__substg1.0_${id.toString(16).toUpperCase().padStart(4, "0")}${t.toString(16).toUpperCase().padStart(4, "0")}`;

function build(props: Map<number, P>, out: string) {
  const cf = CFB.utils.cfb_new({ root: "Root Entry" });
  const entries: Buffer[] = [];
  for (const [id, p] of props) {
    const e = Buffer.alloc(16);
    e.writeUInt16LE(p.t, 0);
    e.writeUInt16LE(id, 2);
    e.writeUInt32LE(7, 4);
    if (p.t === PT_STRING) {
      const payload = Buffer.from(String(p.v), "utf16le");
      CFB.utils.cfb_add(cf, `/${name(id, p.t)}`, payload);
      e.writeUInt32LE(payload.length + 2, 8);
    } else if (p.t === PT_INT32) {
      e.writeInt32LE(Number(p.v), 8);
    } else {
      fileTime(p.v as Date).copy(e, 8);
    }
    entries.push(e);
  }
  const header = Buffer.alloc(24);
  CFB.utils.cfb_add(cf, "/__properties_version1.0",
    Buffer.concat([Buffer.alloc(8), header, ...entries]));
  mkdirSync(".fixtures", { recursive: true });
  writeFileSync(out, CFB.write(cf, { type: "buffer" }) as Buffer);
  console.log("wrote", out);
}

build(new Map<number, P>([
  [0x001a, str("IPM.Appointment")],
  [0x0037, str("Quarterly planning review")],
  [0x8004, str("")],
  [0x0e1d, str("Quarterly planning review")],
  [0x1000, str("Agenda attached. Fictional sample appointment.")],
  [0x3007, time(new Date("2026-04-02T09:00:00Z"))],
  [0x0017, i32(1)],
]), ".fixtures/appointment.msg");

build(new Map<number, P>([
  [0x001a, str("IPM.Contact")],
  [0x0037, str("Dana Whitfield")],
  [0x3a06, str("Dana")],
  [0x3a11, str("Whitfield")],
  [0x3a16, str("Northwind Traders")],
  [0x3a17, str("Procurement Lead")],
  [0x3a18, str("Operations")],
  [0x3a08, str("+1 555 0134")],
  [0x3a1c, str("+1 555 0199")],
  [0x3a51, str("https://northwind.example")],
  [0x1000, str("Fictional sample contact.")],
]), ".fixtures/contact.msg");
