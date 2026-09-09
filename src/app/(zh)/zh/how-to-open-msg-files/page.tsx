import { ArticlePage } from "@/components/site/ArticlePage";
import { zhContent } from "@/content/zh";
import { zhGuides } from "@/content/zh-guides";
import { zhGuides2 } from "@/content/zh-guides2";
import { pageMetadata } from "@/lib/metadata";

const doc = zhContent.howTo;
const PATH = "/how-to-open-msg-files";

export const metadata = pageMetadata({
  locale: "zh",
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
      locale="zh"
      path={PATH}
      title={doc.title}
      description={doc.description}
      intro={doc.intro}
      steps={doc.steps}
    >
      {doc.body}
      {zhGuides2.windows.body}
      {zhGuides.mac.body}
      {zhGuides.mobile.body}
      {zhGuides2.gmail.body}
    </ArticlePage>
  );
}
