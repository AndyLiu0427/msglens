import { FaqPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "zh",
  path: "/faq",
  title: "關於 .msg 檔的常見問題",
  description: "開啟 Outlook .msg 檔的常見問題解答:隱私、附件、加密郵件、檔案大小限制與 PDF 轉檔。",
});

export default function Page() {
  return <FaqPage locale="zh" />;
}
