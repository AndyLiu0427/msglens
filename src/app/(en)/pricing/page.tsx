import { PricingPage } from "@/components/site/PricingPage";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

const t = getDictionary("en");
const PATH = "/pricing";

export const metadata = pageMetadata({
  locale: "en",
  path: PATH,
  title: t.nav.pricing,
  description: t.seo.pricing,
});

export default function Route() {
  return <PricingPage locale="en" />;
}
