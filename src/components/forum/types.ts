export interface ForumArticleCard {
  id: string
  title: string
  abstract: string | null
  created_at: string
  subject_tags: string[] | null
  school_tags: string[] | null
  author: {
    id: string
    display_name: string | null
    avatar_url: string | null
    school: string | null
  } | null
  likes_count: Array<{ count: number }>
  comments_count: Array<{ count: number }>
}
