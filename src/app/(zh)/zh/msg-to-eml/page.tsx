import { ArticlePage } from "@/components/site/ArticlePage";
import { zhGuides2 } from "@/content/zh-guides2";
import { pageMetadata } from "@/lib/metadata";

const doc = zhGuides2.toEml;
const PATH = "/msg-to-eml";

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
      intro={doc.intro}
      steps={doc.steps}
    >
      {doc.body}
    </ArticlePage>
  );
}
