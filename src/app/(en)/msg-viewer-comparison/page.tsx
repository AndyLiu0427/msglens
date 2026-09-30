import { ArticlePage } from "@/components/site/ArticlePage";
import { enCompare } from "@/content/en-compare";
import { pageMetadata } from "@/lib/metadata";

const doc = enCompare;
const PATH = "/msg-viewer-comparison";

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
