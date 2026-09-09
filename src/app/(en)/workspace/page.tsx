import { Page } from "@/components/site/Page";
import { Workspace } from "@/components/workspace/Workspace";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

const PATH = "/workspace";
const t = getDictionary("en");

export const metadata = {
  ...pageMetadata({
    locale: "en",
    path: PATH,
    title: t.workspace.title,
    description: t.workspace.signedOutBody,
  }),
  // Signed-in application screens have nothing to rank and should not dilute
  // the content pages that do.
  robots: { index: false, follow: false },
};

export default function WorkspaceRoute() {
  return (
    <Page locale="en" path={PATH} wide>
      <Workspace t={t} locale="en" />
    </Page>
  );
}
