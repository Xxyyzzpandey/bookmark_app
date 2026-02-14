export interface Bookmark {
  id: string;
  created_at: string;
  url: string;
  title: string;
  user_id: string;
}

export type BookmarkInsert = Omit<Bookmark, 'id' | 'created_at'>;