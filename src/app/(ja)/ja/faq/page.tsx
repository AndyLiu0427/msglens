import { FaqPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "ja",
  path: "/faq",
  title: ".msg ファイルに関するよくある質問",
  description: "Outlook の .msg ファイルを開くときのよくある質問。プライバシー、添付ファイル、暗号化メール、ファイルサイズの上限、PDF 変換について回答します。",
});

export default function Page() {
  return <FaqPage locale="ja" />;
}
