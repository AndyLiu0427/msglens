import { ArticlePage } from "@/components/site/ArticlePage";
import { enGuides2 } from "@/content/en-guides2";
import { pageMetadata } from "@/lib/metadata";

const doc = enGuides2.openEml;
const PATH = "/open-eml-file";

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
      faq={doc.faq}
    >
      {doc.body}
    </ArticlePage>
  );
}
