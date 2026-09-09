import { ArticlePage } from "@/components/site/ArticlePage";
import { zhContent } from "@/content/zh";
import { pageMetadata } from "@/lib/metadata";

const doc = zhContent.toPdf;
const PATH = "/convert-msg-to-pdf";

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
      steps={doc.steps}
    >
      {doc.body}
    </ArticlePage>
  );
}
