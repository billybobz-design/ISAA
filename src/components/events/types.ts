export interface EventCard {
  id: string
  title: string
  cover_image_url: string | null
  category: string | null
  event_date: string
  location: string | null
  registration_deadline: string | null
  subject_tags: string[] | null
  school_tags: string[] | null
  organizer: {
    display_name: string | null
    school: string | null
  } | null
}
