import { ArticlePage } from "@/components/site/ArticlePage";
import { jaCompare } from "@/content/ja-compare";
import { pageMetadata } from "@/lib/metadata";

const doc = jaCompare;
const PATH = "/msg-viewer-comparison";

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
    >
      {doc.body}
    </ArticlePage>
  );
}
