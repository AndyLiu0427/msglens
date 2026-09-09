import { PrivacyPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "zh",
  path: "/privacy",
  title: "隱私權政策",
  description: "MsgLens 如何處理你的資料:檔案完全在瀏覽器中解析,絕不上傳。並說明 Cookie、主機日誌與廣告的處理方式。",
});

export default function Page() {
  return <PrivacyPage locale="zh" />;
}
