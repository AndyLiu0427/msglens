"use client";

import {
  IconCalendar,
  IconContact,
  IconMapPin,
  IconPhone,
  IconRepeat,
  IconUsers,
} from "@/components/ui/icons";
import { shortAddress } from "@/lib/email/headers";
import type { ParsedEmail } from "@/lib/email/types";
import type { Dictionary } from "@/lib/i18n";

/**
 * The header block for non-mail items.
 *
 * Rendered above the body instead of the From/To block, because an
 * appointment's sender is meaningless next to its start time and location,
 * and a contact has no correspondents at all.
 */

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 text-[13.5px]">
      <span className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="sr-only">{label}: </span>
        <span className="break-words text-ink">{children}</span>
      </span>
    </div>
  );
}

function formatRange(
  start: Date | null,
  end: Date | null,
  locale: string,
): string {
  if (!start) return "";
  const sameDay = end && start.toDateString() === end.toDateString();

  const date = start.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = (d: Date) =>
    d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  if (!end) return `${date}, ${time(start)}`;
  // Only repeat the date when the appointment crosses midnight.
  if (sameDay) return `${date}, ${time(start)} – ${time(end)}`;
  return `${date}, ${time(start)} – ${end.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
  })}, ${time(end)}`;
}

export function AppointmentHeader({
  email,
  t,
  locale,
}: {
  email: ParsedEmail;
  t: Dictionary;
  locale: string;
}) {
  const appt = email.appointment;
  if (!appt) return null;

  const when = formatRange(appt.start, appt.end, locale);

  return (
    <div className="mt-3.5 space-y-2">
      {when && (
        <Row icon={<IconCalendar className="size-4" />} label={t.item.when}>
          {when}
          {appt.recurring && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">
              <IconRepeat className="size-3" />
              {t.item.recurring}
            </span>
          )}
        </Row>
      )}

      {appt.location && (
        <Row icon={<IconMapPin className="size-4" />} label={t.item.where}>
          {appt.location}
        </Row>
      )}

      {appt.attendees.length > 0 && (
        <Row icon={<IconUsers className="size-4" />} label={t.item.attendees}>
          {appt.attendees.map(shortAddress).join(", ")}
        </Row>
      )}

      {!when && !appt.location && (
        <p className="text-[13px] text-ink-subtle">{t.item.noAppointmentData}</p>
      )}
    </div>
  );
}

export function ContactCard({
  email,
  t,
}: {
  email: ParsedEmail;
  t: Dictionary;
}) {
  const c = email.contact;
  if (!c) return null;

  const subtitle = [c.jobTitle, c.department, c.company].filter(Boolean).join(" · ");

  return (
    <div className="mt-3.5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <IconContact className="size-5.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-ink">
            {c.displayName || email.subject || t.viewer.noSubject}
          </p>
          {subtitle && <p className="text-[13px] text-ink-muted">{subtitle}</p>}
        </div>
      </div>

      {(c.emails.length > 0 || c.phones.length > 0 || c.addresses.length > 0 || c.website) && (
        <dl className="mt-4 grid gap-2 rounded-xl bg-surface-sunken p-3.5">
          {c.emails.map((address) => (
            <div key={address} className="flex gap-2.5 text-[13.5px]">
              <dt className="w-16 shrink-0 text-ink-subtle">{t.item.email}</dt>
              <dd className="min-w-0 break-all">
                <a href={`mailto:${address}`} className="text-accent hover:underline">
                  {address}
                </a>
              </dd>
            </div>
          ))}
          {c.phones.map((phone) => (
            <div key={phone.label + phone.number} className="flex gap-2.5 text-[13.5px]">
              <dt className="w-16 shrink-0 text-ink-subtle">{phone.label}</dt>
              <dd className="min-w-0 break-words">
                <a href={`tel:${phone.number.replace(/\s+/g, "")}`} className="text-ink hover:underline">
                  {phone.number}
                </a>
              </dd>
            </div>
          ))}
          {c.addresses.map((addr) => (
            <div key={addr.label + addr.value} className="flex gap-2.5 text-[13.5px]">
              <dt className="w-16 shrink-0 text-ink-subtle">{addr.label}</dt>
              <dd className="min-w-0 break-words text-ink">{addr.value}</dd>
            </div>
          ))}
          {c.website && (
            <div className="flex gap-2.5 text-[13.5px]">
              <dt className="w-16 shrink-0 text-ink-subtle">{t.item.website}</dt>
              <dd className="min-w-0 break-all">
                <a
                  href={c.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-accent hover:underline"
                >
                  {c.website}
                </a>
              </dd>
            </div>
          )}
        </dl>
      )}

      {c.sparse && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-[12.5px] text-warning">
          <IconPhone className="mt-px size-3.5 shrink-0" />
          {t.item.sparseContact}
        </p>
      )}
    </div>
  );
}
