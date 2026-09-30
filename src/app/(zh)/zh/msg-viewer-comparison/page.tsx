import { ArticlePage } from "@/components/site/ArticlePage";
import { zhCompare } from "@/content/zh-compare";
import { pageMetadata } from "@/lib/metadata";

const doc = zhCompare;
const PATH = "/msg-viewer-comparison";

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
    >
      {doc.body}
    </ArticlePage>
  );
}
