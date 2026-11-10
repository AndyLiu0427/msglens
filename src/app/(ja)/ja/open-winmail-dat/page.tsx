import { ArticlePage } from "@/components/site/ArticlePage";
import { jaGuides } from "@/content/ja-guides";
import { pageMetadata } from "@/lib/metadata";

const doc = jaGuides.winmail;
const PATH = "/open-winmail-dat";

export const metadata = pageMetadata({
  locale: "ja",
  path: PATH,
  title: doc.title,
  description: doc.description,
});

export default function Page() {
  return (
    <ArticlePage
      locale="ja"
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
