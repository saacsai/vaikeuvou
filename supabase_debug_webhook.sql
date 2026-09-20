create table webhook_debug (
  id         uuid primary key default gen_random_uuid(),
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
