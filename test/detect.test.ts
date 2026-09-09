import { describe, expect, it } from "vitest";
import { detectFormat, parseEmailFile, WrongFormatError } from "@/lib/email/parse";
import { simpleMsg } from "./helpers/buildMsg";

const buf = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;

describe("detectFormat", () => {
  it("identifies a .msg by its compound-file signature, not its name", () => {
    // Renamed files are common enough that trusting the extension produces a
    // "corrupt file" error for a perfectly readable message.
    expect(detectFormat(simpleMsg(), "renamed.txt")).toBe("msg");
  });

  it("identifies a MIME message from its first header line", () => {
    expect(detectFormat(buf("From: a@b.c\r\nSubject: hi\r\n\r\nbody"), "x")).toBe("eml");
    expect(detectFormat(buf("Received: from mx\r\n\r\nbody"), "x")).toBe("eml");
  });

  it("does not treat an .ics as mail because it contains an X- line", () => {
    // Regression: the sniff matched `X-Something:` anywhere in the first 2KB,
    // and Outlook writes X-MS-OLK-FORCEINSPECTOROPEN into exported calendar
    // items. That fed a calendar file to the MIME parser, which produced a
    // blank message instead of an explanation.
    const ics = [
      "BEGIN:VCALENDAR",
      "PRODID:-//Microsoft Corporation//Outlook 16.0 MIMEDIR//EN",
      "VERSION:2.0",
      "X-MS-OLK-FORCEINSPECTOROPEN:TRUE",
      "BEGIN:VEVENT",
      "SUMMARY:Planning review",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    expect(detectFormat(buf(ics), "meeting.ics")).toBe("ical");
  });

  it("identifies a vCard", () => {
    expect(detectFormat(buf("BEGIN:VCARD\r\nFN:Dana\r\nEND:VCARD"), "d.vcf")).toBe("vcard");
  });

  it("falls back to the extension when the content is inconclusive", () => {
    expect(detectFormat(buf("nothing recognisable"), "a.msg")).toBe("msg");
    expect(detectFormat(buf("nothing recognisable"), "a.eml")).toBe("eml");
    expect(detectFormat(buf("nothing recognisable"), "a.ics")).toBe("ical");
    expect(detectFormat(buf("nothing recognisable"), "a.bin")).toBe("unknown");
  });
});

describe("parseEmailFile", () => {
  it("reports a calendar file as what it is, not as corrupt", () => {
    // A .ics is a good file that simply opens elsewhere. Calling it corrupt
    // sends the reader looking for a problem that does not exist.
    const file = new File(["BEGIN:VCALENDAR\r\nEND:VCALENDAR"], "m.ics");
    return expect(parseEmailFile(file)).rejects.toBeInstanceOf(WrongFormatError);
  });

  it("rejects an empty file", () => {
    return expect(parseEmailFile(new File([], "empty.msg"))).rejects.toThrow();
  });
});
