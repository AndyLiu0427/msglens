import { ArticlePage } from "@/components/site/ArticlePage";
import { jaContent } from "@/content/ja";
import { jaGuides } from "@/content/ja-guides";
import { jaGuides2 } from "@/content/ja-guides2";
import { pageMetadata } from "@/lib/metadata";

const doc = jaContent.howTo;
const PATH = "/how-to-open-msg-files";

export const metadata = pageMetadata({
  locale: "ja",
  path: PATH,
  title: doc.title,
  description: doc.description,
});

/**
 * The four platform guides used to be four pages with four near-identical
 * titles, all answering "how do I open a .msg file" and all ending at the same
 * viewer. AdSense read that the way Google's thin-content guidance says it
 * would — as doorway pages — and refused the site twice.
 *
 * Their bodies are appended here rather than deleted: the platform detail is
 * the part with actual value, and losing it would have made the site thinner
 * while fixing the complaint about thinness.
 */
export default function Page() {
  return (
    <ArticlePage
      locale="ja"
      path={PATH}
      title={doc.title}
      description={doc.description}
      intro={doc.intro}
      steps={doc.steps}
    >
      {doc.body}
      {jaGuides2.windows.body}
      {jaGuides.mac.body}
      {jaGuides.mobile.body}
      {jaGuides2.gmail.body}
    </ArticlePage>
  );
}
