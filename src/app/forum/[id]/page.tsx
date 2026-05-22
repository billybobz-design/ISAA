import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CornerUpLeft } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { CommentSection } from "@/components/forum/comment-section"
import { LikeButton } from "@/components/forum/like-button"
import { ShareButton } from "@/components/forum/share-button"
import { Metadata } from 'next'
import { createServerSupabaseClient } from "@/lib/server-supabase"

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise
  const supabase = await createServerSupabaseClient()
  const { data: article } = await supabase.from("articles").select("title, abstract").eq("id", params.id).single()
  return {
    title: `${article?.title || 'Article'} | ISAA Forum`,
    description: article?.abstract || "Read academic research on the ISAA Platform.",
  }
}

export default async function ArticleDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const supabase = await createServerSupabaseClient()
  // Fetch article with counts
  const { data: article } = await supabase
    .from("articles")
    .select(`
      *,
      author:users(display_name, avatar_url, school, bio),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq("id", params.id)
    .single()

  if (!article) {
    notFound()
  }

  const initialLikes = article.likes_count[0]?.count || 0
  const authorName = article.author?.display_name || "Unknown Author"
  const authorSchool = article.author?.school || "School not provided"
  const authorBio = article.author?.bio || "No bio available."

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
      <Link href="/forum" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <CornerUpLeft className="mr-2 h-4 w-4" /> Back to Forum
      </Link>

      <article className="space-y-8">
        {/* Header content ... */}
        <header className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(article.subject_tags || []).map((tag: string) => (
              <Badge key={tag} variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 font-normal">{tag}</Badge>
            ))}
            {(article.school_tags || []).map((tag: string) => (
              <Badge key={tag} variant="outline" className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200 font-normal">{tag}</Badge>
            ))}
            {!(article.subject_tags?.length || article.school_tags?.length) && (
              <Badge variant="outline" className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200 font-normal">Academic Research</Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-primary leading-tight tracking-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-y border-slate-100">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-serif font-bold text-xl text-center">
                {authorName.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">{authorName}</p>
                <p className="text-sm text-muted-foreground">{authorSchool}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground md:text-right">
              <p>Published on</p>
              <p className="font-medium text-foreground">{format(new Date(article.created_at), "MMMM d, yyyy")}</p>
            </div>
          </div>
        </header>

        <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 italic text-lg text-slate-600 leading-relaxed font-serif text-center">
          &ldquo;{article.abstract}&rdquo;
        </div>

        <div className="article-content prose prose-slate max-w-none font-sans leading-relaxed text-slate-800">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]} 
            rehypePlugins={[rehypeKatex]}
            components={{
              img: ({ src, ...props }) => {
                if (!src) return null;
                return <img src={src} alt={props.alt ?? ""} {...props} />;
              }
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Actions - Now using components */}
        <div className="flex items-center justify-between py-8 border-t border-slate-100 mt-12">
          <div className="flex items-center space-x-6">
            <LikeButton articleId={article.id} initialCount={initialLikes} />
            <ShareButton />
          </div>
        </div>

        {/* Author Bio Section ... */}
        <section className="bg-slate-50 rounded-2xl p-8 mt-12 border border-slate-100">
          <h3 className="font-serif font-bold text-xl mb-4">About the Author</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-serif font-bold text-2xl shrink-0 text-center">
              {authorName.charAt(0)}
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-lg">{authorName}</h4>
              <p className="text-muted-foreground leading-relaxed italic">
                {authorBio}
              </p>
              <div className="pt-2">
                <Link href={`/profile/${article.author_id}`}>
                  <Button variant="link" className="p-0 text-primary h-auto font-medium">View full academic profile &rarr;</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Comments Section */}
        <CommentSection articleId={article.id} />
      </article>

      <style dangerouslySetInnerHTML={{ __html: `
        .article-content {
          font-family: var(--font-sans);
          font-size: 1.125rem;
          line-height: 1.75;
          color: oklch(0.2 0.02 240);
        }
        .article-content h1, .article-content h2, .article-content h3 {
          font-family: var(--font-serif);
          font-weight: 700;
          color: oklch(0.25 0.05 250);
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .article-content h2 { font-size: 1.875rem; }
        .article-content h3 { font-size: 1.5rem; }
        .article-content p { margin-bottom: 1.5rem; }
        .article-content ul, .article-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        .article-content li { margin-bottom: 0.5rem; }
        .article-content blockquote {
          border-left: 4px solid oklch(0.25 0.05 250);
          padding-left: 1.5rem;
          font-style: italic;
          color: oklch(0.45 0.02 240);
          margin: 2rem 0;
        }
        .article-content code {
          background-color: oklch(0.96 0.01 240);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
      `}} />
    </div>
  )
}
