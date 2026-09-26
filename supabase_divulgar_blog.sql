-- Opt-in de divulgação no blog vaikeuvou.app (só faz sentido pra eventos
-- "Aberto", max_depth = 999 — ver PERFIL_CRIADOR.md e CriarClient.tsx).
-- Quando true, o evento é candidato à automação de post #VamoAí? (a
-- construir na sequência).
alter table events add column if not exists divulgar_blog boolean not null default false;
