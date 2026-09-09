import { Page } from "@/components/site/Page";
import { InviteAccept } from "@/components/workspace/InviteAccept";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary("en");

export const metadata = {
  title: t.workspace.inviteTitle,
  robots: { index: false, follow: false },
};

export default function InviteRoute() {
  return (
    <Page locale="en" path="/invite">
      <InviteAccept t={t} />
    </Page>
  );
}
