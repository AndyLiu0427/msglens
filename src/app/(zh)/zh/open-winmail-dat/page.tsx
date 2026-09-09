import { ArticlePage } from "@/components/site/ArticlePage";
import { zhGuides } from "@/content/zh-guides";
import { pageMetadata } from "@/lib/metadata";

const doc = zhGuides.winmail;
const PATH = "/open-winmail-dat";

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
