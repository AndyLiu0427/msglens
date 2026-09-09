import { ArticlePage } from "@/components/site/ArticlePage";
import { zhContent } from "@/content/zh";
import { pageMetadata } from "@/lib/metadata";

const doc = zhContent.whatIs;
const PATH = "/what-is-a-msg-file";

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
    >
      {doc.body}
    </ArticlePage>
  );
}
