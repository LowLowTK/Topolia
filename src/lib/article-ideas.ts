// src/lib/article-ideas.ts
import { supabaseService } from './supabase';

export type ArticleStatus = 'pending' | 'approved' | 'drafting' | 'draft' | 'published' | 'ignored';

export interface ArticleIdea {
  id: string;
  title: string;
  source_url: string;
  source_lang: string;
  source_name: string | null;
  excerpt: string | null;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleIdeaInput {
  title: string;
  source_url: string;
  source_lang?: string;
  source_name?: string;
  excerpt?: string;
}

/** Récupérer tous les sujets, du plus récent au plus ancien. */
export async function listArticleIdeas(): Promise<ArticleIdea[]> {
  const { data, error } = await supabaseService()
    .from('article_ideas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Supabase listArticleIdeas : ${error.message}`);
  return data as ArticleIdea[];
}

/** Créer un nouveau sujet. */
export async function createArticleIdea(input: CreateArticleIdeaInput): Promise<ArticleIdea> {
  const { data, error } = await supabaseService()
    .from('article_ideas')
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(`Supabase createArticleIdea : ${error.message}`);
  return data as ArticleIdea;
}

/** Mettre à jour le statut d'un sujet. */
export async function updateArticleStatus(id: string, status: ArticleStatus): Promise<ArticleIdea> {
  const { data, error } = await supabaseService()
    .from('article_ideas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Supabase updateArticleStatus : ${error.message}`);
  return data as ArticleIdea;
}

/** Supprimer définitivement un sujet. */
export async function deleteArticleIdea(id: string): Promise<void> {
  const { error } = await supabaseService().from('article_ideas').delete().eq('id', id);

  if (error) throw new Error(`Supabase deleteArticleIdea : ${error.message}`);
}
