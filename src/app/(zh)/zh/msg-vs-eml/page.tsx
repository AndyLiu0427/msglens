import { ArticlePage } from "@/components/site/ArticlePage";
import { zhContent } from "@/content/zh";
import { pageMetadata } from "@/lib/metadata";

const doc = zhContent.msgVsEml;
const PATH = "/msg-vs-eml";

export const metadata = pageMetadata({
  locale: "zh",
  path: PATH,
  title: doc.title,
  description: doc.description,
});

export default function Page() {
  return (
    <ArticlePage
      locale="zh"
      path={PATH}
      title={doc.title}
      description={doc.description}
      faq={doc.faq}
    >
      {doc.body}
    </ArticlePage>
  );
}
