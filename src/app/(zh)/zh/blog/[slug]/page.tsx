import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/site/ArticlePage";
import { blogPost, blogPosts } from "@/content/blog";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts("zh").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = blogPost("zh", (await params).slug);
  if (!post) return {};
  return pageMetadata({
    locale: "zh",
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.description,
    locales: ["zh"],
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const post = blogPost("zh", (await params).slug);
  if (!post) notFound();
  return (
    <ArticlePage
      locale="zh"
      path={`/blog/${post.slug}`}
      title={post.title}
      description={post.description}
      published={post.date}
    >
      {post.body}
    </ArticlePage>
  );
}
