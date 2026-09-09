import { ArticlePage } from "@/components/site/ArticlePage";
import { enGuides2 } from "@/content/en-guides2";
import { pageMetadata } from "@/lib/metadata";

const doc = enGuides2.toEml;
const PATH = "/msg-to-eml";

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
      steps={doc.steps}
    >
      {doc.body}
    </ArticlePage>
  );
}
