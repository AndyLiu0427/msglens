/**
 * Non-mail Outlook items: appointments, meetings and contacts.
 *
 * `.msg` is a container for any single Outlook item. The properties that
 * matter for these kinds — start time, location, phone numbers — live in
 * MAPI properties the mail layout never looks at, so a viewer that treats
 * every file as email silently drops everything the item is actually about.
 */

import type { FieldsData } from "@kenjiuno/msgreader";
import type {
  AppointmentDetails,
  ContactDetails,
  EmailAddress,
  ItemKind,
} from "./types";

/**
 * Classify from PidTagMessageClass.
 *
 * Matching is prefix-based and case-insensitive: Outlook appends suffixes for
 * variants (`IPM.Schedule.Meeting.Request`, `IPM.Contact.Custom`) and add-ins
 * introduce their own, so an exact-match table goes stale immediately.
 */
export function classifyItem(messageClass: string): ItemKind {
  const c = (messageClass || "").toLowerCase();
  if (!c || c.startsWith("ipm.note")) return "note";
  if (c.startsWith("ipm.schedule.meeting")) return "meeting";
  if (c.startsWith("ipm.appointment")) return "appointment";
  if (c.startsWith("ipm.contact") || c.startsWith("ipm.distlist")) return "contact";
  if (c.startsWith("ipm.task")) return "task";
  return "other";
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function extractAppointment(
  fields: FieldsData,
  attendees: EmailAddress[],
): AppointmentDetails {
  return {
    start: parseDate(fields.apptStartWhole) ?? parseDate(fields.clipStart),
    end: parseDate(fields.apptEndWhole) ?? parseDate(fields.clipEnd),
    // PidLidLocation is the authoritative one; PidTagLocation is the fallback
    // older clients wrote.
    location: (fields.apptLocation || fields.location || "").trim(),
    recurring: Boolean(fields.apptRecur),
    attendees,
  };
}

/** Drop empty parts and join what is left, so no label shows a stray comma. */
function joinParts(parts: Array<string | undefined>, separator = ", "): string {
  return parts.map((p) => (p ?? "").trim()).filter(Boolean).join(separator);
}

export function extractContact(fields: FieldsData): ContactDetails {
  const displayName =
    joinParts(
      [fields.displayNamePrefix, fields.givenName, fields.middleName, fields.surname, fields.generation],
      " ",
    ) ||
    fields.name ||
    fields.fileUnder ||
    "";

  const phones = [
    { label: "Work", number: fields.businessTelephoneNumber },
    { label: "Mobile", number: fields.mobileTelephoneNumber },
    { label: "Home", number: fields.homeTelephoneNumber },
    { label: "Fax", number: fields.businessFaxNumber },
  ]
    .filter((p): p is { label: string; number: string } => Boolean(p.number?.trim()))
    .map((p) => ({ label: p.label, number: p.number.trim() }));

  const work = joinParts([
    fields.workAddressStreet,
    fields.workAddressCity,
    fields.workAddressState,
    fields.workAddressPostalCode,
    fields.workAddressCountry,
  ]);
  const home = joinParts([
    fields.streetAddress,
    fields.addressCity,
    fields.stateOrProvince,
    fields.postalCode,
    fields.country,
  ]);

  const addresses = [
    { label: "Work", value: work || fields.workAddress?.trim() || "" },
    { label: "Home", value: home || "" },
    // PidTagPostalAddress is a pre-formatted blob some clients write instead.
    { label: "Postal", value: !work && !home ? (fields.postalAddress ?? "").trim() : "" },
  ].filter((a) => a.value);

  const emails = [fields.email, fields.smtpAddress]
    .map((e) => (e ?? "").trim())
    .filter((e, i, all) => e && all.indexOf(e) === i);

  const company = (fields.companyName ?? "").trim();
  const jobTitle = (fields.title ?? "").trim();
  const department = (fields.departmentName ?? fields.department ?? "").trim();
  const website = (fields.businessHomePage ?? "").trim();

  return {
    displayName: displayName.trim(),
    jobTitle,
    company,
    department,
    emails,
    phones,
    addresses,
    website,
    // A contact with only a name is worth flagging: it usually means the file
    // stores its details in named properties this reader does not expose,
    // rather than that the contact was genuinely empty.
    sparse:
      phones.length === 0 &&
      emails.length === 0 &&
      addresses.length === 0 &&
      !company &&
      !jobTitle &&
      !website,
  };
}
