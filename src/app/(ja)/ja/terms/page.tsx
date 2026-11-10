import { TermsPage } from "@/components/site/LegalPages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  locale: "ja",
  path: "/terms",
  title: "利用規約",
  description: "MsgLens の .msg / .eml ビューアをご利用いただく際の規約です。許可される利用方法、免責事項、責任の制限を定めています。",
});

export default function Page() {
  return <TermsPage locale="ja" />;
}
