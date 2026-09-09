import { TermsPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "en",
  path: "/terms",
  title: "Terms of Use",
  description: "The terms governing use of the MsgLens .msg and .eml viewer, including acceptable use, warranty disclaimers and limitation of liability.",
});

export default function Page() {
  return <TermsPage locale="en" />;
}
