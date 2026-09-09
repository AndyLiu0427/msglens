import { describe, expect, it } from "vitest";
import { classifyItem } from "@/lib/email/items";
import { parseMsg } from "@/lib/email/parseMsg";
import { buildMsg, str, TAG, type PropValue } from "./helpers/buildMsg";

describe("classifyItem", () => {
  it("treats an absent or note class as mail", () => {
    expect(classifyItem("")).toBe("note");
    expect(classifyItem("IPM.Note")).toBe("note");
  });

  it("matches by prefix so variants classify correctly", () => {
    // Outlook and add-ins append suffixes freely; an exact-match table goes
    // stale the first time one appears.
    expect(classifyItem("IPM.Note.SMIME.MultipartSigned")).toBe("note");
    expect(classifyItem("IPM.Schedule.Meeting.Request")).toBe("meeting");
    expect(classifyItem("IPM.Schedule.Meeting.Resp.Pos")).toBe("meeting");
    expect(classifyItem("IPM.Appointment")).toBe("appointment");
    expect(classifyItem("IPM.Contact.Custom")).toBe("contact");
    expect(classifyItem("IPM.DistList")).toBe("contact");
    expect(classifyItem("IPM.Task")).toBe("task");
  });

  it("is case-insensitive", () => {
    expect(classifyItem("ipm.appointment")).toBe("appointment");
  });

  it("falls back to 'other' for anything unrecognised", () => {
    expect(classifyItem("IPM.StickyNote")).toBe("other");
    expect(classifyItem("REPORT.IPM.Note.NDR")).toBe("other");
  });
});

describe("contact items", () => {
  const contact = (extra: Array<[number, PropValue]>) =>
    buildMsg({
      props: new Map<number, PropValue>([
        [TAG.messageClass, str("IPM.Contact")],
        ...extra,
      ]),
    });

  it("collects name, role and contact methods", async () => {
    const email = await parseMsg(
      contact([
        [TAG.givenName, str("Dana")],
        [TAG.surname, str("Whitfield")],
        [TAG.title, str("Procurement Lead")],
        [TAG.companyName, str("Northwind Traders")],
        [TAG.departmentName, str("Operations")],
        [TAG.businessPhone, str("+1 555 0134")],
        [TAG.mobilePhone, str("+1 555 0199")],
        [TAG.businessHomePage, str("https://northwind.example")],
      ]),
      "c.msg",
    );

    expect(email.itemKind).toBe("contact");
    expect(email.contact?.displayName).toBe("Dana Whitfield");
    expect(email.contact?.jobTitle).toBe("Procurement Lead");
    expect(email.contact?.company).toBe("Northwind Traders");
    expect(email.contact?.department).toBe("Operations");
    expect(email.contact?.phones).toEqual([
      { label: "Work", number: "+1 555 0134" },
      { label: "Mobile", number: "+1 555 0199" },
    ]);
    expect(email.contact?.website).toBe("https://northwind.example");
    expect(email.contact?.sparse).toBe(false);
  });

  it("flags a contact where only a name survived", async () => {
    // Usually means the details live in named properties this reader does not
    // resolve — worth saying, rather than showing a blank card.
    const email = await parseMsg(contact([[TAG.givenName, str("Dana")]]), "c.msg");
    expect(email.contact?.sparse).toBe(true);
    expect(email.contact?.displayName).toBe("Dana");
  });

  it("omits empty phone slots instead of listing blanks", async () => {
    const email = await parseMsg(
      contact([[TAG.businessPhone, str("")], [TAG.mobilePhone, str("+1 555 0199")]]),
      "c.msg",
    );
    expect(email.contact?.phones).toEqual([{ label: "Mobile", number: "+1 555 0199" }]);
  });

  it("does not attach contact details to a mail item", async () => {
    const email = await parseMsg(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.companyName, str("Northwind Traders")],
        ]),
      }),
      "m.msg",
    );
    expect(email.itemKind).toBe("note");
    expect(email.contact).toBeUndefined();
  });
});

describe("appointment items", () => {
  it("attaches an appointment block and degrades when times are absent", async () => {
    // The start/end/location properties are MAPI named properties, which this
    // fixture builder cannot yet emit. The contract under test is the
    // graceful path: an appointment is still classified and still gets its
    // block, with empty values rather than a crash or a mail layout.
    const email = await parseMsg(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Appointment")],
          [TAG.subject, str("Quarterly planning review")],
        ]),
      }),
      "a.msg",
    );

    expect(email.itemKind).toBe("appointment");
    expect(email.appointment).toBeDefined();
    expect(email.appointment?.start).toBeNull();
    expect(email.appointment?.location).toBe("");
    expect(email.appointment?.recurring).toBe(false);
  });

  it("treats a meeting request as a meeting and keeps its attendees", async () => {
    const email = await parseMsg(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Schedule.Meeting.Request")],
        ]),
        recipients: [
          new Map<number, PropValue>([
            [TAG.displayName, str("Sam Okafor")],
            [TAG.addressType, str("SMTP")],
            [TAG.emailAddress, str("sam@example.com")],
          ]),
        ],
      }),
      "m.msg",
    );
    expect(email.itemKind).toBe("meeting");
    expect(email.appointment?.attendees.map((a) => a.address)).toEqual([
      "sam@example.com",
    ]);
  });
});
