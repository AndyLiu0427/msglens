import { ArticlePage } from "@/components/site/ArticlePage";
import { enTechnical } from "@/content/en-technical";
import { pageMetadata } from "@/lib/metadata";

const doc = enTechnical.rtfBody;
const PATH = "/outlook-msg-no-html-body";

export const metadata = pageMetadata({
  locale: "en",
  path: PATH,
  title: doc.title,
  description: doc.description,
});

export default function Page() {
  return (
    <ArticlePage
      locale="en"
      path={PATH}
      title={doc.title}
      description={doc.description}
      intro={doc.intro}
    >
      {doc.body}
    </ArticlePage>
  );
}
