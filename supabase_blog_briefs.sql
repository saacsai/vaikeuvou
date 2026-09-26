-- Fila de pautas editoriais pro blog vaikeuvou.app — captura rápida (título +
-- ideias centrais) pros 3 pilares manuais (#VaikeuFui/#Tendeu/#ProntoFalei),
-- mais entrada automática do #VamoAí? quando o opt-in de divulgação do
-- evento é ativado. Processamento é manual, via Claude Code, lendo
-- PERFIL_CRIADOR.md como referência de voz (ver STATUS.md, 2026-09-26).
create table if not exists blog_briefs (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('VaikeuFui', 'Tendeu', 'ProntoFalei', 'VamoAi')),
  titulo text not null,
  ideias_centrais text not null,
  status text not null default 'pendente' check (status in ('pendente', 'gerado')),
  event_id uuid references events(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists blog_briefs_status_idx on blog_briefs(status);
