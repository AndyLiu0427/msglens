import { describe, expect, it } from "vitest";
import { parseEmailFile, UnsupportedFileError } from "@/lib/email/parse";

/**
 * The failure report must never carry the file name.
 *
 * Real ones are like "RE Offer - PB ARM - Vivynn Ow.msg" — the name alone says
 * who the message is about. Several error types embed it in their message, so
 * this checks the property that matters rather than trusting each error string
 * to stay well behaved.
 */

/** Mirrors the redaction in useMessages, which is where reports are built. */
function redactName(message: string, fileName: string): string {
  const stem = fileName.replace(/\.[^.]*$/, "");
  let out = message;
  for (const needle of [fileName, stem]) {
    if (needle.length < 3) continue;
    out = out.split(needle).join("<file>");
  }
  return out;
}

const SENSITIVE = "RE Offer - PB ARM - Vivynn Ow.msg";

describe("failure report redaction", () => {
  it("removes the file name that error types embed", async () => {
    // An empty file is the reliable way to reach UnsupportedFileError, which is
    // one of the types that puts the name in its message. Produced for real
    // rather than hand-written, so this keeps working if the wording changes.
    let message = "";
    try {
      await parseEmailFile(new File([], SENSITIVE));
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedFileError);
      message = (err as Error).message;
    }

    expect(message).toContain("Vivynn Ow");
    const redacted = redactName(message, SENSITIVE);
    expect(redacted).not.toContain("Vivynn Ow");
    expect(redacted).not.toContain(SENSITIVE);
    expect(redacted).toContain("<file>");
  });

  it("also removes the name when the extension is absent from the message", () => {
    const stemOnly = `Failed while reading RE Offer - PB ARM - Vivynn Ow at byte 12`;
    expect(redactName(stemOnly, SENSITIVE)).not.toContain("Vivynn Ow");
  });

  it("leaves a message that never mentioned the file alone", () => {
    const generic = "Invalid typed array length: 8";
    expect(redactName(generic, SENSITIVE)).toBe(generic);
  });

  it("ignores a name too short to redact safely", () => {
    // A one or two character stem would blank out unrelated text.
    const message = "Cannot read a.msg header at offset 4";
    expect(redactName(message, "a.msg")).toContain("offset 4");
  });
});
