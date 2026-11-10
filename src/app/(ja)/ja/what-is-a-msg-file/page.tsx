import { ArticlePage } from "@/components/site/ArticlePage";
import { jaContent } from "@/content/ja";
import { pageMetadata } from "@/lib/metadata";

const doc = jaContent.whatIs;
const PATH = "/what-is-a-msg-file";

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
    >
      {doc.body}
    </ArticlePage>
  );
}
