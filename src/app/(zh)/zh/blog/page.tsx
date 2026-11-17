import { BLOG_COPY, BlogIndex } from "@/components/site/BlogIndex";
import { pageMetadata } from "@/lib/metadata";
import { BLOG_LOCALES } from "@/lib/site";

export const metadata = pageMetadata({
  locale: "zh",
  path: "/blog",
  ...BLOG_COPY.zh,
  locales: BLOG_LOCALES,
});

export default function Page() {
  return <BlogIndex locale="zh" />;
}
