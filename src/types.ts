export interface Category {
  id: string;
  slug: string;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  order: number;
  icon: string;
}

export interface Section {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  order: number;
  icon?: string;
  /** When present, the section renders as a single article page instead of an article list. */
  bodyMarkdown?: string;
  bodyMarkdown_ar?: string;
  updatedAt?: string;
}

export interface Group {
  id: string;
  sectionId: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  order: number;
}

export interface Article {
  id: string;
  sectionId: string;
  groupId?: string;
  slug: string;
  title: string;
  title_ar?: string;
  summary: string;
  summary_ar?: string;
  bodyMarkdown: string;
  bodyMarkdown_ar?: string;
  updatedAt: string;
  tags: string[];
  isTop?: boolean;
  isFeatured?: boolean;
  /** Target audience roles for filtering (e.g., ['student'], ['teacher', 'admin']). Undefined = visible to all. */
  role?: string[];
}

export interface SearchResult {
  article: Article;
  score: number;
  matches: string[]; // Snippet of where match occurred
}

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  grade: string;
  /** Base64 data URL for uploaded files */
  fileData?: string;
  fileName?: string;
  fileType?: string;
  /** External link URL */
  link?: string;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  body: string;
  coverImage?: string;
  tags?: string[];
  authorId: string;
  authorName: string;
  publishedAt: string;
  updatedAt?: string;
  likes: number;
  comments: number;
  status: 'draft' | 'published';
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface BlogLike {
  postId: string;
  userId: string;
}

export interface Tutorial {
  id: string;
  title: string;
  title_ar?: string | null;
  description: string | null;
  description_ar?: string | null;
  audience?: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}