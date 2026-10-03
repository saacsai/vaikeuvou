-- Perfil do organizador/parceiro que roda o evento (empresa de turismo,
-- agência, etc.) — necessário pro post #VamoAí? automático, que precisa
-- creditar "quem está organizando" e não tem como saber isso sozinho a
-- partir só do evento. Opcional, usado sobretudo quando divulgar_blog=true.
alter table events
  add column if not exists organizador_nome text,
  add column if not exists organizador_descricao text,
  add column if not exists organizador_endereco text,
  add column if not exists organizador_contato text,
  add column if not exists organizador_horario text,
  add column if not exists organizador_link text;
