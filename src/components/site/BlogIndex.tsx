import Link from "next/link";
import { Breadcrumb, Page } from "./Page";
import { blogPosts } from "@/content/blog";
import { getDictionary } from "@/lib/i18n";
import { breadcrumbSchema } from "@/lib/metadata";
import { BLOG_LOCALES, DATE_LOCALE, localizedPath, type BlogLocale } from "@/lib/site";

export const BLOG_COPY: Record<BlogLocale, { title: string; description: string }> = {
  en: {
    title: "Blog: notes on Outlook email files",
    description:
      "Practical notes on Outlook email files: real situations, what goes wrong, and how to handle it without Outlook.",
  },
  zh: {
    title: "部落格:Outlook 郵件檔案筆記",
    description: "Outlook 郵件檔案的實用筆記:實際會遇到的情況、常見的問題,以及沒有 Outlook 時怎麼處理。",
  },
};

export function BlogIndex({ locale }: { locale: BlogLocale }) {
  const t = getDictionary(locale);
  const { title, description } = BLOG_COPY[locale];
  const posts = blogPosts(locale);

  return (
    <Page
      locale={locale}
      path="/blog"
      locales={BLOG_LOCALES}
      schemas={[
        breadcrumbSchema(locale, [
          { name: t.nav.viewer, path: "/" },
          { name: title, path: "/blog" },
        ]),
      ]}
    >
      <Breadcrumb locale={locale} title={title} />
      <h1 className="text-[30px] leading-[1.18] font-semibold tracking-tight text-ink sm:text-[36px]">
        {title}
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{description}</p>

      <ul className="mt-10 space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.date} className="text-[12.5px] text-ink-subtle">
              {new Date(post.date).toLocaleDateString(DATE_LOCALE[locale], {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
            <h2 className="mt-1 text-[19px] font-semibold tracking-tight">
              <Link href={localizedPath(`/blog/${post.slug}`, locale)} className="text-ink hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-muted">{post.description}</p>
          </li>
        ))}
      </ul>
    </Page>
  );
}
