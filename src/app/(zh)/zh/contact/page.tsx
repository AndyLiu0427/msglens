import { ContactPage } from "@/components/site/AboutPages";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

const t = getDictionary("zh");
const PATH = "/contact";

export const metadata = pageMetadata({
  locale: "zh",
  path: PATH,
  title: t.nav.contact,
  description: t.seo.contact,
});

export default function Route() {
  return <ContactPage locale="zh" />;
}
