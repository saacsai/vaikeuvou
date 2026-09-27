-- Fãs de destino (5º pilar #SouFã) — 1 post-âncora por cidade no WordPress,
-- contador de "Tbm sou fã" por post. Toggle (dá pra desmarcar), por isso é
-- linha por (user_id, wp_post_id), não um contador solto.
create table if not exists city_fans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  wp_post_id integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, wp_post_id)
);

create index if not exists city_fans_post_idx on city_fans(wp_post_id);
