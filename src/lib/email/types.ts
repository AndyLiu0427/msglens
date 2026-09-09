/**
 * Normalised representation of a parsed email, shared by the .msg and .eml
 * front-ends so the UI never has to care which format it came from.
 */

export type BodyKind = "html" | "text";

export interface EmailAddress {
  /** Display name, e.g. "Jane Doe". Empty when the source only had an address. */
  name: string;
  /** SMTP address, e.g. "jane@example.com". Empty for unresolved Exchange DNs. */
  address: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  /** MIME type, best-effort — derived from the extension when absent. */
  mimeType: string;
  size: number;
  content: Uint8Array;
  /** Content-ID without angle brackets, used to resolve `cid:` body images. */
  contentId?: string;
  /** True when the attachment is referenced from the body via `cid:`. */
  inline: boolean;
  /** True for embedded Outlook messages (`.msg` inside `.msg`). */
  isEmbeddedMessage: boolean;
}

/**
 * What kind of Outlook item the file holds.
 *
 * A `.msg` is a container for any single Outlook item, not just mail — saving
 * an appointment or a contact produces one too. Rendering those as if they
 * were email drops the only information that matters about them (start time,
 * location, phone numbers), so they are classified and shown differently.
 */
export type ItemKind = "note" | "meeting" | "appointment" | "contact" | "task" | "other";

export interface AppointmentDetails {
  start: Date | null;
  end: Date | null;
  location: string;
  /** True when the item carries a recurrence pattern. */
  recurring: boolean;
  /** Recipients of a meeting item are its attendees. */
  attendees: EmailAddress[];
}

export interface ContactDetails {
  displayName: string;
  jobTitle: string;
  company: string;
  department: string;
  emails: string[];
  phones: Array<{ label: string; number: string }>;
  addresses: Array<{ label: string; value: string }>;
  website: string;
  /** True when nothing beyond a name could be recovered. */
  sparse: boolean;
}

export interface ParsedEmail {
  id: string;
  /** Name of the file the user dropped. */
  sourceFileName: string;
  sourceFormat: "msg" | "eml" | "tnef";
  sourceSize: number;
  /**
   * The dropped file itself, kept so "Save to workspace" can upload the exact
   * original bytes rather than a re-serialised approximation.
   *
   * A File is a lazy, disk-backed handle — holding one costs no memory. Absent
   * for embedded messages opened in place, which never were a file on disk.
   */
  sourceFile?: File;

  subject: string;
  from: EmailAddress | null;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo: EmailAddress[];

  /** Best available date: sent time, falling back to delivery/creation time. */
  date: Date | null;
  dateLabel: "sent" | "received" | "created" | null;

  bodyKind: BodyKind;
  /** Sanitised HTML when `bodyKind === "html"`, otherwise the raw plain text. */
  body: string;
  /** Always available — used for search, plain-text export and previews. */
  bodyText: string;
  /** Where the rendered body ultimately came from. Surfaced in the UI. */
  bodySource: "html" | "rtf" | "text" | "none";

  attachments: Attachment[];
  /** Raw internet headers when the source preserved them. */
  headers: string;
  /** Parsed header name/value pairs, in original order. */
  headerPairs: Array<{ name: string; value: string }>;

  messageClass: string;
  /** Derived from `messageClass`; drives which layout the viewer uses. */
  itemKind: ItemKind;
  /** Present for meeting and appointment items. */
  appointment?: AppointmentDetails;
  /** Present for contact items. */
  contact?: ContactDetails;
  importance: "low" | "normal" | "high" | null;
  hasAttachments: boolean;

  /** Non-fatal problems worth telling the user about. */
  warnings: string[];
}
