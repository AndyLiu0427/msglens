import { describe, expect, it } from "vitest";
import { collectFiles, mailFilesOnly } from "@/lib/email/collectFiles";

/**
 * Dropped folders arrive through the entry API, read a batch at a time. Both
 * the recursion and the batching are easy to get wrong and fail silently: the
 * drop just opens fewer files than it should.
 */

const file = (name: string) => new File(["x"], name);

function fileEntry(name: string) {
  return { isFile: true, isDirectory: false, name, file: (ok: (f: File) => void) => ok(file(name)) };
}

function dirEntry(name: string, children: unknown[], batch = 2) {
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader() {
      let at = 0;
      // Like Chrome: a few entries per call, then an empty array when done.
      return {
        readEntries(ok: (e: unknown[]) => void) {
          ok(children.slice(at, (at += batch)));
        },
      };
    },
  };
}

function drop(entries: unknown[], files: File[] = []) {
  return {
    items: entries.map((entry) => ({ kind: "file", webkitGetAsEntry: () => entry })),
    files,
  } as unknown as DataTransfer;
}

describe("collectFiles", () => {
  it("walks nested folders, across read batches, keeping only mail files", async () => {
    const tree = dirEntry("Mail", [
      fileEntry("a.msg"),
      fileEntry("notes.docx"),
      fileEntry("b.EML"),
      dirEntry("2025", [fileEntry("c.msg"), fileEntry("winmail.dat"), fileEntry("img.png")]),
    ]);
    const names = (await collectFiles(drop([tree]))).map((f) => f.name).sort();
    expect(names).toEqual(["a.msg", "b.EML", "c.msg", "winmail.dat"]);
  });

  it("passes plain file drops through untouched, unsupported ones included", async () => {
    const dropped = [file("a.msg"), file("report.pdf")];
    const out = await collectFiles(drop([fileEntry("a.msg"), fileEntry("report.pdf")], dropped));
    expect(out).toEqual(dropped);
  });
});

describe("mailFilesOnly", () => {
  it("keeps .msg, .eml and .dat from a picked folder", () => {
    expect(mailFilesOnly([file("x.msg"), file("y.txt"), file("z.dat")]).map((f) => f.name)).toEqual([
      "x.msg",
      "z.dat",
    ]);
  });
});
