import { PrivacyPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "en",
  path: "/privacy",
  title: "Privacy Policy",
  description: "How MsgLens handles your data: files are parsed entirely in your browser and never uploaded. Details on cookies, hosting logs and advertising.",
});

export default function Page() {
  return <PrivacyPage locale="en" />;
}
