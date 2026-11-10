import { ArticlePage } from "@/components/site/ArticlePage";
import { jaTechnical } from "@/content/ja-technical";
import { pageMetadata } from "@/lib/metadata";

const doc = jaTechnical.rtfBody;
const PATH = "/outlook-msg-no-html-body";

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
