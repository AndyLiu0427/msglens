import { ArticlePage } from "@/components/site/ArticlePage";
import { jaContent } from "@/content/ja";
import { pageMetadata } from "@/lib/metadata";

const doc = jaContent.toPdf;
const PATH = "/convert-msg-to-pdf";

export const metadata = pageMetadata({
  locale: "ja",
  path: PATH,
  title: doc.title,
  description: doc.description,
});

export default function Page() {
  return (
    <ArticlePage
      tool
      locale="ja"
      path={PATH}
      title={doc.title}
      description={doc.description}
      steps={doc.steps}
    >
      {doc.body}
    </ArticlePage>
  );
}
