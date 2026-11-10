import { PrivacyPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "ja",
  path: "/privacy",
  title: "プライバシーポリシー",
  description: "MsgLens がお客様のデータをどう扱うか。ファイルはブラウザの中だけで解析され、アップロードされません。Cookie、サーバーログ、広告の扱いも説明します。",
});

export default function Page() {
  return <PrivacyPage locale="ja" />;
}
