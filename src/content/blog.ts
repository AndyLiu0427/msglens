import type { ReactNode } from "react";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/site";
import { blogEn } from "./blog-en";
import { blogZh } from "./blog-zh";

export interface BlogPost {
  slug: string;
  /** YYYY-MM-DD. The post goes live on the first build on or after this day (Taipei time). */
  date: string;
  title: string;
  description: string;
  body: ReactNode;
}

const POSTS: Record<BlogLocale, readonly BlogPost[]> = { en: blogEn, zh: blogZh };

// ponytail: drafts go live on a daily rebuild; a static export has no clock of its own.
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });

/** Published posts, newest first. */
export function blogPosts(locale: BlogLocale): BlogPost[] {
  return POSTS[locale].filter((p) => p.date <= today).sort((a, b) => b.date.localeCompare(a.date));
}

export function blogPost(locale: BlogLocale, slug: string): BlogPost | undefined {
  return blogPosts(locale).find((p) => p.slug === slug);
}

/** Every blog URL path that exists right now, per locale (for the sitemap and IndexNow). */
export function blogPaths(): Array<{ locale: BlogLocale; path: string; date?: string }> {
  return BLOG_LOCALES.flatMap((locale) => {
    const posts = blogPosts(locale);
    if (posts.length === 0) return [];
    return [
      { locale, path: "/blog", date: posts[0].date },
      ...posts.map((p) => ({ locale, path: `/blog/${p.slug}`, date: p.date })),
    ];
  });
}
