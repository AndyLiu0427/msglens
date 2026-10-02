import { ArticlePage } from "@/components/site/ArticlePage";
import { zhGuides2 } from "@/content/zh-guides2";
import { pageMetadata } from "@/lib/metadata";

const doc = zhGuides2.openEml;
const PATH = "/open-eml-file";

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
