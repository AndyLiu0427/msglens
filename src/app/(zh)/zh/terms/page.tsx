import { TermsPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "zh",
  path: "/terms",
  title: "使用條款",
  description: "使用 MsgLens 的 .msg 與 .eml 檢視器所適用的條款,包含可接受的使用方式、免責聲明與責任限制。",
});

export default function Page() {
  return <TermsPage locale="zh" />;
}
