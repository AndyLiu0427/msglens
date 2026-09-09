import { AboutPage } from "@/components/site/AboutPages";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

const t = getDictionary("zh");
const PATH = "/about";

export const metadata = pageMetadata({
  locale: "zh",
  path: PATH,
  title: t.nav.about,
  description: t.seo.about,
});

export default function Route() {
  return <AboutPage locale="zh" />;
}
