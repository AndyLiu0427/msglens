import { ArticlePage } from "@/components/site/ArticlePage";
import { jaGuides2 } from "@/content/ja-guides2";
import { pageMetadata } from "@/lib/metadata";

const doc = jaGuides2.attachments;
const PATH = "/extract-msg-attachments";

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
      faq={doc.faq}
    >
      {doc.body}
    </ArticlePage>
  );
}
