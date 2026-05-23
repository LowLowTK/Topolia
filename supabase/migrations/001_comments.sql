-- Table commentaires (Phase 5 Topolia)
create table comments (
  id            uuid primary key default gen_random_uuid(),
  content_id    text not null,
  content_type  text not null check (content_type in ('article', 'chantier')),
  clerk_user_id text not null,
  author_name   text not null,
  body          text not null,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz default now()
);

create index comments_content_idx on comments (content_type, content_id, status);

alter table comments enable row level security;

create policy "Public can read approved comments"
  on comments for select
  using (status = 'approved');
