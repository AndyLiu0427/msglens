import { ArticlePage } from "@/components/site/ArticlePage";
import { enContent } from "@/content/en";
import { pageMetadata } from "@/lib/metadata";

const doc = enContent.msgVsEml;
const PATH = "/msg-vs-eml";

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
