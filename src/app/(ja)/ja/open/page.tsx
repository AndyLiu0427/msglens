import { Page } from "@/components/site/Page";
import { OpenHandoff } from "@/components/handoff/OpenHandoff";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary("ja");

export const metadata = {
  title: t.handoff.title,
  // An integration endpoint, not a page anyone should reach from search.
  robots: { index: false, follow: false },
};

export default function OpenRoute() {
  return (
    <Page locale="ja" path="/open" wide>
      <OpenHandoff t={t} locale="ja" />
    </Page>
  );
}
