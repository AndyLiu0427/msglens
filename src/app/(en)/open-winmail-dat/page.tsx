import { ArticlePage } from "@/components/site/ArticlePage";
import { enGuides } from "@/content/en-guides";
import { pageMetadata } from "@/lib/metadata";

const doc = enGuides.winmail;
const PATH = "/open-winmail-dat";

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
