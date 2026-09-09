import { FaqPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "en",
  path: "/faq",
  title: "Frequently asked questions about .msg files",
  description: "Answers to common questions about opening Outlook .msg files: privacy, attachments, encrypted messages, size limits and PDF conversion.",
});

export default function Page() {
  return <FaqPage locale="en" />;
}
