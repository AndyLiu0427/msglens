import { HomePage } from "@/components/site/HomePage";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "en",
  path: "/",
  bareTitle: true,
  title: "Free .msg File Viewer — Open Outlook Messages Online",
  description:
    "Open Outlook .msg, .eml and winmail.dat files in your browser. Nothing is uploaded — it parses on your device, with full formatting and attachments.",
});

export default function Page() {
  return <HomePage locale="en" />;
}
