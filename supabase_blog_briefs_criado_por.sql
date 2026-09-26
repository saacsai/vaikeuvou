-- Quem mandou a pauta (telefone) — nulo nas entradas automáticas do #VamoAí?
-- (vêm de evento, não de uma pessoa autorizada na fila). Admin vê todas;
-- editor (não-admin) só vê as próprias, filtrado por esse campo.
alter table blog_briefs add column if not exists criado_por text;
