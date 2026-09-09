import { ArticlePage } from "@/components/site/ArticlePage";
import { zhTechnical } from "@/content/zh-technical";
import { pageMetadata } from "@/lib/metadata";

const doc = zhTechnical.rtfBody;
const PATH = "/outlook-msg-no-html-body";

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
    >
      {doc.body}
    </ArticlePage>
  );
}
