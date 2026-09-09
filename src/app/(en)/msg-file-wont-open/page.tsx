import { ArticlePage } from "@/components/site/ArticlePage";
import { enGuides } from "@/content/en-guides";
import { pageMetadata } from "@/lib/metadata";

const doc = enGuides.troubleshoot;
const PATH = "/msg-file-wont-open";

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
