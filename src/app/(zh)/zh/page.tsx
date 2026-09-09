import { HomePage } from "@/components/site/HomePage";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "zh",
  path: "/",
  bareTitle: true,
  title: "免費 .msg 檔案檢視器 — 線上開啟 Outlook 郵件",
  description:
    "直接在瀏覽器中開啟並閱讀 Outlook 的 .msg 與 .eml 檔案,完整保留排版、內嵌圖片與附件。檔案不會上傳,全部在你的裝置上解析。",
});

export default function Page() {
  return <HomePage locale="zh" />;
}
