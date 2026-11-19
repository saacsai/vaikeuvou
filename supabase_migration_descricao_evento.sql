-- vaikeuvou.app — adiciona campo de descrição neutra do evento, separado do
-- recado pessoal do anfitrião ("Comentários", coluna `description`).
--
-- Contexto: a coluna `description` nasceu como "Detalhes" (descrição geral)
-- e foi deliberadamente renomeada pra "Comentários" em 16/08/2026 (commit
-- 8d393be), virando o recado pessoal exibido como citação na página pública.
-- Luciano sentiu falta de um campo de descrição neutra — esta migration cria
-- um segundo campo pra isso, sem mexer no `description` existente.

alter table events add column if not exists descricao_evento text;
