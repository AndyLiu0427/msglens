import { HomePage } from "@/components/site/HomePage";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "ja",
  path: "/",
  bareTitle: true,
  title: "無料の .msg ファイルビューア：Outlook メールをブラウザで開く",
  description:
    "Outlook の .msg と .eml ファイルをブラウザでそのまま開いて読めます。書式、埋め込み画像、添付ファイルもそのまま表示。ファイルはアップロードされず、お使いの端末の中で解析されます。",
});

export default function Page() {
  return <HomePage locale="ja" />;
}
