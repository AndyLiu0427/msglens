import { ArticlePage } from "@/components/site/ArticlePage";
import { jaGuides } from "@/content/ja-guides";
import { pageMetadata } from "@/lib/metadata";

const doc = jaGuides.troubleshoot;
const PATH = "/msg-file-wont-open";

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
