import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/site/ArticlePage";
import { blogPost, blogPosts } from "@/content/blog";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts("en").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = blogPost("en", (await params).slug);
  if (!post) return {};
  return pageMetadata({
    locale: "en",
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.description,
    locales: ["en"],
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const post = blogPost("en", (await params).slug);
  if (!post) notFound();
  return (
    <ArticlePage
      locale="en"
      path={`/blog/${post.slug}`}
      title={post.title}
      description={post.description}
      published={post.date}
    >
      {post.body}
    </ArticlePage>
  );
}
