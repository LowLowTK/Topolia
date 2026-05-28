import { supabaseAnon, supabaseService } from './supabase';

export type CommentContentType = 'article' | 'chantier';
export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  content_id: string;
  content_type: CommentContentType;
  clerk_user_id: string;
  author_name: string;
  body: string;
  status: CommentStatus;
  created_at: string;
}

const MAX_BODY_LENGTH = 2000;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface CreateCommentInput {
  contentId: string;
  contentType: CommentContentType;
  body: string;
  clerkUserId: string;
  authorName: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateInput(input: {
  contentId?: unknown;
  contentType?: unknown;
  body?: unknown;
}): ValidationError | null {
  const { contentId, contentType, body } = input;

  if (
    typeof contentType !== 'string' ||
    (contentType !== 'article' && contentType !== 'chantier')
  ) {
    return { field: 'contentType', message: "contentType doit être 'article' ou 'chantier'." };
  }
  if (typeof contentId !== 'string' || contentId.length === 0 || contentId.length > 200) {
    return { field: 'contentId', message: 'contentId requis (1-200 caractères).' };
  }
  if (!SLUG_REGEX.test(contentId)) {
    return { field: 'contentId', message: 'contentId doit être en kebab-case.' };
  }
  if (typeof body !== 'string') {
    return { field: 'body', message: 'body requis.' };
  }
  const trimmed = body.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_BODY_LENGTH) {
    return {
      field: 'body',
      message: `body doit faire 1-${MAX_BODY_LENGTH} caractères après trim.`,
    };
  }
  return null;
}

export async function insertComment(input: CreateCommentInput): Promise<Comment> {
  const client = supabaseService();
  const { data, error } = await client
    .from('comments')
    .insert({
      content_id: input.contentId,
      content_type: input.contentType,
      clerk_user_id: input.clerkUserId,
      author_name: input.authorName,
      body: input.body.trim(),
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Supabase insert failed: ${error?.message ?? 'unknown'}`);
  }
  return data as Comment;
}

export async function listApprovedComments(
  contentType: CommentContentType,
  contentId: string,
): Promise<Comment[]> {
  const { data, error } = await supabaseAnon()
    .from('comments')
    .select('id, content_id, content_type, clerk_user_id, author_name, body, status, created_at')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Supabase select failed: ${error.message}`);
  }
  return (data ?? []) as Comment[];
}
